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

    // 格式化对话数据 - 只包含有消息的对话
    const formattedConversations = conversations
      .filter(conv => conv.messages.length > 0) // 🔥 关键：只返回有消息的对话
      .map(conv => {
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
          message: lastMessage.content, // 🔥 关键：确保有消息内容
          time: formatTime(lastMessage.created_at),
          avatar: otherUser.avatar_url ? { uri: otherUser.avatar_url } : null,
          kind,
          unread: !lastMessage.is_read && lastMessage.sender_id !== dbUser.id,
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

    // 查找用户的 TOP Support 对话（双向匹配，避免重复创建）
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
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });

    // 构建 TOP Support 对话显示 - 只显示有消息的对话
    let topSupportConversation = null;
    if (supportConversation && supportConversation.messages.length > 0) {
      const lastMessage = supportConversation.messages[0];
      topSupportConversation = {
        id: "support-1",
        sender: "TOP Support",
        message: lastMessage.content,
        time: formatTime(lastMessage.created_at),
        avatar: "https://via.placeholder.com/48/FF6B6B/FFFFFF?text=TOP", // TOP Support 头像
        kind: "support",
        unread: false,
        lastFrom: lastMessage.sender_id === dbUser.id ? "me" : "support",
        order: null
      };
    }
    // 🔥 关键：如果没有消息，不显示 TOP Support 对话

    // 过滤掉其他对话中的 TOP Support 对话，避免重复
    const otherConversations = formattedConversations.filter(conv => 
      !(conv.sender === "TOP Support" || conv.kind === "support")
    );
    
    // 将Support对话放在最前面（如果有的话）
    const allConversations = [
      ...(topSupportConversation ? [topSupportConversation] : []),
      ...otherConversations
    ].filter(Boolean); // 🔥 关键：过滤掉 null/undefined 值

    return NextResponse.json({ conversations: allConversations });

  } catch (error) {
    console.error("Error fetching conversations:", error);
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

    // 🔥 检查是否已存在对话（双向匹配 + 类型匹配）
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            initiator_id: dbUser.id,
            participant_id: participant_id,
            type: type as "ORDER" | "SUPPORT" | "GENERAL"
          },
          {
            initiator_id: participant_id,
            participant_id: dbUser.id,
            type: type as "ORDER" | "SUPPORT" | "GENERAL"
          }
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

    if (existingConversation) {
      console.debug(`✅ Found existing conversation: ${existingConversation.id}`);
      return NextResponse.json({ conversation: existingConversation });
    }

    // 创建新对话
    const conversation = await prisma.conversations.create({
      data: {
        initiator_id: dbUser.id,
        participant_id: participant_id,
        listing_id: listing_id || null,
        type: type as "ORDER" | "SUPPORT" | "GENERAL",
        status: "ACTIVE",
        last_message_at: new Date()
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

    console.debug(`✅ Created new conversation: ${conversation.id} (${type})`);
    return NextResponse.json({ conversation });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}