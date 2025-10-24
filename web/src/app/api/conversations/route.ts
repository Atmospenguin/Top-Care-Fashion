import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/conversations - 获取当前用户的所有对话
export async function GET(request: NextRequest) {
  try {
    // 获取认证token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 验证Supabase token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 获取用户信息
    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
      select: { id: true, username: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查conversations表是否存在
    try {
      // 获取用户的所有对话
      const conversations = await prisma.conversations.findMany({
        where: {
          OR: [
            { initiator_id: dbUser.id },
            { participant_id: dbUser.id }
          ],
          status: "ACTIVE"
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
          },
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        },
        orderBy: { last_message_at: "desc" }
      });

    // 格式化对话数据
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.initiator_id === dbUser.id ? conv.participant : conv.initiator;
      const lastMessage = conv.messages[0];
      
      // 确定对话类型
      let kind = "general";
      if (conv.type === "SUPPORT") {
        kind = "support";
      } else if (conv.type === "ORDER" && conv.listing) {
        kind = "order";
      }

      // 确定最后消息来源
      let lastFrom = "other";
      if (lastMessage) {
        if (lastMessage.sender_id === dbUser.id) {
          lastFrom = "me";
        } else if (conv.type === "SUPPORT") {
          lastFrom = "support";
        } else if (conv.initiator_id === dbUser.id) {
          lastFrom = "buyer";
        } else {
          lastFrom = "seller";
        }
      }

      return {
        id: conv.id.toString(),
        sender: otherUser.username,
        message: lastMessage?.content || "No messages yet",
        time: lastMessage?.created_at ? formatTime(lastMessage.created_at) : formatTime(conv.created_at),
        avatar: otherUser.avatar_url ? { uri: otherUser.avatar_url } : null,
        kind,
        unread: lastMessage ? !lastMessage.is_read && lastMessage.sender_id !== dbUser.id : false,
        lastFrom,
        order: conv.listing ? {
          id: conv.listing.id.toString(),
          product: {
            title: conv.listing.name,
            price: Number(conv.listing.price),
            size: conv.listing.size,
            image: conv.listing.image_url || (conv.listing.image_urls as any)?.[0] || null
          },
          seller: { name: conv.initiator.username },
          status: "Active" // 可以根据实际状态更新
        } : null
      };
    });

    // 添加固定的TOP Support对话
    const supportConversation = {
      id: "support-1",
      sender: "TOP Support",
      message: `Hey @${dbUser.username}, Welcome to TOP! 👋`,
      time: "1 month ago",
      avatar: null, // 使用默认TOP头像
      kind: "support",
      unread: false,
      lastFrom: "support",
      order: null
    };

      // 将Support对话放在最前面
      const allConversations = [supportConversation, ...formattedConversations];

      return NextResponse.json({ conversations: allConversations });

    } catch (tableError) {
      console.error("Conversations table not found, returning empty list:", tableError);
      // 如果表不存在，返回只有Support对话的列表
      return NextResponse.json({ 
        conversations: [supportConversation] 
      });
    }

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/conversations - 创建新对话
export async function POST(request: NextRequest) {
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
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { participant_id, listing_id, type = "ORDER" } = await request.json();

    // 检查是否已存在对话
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            initiator_id: dbUser.id,
            participant_id: participant_id,
            listing_id: listing_id || null
          },
          {
            initiator_id: participant_id,
            participant_id: dbUser.id,
            listing_id: listing_id || null
          }
        ]
      }
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // 创建新对话
    const conversation = await prisma.conversations.create({
      data: {
        initiator_id: dbUser.id,
        participant_id: participant_id,
        listing_id: listing_id || null,
        type: type as "ORDER" | "SUPPORT" | "GENERAL"
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

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 格式化时间
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}
