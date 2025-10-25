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
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId: rawId } = await params; // ✅ 获取真正的参数

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
          sender: msg.message_type === "SYSTEM" ? undefined : (msg.sender_id === dbUser.id ? "me" : "other"),
          text: msg.content,
          time: formatTime(msg.created_at),
          sentByUser: msg.sender_id === dbUser.id,
          senderInfo: {
            id: msg.sender.id,
            username: msg.sender.username,
            avatar: msg.sender.avatar_url
          }
        }));

        // 检查是否有欢迎消息，如果没有则添加
        const hasWelcomeMessage = formattedMessages.some(msg => 
          msg.text.includes('Welcome to TOP') && msg.senderInfo?.username === 'TOP Support'
        );

        let finalMessages = formattedMessages;
        if (!hasWelcomeMessage) {
          // 在消息列表开头添加欢迎消息
          const welcomeMessage = {
            id: "welcome-temp",
            type: "SYSTEM",
            sender: "support",
            text: `Hey @${dbUser.username}, Welcome to TOP! 👋`,
            time: "Just now",
            sentByUser: false,
            senderInfo: { id: SUPPORT_USER_ID, username: "TOP Support", avatar: null }
          };
          finalMessages = [welcomeMessage, ...formattedMessages];
        }

        return NextResponse.json({
          conversation: {
            id: "support-1",
            type: "SUPPORT",
            otherUser: { id: SUPPORT_USER_ID, username: "TOP Support", avatar: null }
          },
          messages: finalMessages
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
            size: true,
            description: true,
            brand: true,
            condition_type: true,
            material: true,
            gender: true,
            tags: true
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
      sender: msg.message_type === "SYSTEM" ? undefined : (msg.sender_id === dbUser.id ? "me" : "other"),
      text: msg.content,
      time: formatTime(msg.created_at),
      sentByUser: msg.message_type === "SYSTEM",
      senderInfo: {
        id: msg.sender.id,
        username: msg.sender.username,
        avatar: msg.sender.avatar_url
      }
    }));

    const otherUser = conversation.initiator_id === dbUser.id ? conversation.participant : conversation.initiator;
    
    // 🔥 修复：正确判断买家卖家身份
    // 在订单对话中，initiator 是买家（发起聊天的人），participant 是卖家（被联系的人）
    const buyer = conversation.initiator;
    const seller = conversation.participant;
    
    // 🔍 调试：查看listing数据
    console.log("🔍 Listing data:", {
      id: conversation.listing?.id,
      name: conversation.listing?.name,
      image_url: conversation.listing?.image_url,
      image_urls: conversation.listing?.image_urls,
      image_urls_type: typeof conversation.listing?.image_urls,
      image_urls_length: Array.isArray(conversation.listing?.image_urls) ? conversation.listing.image_urls.length : "not array",
      final_image: conversation.listing ? ((conversation.listing.image_urls as any)?.[0] || conversation.listing.image_url || "https://via.placeholder.com/64x64/f0f0f0/999999?text=No+Image") : "No listing"
    });
    
    // 🔍 调试：检查conversation是否有listing
    console.log("🔍 Conversation has listing:", !!conversation.listing);
    console.log("🔍 Conversation listing_id:", conversation.listing_id);
    
    // 🔍 调试：查看conversation数据
    console.log("🔍 Conversation data:", {
      initiator_id: conversation.initiator_id,
      participant_id: conversation.participant_id,
      initiator_username: conversation.initiator.username,
      participant_username: conversation.participant.username,
      current_user_id: dbUser.id,
      current_user_username: dbUser.username
    });
    
    // 🔥 查询真实订单状态（如果有订单的话）
    let existingOrder = null;
    if (conversation.listing) {
      try {
        existingOrder = await prisma.orders.findFirst({
          where: {
            listing_id: conversation.listing.id,
            OR: [
              { buyer_id: dbUser.id },
              { seller_id: dbUser.id }
            ]
          },
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
                avatar_url: true
              }
            },
            seller: {
              select: {
                id: true,
                username: true,
                avatar_url: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        });
        console.log("🔍 Found existing order:", existingOrder?.id, "Status:", existingOrder?.status);
      } catch (error) {
        console.error("❌ Error querying order:", error);
      }
    }

    // 添加订单卡片（如果是订单对话）
    const orderCard = conversation.listing ? {
      id: "order-card",
      type: "orderCard",
      order: {
        id: existingOrder ? existingOrder.id.toString() : conversation.listing.id.toString(),
        product: {
          title: conversation.listing.name,
          price: Number(conversation.listing.price),
          size: conversation.listing.size,
image: (() => {
            // 🔥 处理image_urls字段 - 可能是JSON字符串或数组
            let imageUrls = conversation.listing.image_urls;
            if (typeof imageUrls === 'string') {
              try {
                imageUrls = JSON.parse(imageUrls);
              } catch (e) {
                imageUrls = null;
              }
            }
            
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              return imageUrls[0];
            }
            
            if (conversation.listing.image_url) {
              return conversation.listing.image_url;
            }
            
            return "https://via.placeholder.com/64x64/f0f0f0/999999?text=No+Image";
          })()
        },
        seller: { 
          name: existingOrder ? existingOrder.seller.username : seller.username,
          avatar: existingOrder ? existingOrder.seller.avatar_url : seller.avatar_url
        },
        buyer: {
          name: existingOrder ? existingOrder.buyer.username : buyer.username,
          avatar: existingOrder ? existingOrder.buyer.avatar_url : buyer.avatar_url
        },
        status: existingOrder ? existingOrder.status : "Inquiry"
      }
    } : null;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        type: conversation.type,
        initiator_id: conversation.initiator_id, // 🔥 添加initiator_id字段
        participant_id: conversation.participant_id, // 🔥 添加participant_id字段
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar_url
        }
      },
      messages: orderCard ? [orderCard, ...formattedMessages] : formattedMessages,
      order: conversation.listing ? {
        id: existingOrder ? existingOrder.id.toString() : conversation.listing.id.toString(),
        product: {
          title: conversation.listing.name,
          price: Number(conversation.listing.price),
          size: conversation.listing.size,
image: (() => {
            // 🔥 处理image_urls字段 - 可能是JSON字符串或数组
            let imageUrls = conversation.listing.image_urls;
            if (typeof imageUrls === 'string') {
              try {
                imageUrls = JSON.parse(imageUrls);
              } catch (e) {
                imageUrls = null;
              }
            }
            
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              return imageUrls[0];
            }
            
            if (conversation.listing.image_url) {
              return conversation.listing.image_url;
            }
            
            return "https://via.placeholder.com/64x64/f0f0f0/999999?text=No+Image";
          })()
        },
        seller: { 
          name: existingOrder ? existingOrder.seller.username : seller.username,
          avatar: existingOrder ? existingOrder.seller.avatar_url : seller.avatar_url
        },
        buyer: {
          name: existingOrder ? existingOrder.buyer.username : buyer.username,
          avatar: existingOrder ? existingOrder.buyer.avatar_url : buyer.avatar_url
        },
        status: existingOrder ? existingOrder.status : "Inquiry"
      } : null
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[conversationId] - 发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId: rawId } = await params; // ✅ 获取真正的参数

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

    const { content, message_type = "TEXT", sentByUser } = await request.json();
    
    console.log("📥 Received message:", { content, message_type, conversationId: rawId });
    
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
      where: { id: conversation.id },
      data: { last_message_at: message.created_at }
    });

    return NextResponse.json({
      message: {
        id: message.id.toString(),
        type: message_type === "SYSTEM" ? "system" : "msg",
        sender: message_type === "SYSTEM" ? undefined : "me",
        text: message.content,
        time: formatTime(message.created_at),
        sentByUser: true, // 当前用户发送的消息
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

    const { content, message_type = "TEXT", sentByUser } = await request.json();
    
    console.log("📥 Received message (regular conversation):", { content, message_type, conversationId });

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
        sender: message.message_type === "SYSTEM" ? undefined : "me",
        text: message.content,
        time: formatTime(message.created_at),
        sentByUser: true, // 当前用户发送的消息
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