import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// 🔒 安全检查
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY");
}

// 🔧 获取 TOP Support 用户 ID
const SUPPORT_USER_ID = Number(process.env.SUPPORT_USER_ID) || 59;

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/messages/[conversationId] - 获取对话中的所有消息
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const rawId = params.conversationId; // ✅ 获取真正的参数

  // 🩹 support- 对话特殊处理 - 查询真实对话
  if (rawId.startsWith("support-")) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      const dbUser = await prisma.users.findUnique({
        where: { supabase_user_id: user.id },
        select: { id: true, username: true }
      });

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // 查找真实的 TOP Support 对话
      const supportConversation = await prisma.conversations.findFirst({
        where: {
          OR: [
            { initiator_id: dbUser.id, participant_id: SUPPORT_USER_ID },
            { initiator_id: SUPPORT_USER_ID, participant_id: dbUser.id }
          ],
          type: "SUPPORT"
        },
        include: {
          messages: {
            orderBy: { created_at: "asc" },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatar_url: true
                }
              }
            }
          }
        }
      });

      if (supportConversation && supportConversation.messages.length > 0) {
        // 返回真实的对话和消息
        const formattedMessages = supportConversation.messages.map(msg => ({
          id: msg.id.toString(),
          type: msg.message_type === "SYSTEM" ? "system" : "msg",
          sender: msg.sender_id === dbUser.id ? "me" : "other",
          text: msg.content,
          time: formatTime(msg.created_at),
          senderInfo: {
            id: msg.sender.id,
            username: msg.sender.username,
            avatar: msg.sender.avatar_url
          }
        }));

        return NextResponse.json({
          conversation: {
            id: "support-1",
            type: "SUPPORT",
            otherUser: { id: SUPPORT_USER_ID, username: "TOP Support", avatar: null }
          },
          messages: formattedMessages
        });
      } else {
        // 没有对话时返回欢迎消息
        return NextResponse.json({
          conversation: {
            id: "support-1",
            type: "SUPPORT",
            otherUser: { id: SUPPORT_USER_ID, username: "TOP Support", avatar: null }
          },
          messages: [
            {
              id: "temp-1",
              type: "SYSTEM",
              sender: "support",
              text: `Hey @${dbUser.username}, Welcome to TOP! 👋`,
              time: "Just now",
              senderInfo: { id: SUPPORT_USER_ID, username: "TOP Support", avatar: null }
            }
          ]
        });
      }
    } catch (error) {
      console.debug("Auth error in support fallback:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const conversationId = Number(rawId);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
      select: { id: true, username: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 验证用户是否有权限访问这个对话
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { initiator_id: dbUser.id },
          { participant_id: dbUser.id }
        ]
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        participant: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        listing: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
            image_urls: true,
            size: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 获取对话中的所有消息
    const messages = await prisma.messages.findMany({
      where: { conversation_id: conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      },
      orderBy: { created_at: "asc" }
    });

    // 标记消息为已读
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        receiver_id: dbUser.id,
        is_read: false
      },
      data: { is_read: true }
    });

    // 更新对话的最后消息时间
    if (messages.length > 0) {
      await prisma.conversations.update({
        where: { id: conversationId },
        data: { last_message_at: messages[messages.length - 1].created_at }
      });
    }

    // 格式化消息数据
    const formattedMessages = messages.map(msg => ({
      id: msg.id.toString(),
      type: msg.message_type === "SYSTEM" ? "system" : "msg",
      sender: msg.sender_id === dbUser.id ? "me" : "other",
      text: msg.content,
      time: formatTime(msg.created_at),
      senderInfo: {
        id: msg.sender.id,
        username: msg.sender.username,
        avatar: msg.sender.avatar_url
      }
    }));

    // 添加订单卡片（如果是订单对话）
    const orderCard = conversation.listing ? {
      id: "order-card",
      type: "orderCard",
      order: {
        id: conversation.listing.id.toString(),
        product: {
          title: conversation.listing.name,
          price: Number(conversation.listing.price),
          size: conversation.listing.size,
          image: conversation.listing.image_url || (conversation.listing.image_urls as any)?.[0] || null
        },
        seller: { name: conversation.initiator.username },
        status: "Active"
      }
    } : null;

    const otherUser = conversation.initiator_id === dbUser.id ? conversation.participant : conversation.initiator;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar_url
        }
      },
      messages: orderCard ? [orderCard, ...formattedMessages] : formattedMessages
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[conversationId] - 发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const rawId = params.conversationId; // ✅ 获取真正的参数

  // 🩹 处理 support-1 虚拟对话
  if (rawId.startsWith("support-")) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
      select: { id: true, username: true, avatar_url: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 查找或创建 TOP Support 对话（双向匹配，避免重复创建）
    let conversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          { initiator_id: dbUser.id, participant_id: SUPPORT_USER_ID },
          { initiator_id: SUPPORT_USER_ID, participant_id: dbUser.id }
        ],
        type: "SUPPORT"
      }
    });

    if (!conversation) {
      // 创建新的 TOP Support 对话
      conversation = await prisma.conversations.create({
        data: {
          initiator_id: dbUser.id,
          participant_id: SUPPORT_USER_ID, // TOP Support
          type: "SUPPORT",
          status: "ACTIVE"
        }
      });
    }

    // 创建消息
    const message = await prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_id: dbUser.id,
        receiver_id: SUPPORT_USER_ID, // TOP Support
        content: content.trim(),
        message_type: "TEXT"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });

    // 更新对话的最后消息时间
    await prisma.conversations.update({
      where: { id: conversation.id },
      data: { last_message_at: message.created_at }
    });

    return NextResponse.json({
      message: {
        id: message.id.toString(),
        type: "msg",
        sender: "me",
        text: message.content,
        time: formatTime(message.created_at),
        senderInfo: {
          id: message.sender.id,
          username: message.sender.username,
          avatar: message.sender.avatar_url
        }
      }
    });
  }

  const conversationId = Number(rawId);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
      select: { id: true, username: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { content, message_type = "TEXT" } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 验证用户是否有权限发送消息到这个对话
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { initiator_id: dbUser.id },
          { participant_id: dbUser.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 确定接收者
    const receiver_id = conversation.initiator_id === dbUser.id 
      ? conversation.participant_id 
      : conversation.initiator_id;

    // 创建消息
    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: dbUser.id,
        receiver_id: receiver_id,
        content: content.trim(),
        message_type: message_type as "TEXT" | "IMAGE" | "SYSTEM"
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });

    // 更新对话的最后消息时间
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: message.created_at }
    });

    return NextResponse.json({
      message: {
        id: message.id.toString(),
        type: message.message_type === "SYSTEM" ? "system" : "msg",
        sender: "me",
        text: message.content,
        time: formatTime(message.created_at),
        senderInfo: {
          id: message.sender.id,
          username: message.sender.username,
          avatar: message.sender.avatar_url
        }
      }
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 格式化时间
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return "Now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}