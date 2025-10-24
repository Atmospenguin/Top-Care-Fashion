import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/messages/[conversationId] - 获取对话中的所有消息
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
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

    const conversationId = parseInt(params.conversationId);
    
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

    const conversationId = parseInt(params.conversationId);
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
