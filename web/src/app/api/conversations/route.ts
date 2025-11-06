import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// 🔒 安全检查
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY");
}

// 🔧 获取 TOP Support 用户 ID
const SUPPORT_USER_ID = Number(process.env.SUPPORT_USER_ID) || 59;

// GET /api/conversations - 获取当前用户的所有对话
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    const dbUser = sessionUser
      ? { id: sessionUser.id, username: sessionUser.username }
      : null;

    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取用户的所有对话（只显示ACTIVE状态的对话）
    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [
          { initiator_id: dbUser.id },
          { participant_id: dbUser.id }
        ],
        status: "ACTIVE" // 🔥 只显示活跃的对话，已归档的不显示
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
    const formattedConversations = await Promise.all(
      conversations
        .filter(conv => conv.messages.length > 0) // 🔥 关键：只返回有消息的对话
        .map(async (conv) => {
          const otherUser = conv.initiator_id === dbUser.id ? conv.participant : conv.initiator;
          const lastMessage = conv.messages[0];
          let lastTextMessage = null;
          if (lastMessage?.message_type === "SYSTEM") {
            lastTextMessage = await prisma.messages.findFirst({
              where: {
                conversation_id: conv.id,
                message_type: "TEXT"
              },
              orderBy: { created_at: "desc" }
            });
          }
          
          // 确定对话类型
          let kind = "general";
          if (conv.type === "SUPPORT") {
            kind = "support";
          } else if (conv.type === "ORDER" && conv.listing) {
            kind = "order";
          }

          // 🔥 修复：正确确定最后消息来源
          let lastFrom = "other";
          if (lastMessage) {
            if (conv.type === "SUPPORT") {
              lastFrom = "support";
            } else {
              // 🔥 关键修复：根据当前用户在对话中的角色来确定lastFrom
              // initiator = 买家，participant = 卖家
              if (conv.initiator_id === dbUser.id) {
                // 当前用户是initiator（买家），这是与卖家的对话
                lastFrom = "seller";
              } else {
                // 当前用户是participant（卖家），这是与买家的对话
                lastFrom = "buyer";
              }
            }
          }

          // 🔥 检查是否需要显示"Leave Review"消息
          let displayMessage = lastMessage.content;
          let displayTime = formatTime(lastMessage.created_at);
          console.log("🔍 Inbox conversation", {
            conversationId: conv.id,
            lastMessageType: lastMessage.message_type,
            lastMessageContent: lastMessage.content,
            lastMessageSender: lastMessage.sender_id,
            initiatorId: conv.initiator_id,
            participantId: conv.participant_id,
            listingId: conv.listing?.id,
          });
          
          // 🔥 重要：检查 lastMessage 是否是系统消息
          // 如果是用户发送的真实消息（TEXT），就不要覆盖
          const isLastMessageSystem = lastMessage.message_type === "SYSTEM";
          
          // 🔥 新策略：永远展示真实消息内容，不再用订单状态覆盖
          const shouldOverrideWithOrderStatus = false;

          // 如果是订单对话，检查订单状态并生成相应的最新消息
          if (kind === "order" && conv.listing && shouldOverrideWithOrderStatus) {
            // 🔥 修复：查询当前对话双方的订单，而不是任意买家/卖家的订单
            const order = await prisma.orders.findFirst({
              where: {
                listing_id: conv.listing.id,
                // 🔥 确保订单的买家和卖家是当前对话的双方
                AND: [
                  {
                    OR: [
                      // 买家是initiator，卖家是participant
                      {
                        buyer_id: conv.initiator_id,
                        seller_id: conv.participant_id
                      },
                      // 或者买家是participant，卖家是initiator
                      {
                        buyer_id: conv.participant_id,
                        seller_id: conv.initiator_id
                      }
                    ]
                  }
                ]
              },
              orderBy: { created_at: "desc" }
            });
            
            if (order) {
              // 根据订单状态生成相应的最新消息
              if (order.status === "REVIEWED") {
                // 检查评论状态
                const reviews = await prisma.reviews.findMany({
                  where: { order_id: order.id }
                });
                
                const hasBuyerReview = reviews.some(r => r.reviewer_id === order.buyer_id);
                const hasSellerReview = reviews.some(r => r.reviewer_id === order.seller_id);
                
                if (hasBuyerReview && hasSellerReview) {
                  displayMessage = "Both parties reviewed each other.";
                } else if (hasBuyerReview || hasSellerReview) {
                  displayMessage = "One party has left a review.";
                } else {
                  displayMessage = "How was your experience? Leave a review to help others discover great items.";
                }
                displayTime = formatTime(order.updated_at || order.created_at);
              } else if (order.status === "COMPLETED") {
                // 检查评论状态
                const reviews = await prisma.reviews.findMany({
                  where: { order_id: order.id }
                });
                
                const hasBuyerReview = reviews.some(r => r.reviewer_id === order.buyer_id);
                const hasSellerReview = reviews.some(r => r.reviewer_id === order.seller_id);
                
                if (hasBuyerReview && hasSellerReview) {
                  displayMessage = "Both parties reviewed each other.";
                } else if (hasBuyerReview || hasSellerReview) {
                  displayMessage = "One party has left a review.";
                } else {
                  displayMessage = "How was your experience? Leave a review to help others discover great items.";
                }
                displayTime = formatTime(order.updated_at || order.created_at);
              } else if (order.status === "DELIVERED") {
                displayMessage = "Parcel arrived. Waiting for buyer to confirm received.";
                displayTime = formatTime(order.updated_at || order.created_at);
              } else if (order.status === "SHIPPED") {
                displayMessage = "Parcel is in transit.";
                displayTime = formatTime(order.updated_at || order.created_at);
              } else if (order.status === "TO_SHIP") {
                displayMessage = "Seller has shipped your parcel.";
                displayTime = formatTime(order.updated_at || order.created_at);
              } else if (order.status === "IN_PROGRESS") {
                const isBuyer = order.buyer_id === dbUser.id;
                displayMessage = isBuyer 
                  ? "I've paid, waiting for you to ship" 
                  : "Buyer has paid for the order";
                displayTime = formatTime(order.updated_at || order.created_at);
              }
            }
          }

          const previewMessage = lastMessage.message_type === "SYSTEM"
            ? lastTextMessage?.content ?? displayMessage
            : (lastMessage.content ?? "");
          console.log("🔍 Conversation preview", {
            conversationId: conv.id,
            previewMessage,
            rawMessage: lastMessage.content,
            messageType: lastMessage.message_type,
            lastMessageAt: conv.last_message_at,
          });

          return {
            id: conv.id.toString(),
            sender: otherUser.username,
            message: previewMessage.length > 50 
              ? previewMessage.substring(0, 50) + "..." 
              : previewMessage, // 🔥 截断长消息并添加省略号
            time: displayTime,
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
        })
    );

    // 🔥 修复：如果当前用户是 TOP Support，则不需要特殊处理 support 对话
    // 如果当前用户不是 TOP Support，才显示虚拟的 "support-1" 对话
    let topSupportConversation = null;
    let otherConversations = formattedConversations;
    
    if (dbUser.id !== SUPPORT_USER_ID) {
      // 普通用户：查找与 TOP Support 的对话并显示为虚拟对话
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
      if (supportConversation && supportConversation.messages.length > 0) {
        const lastMessage = supportConversation.messages[0];
        topSupportConversation = {
          id: "support-1",
          sender: "TOP Support",
          message: lastMessage.content.length > 50 
            ? lastMessage.content.substring(0, 50) + "..." 
            : lastMessage.content,
          time: formatTime(lastMessage.created_at),
          avatar: "https://via.placeholder.com/48/FF6B6B/FFFFFF?text=TOP", // TOP Support 头像
          kind: "support",
          unread: false,
          lastFrom: lastMessage.sender_id === dbUser.id ? "me" : "support",
          order: null
        };
      }
      
      // 过滤掉其他对话中的 TOP Support 对话，避免重复
      otherConversations = formattedConversations.filter(conv => 
        !(conv.sender === "TOP Support" || conv.kind === "support")
      );
    } else {
      // TOP Support 用户：显示所有对话，包括 SUPPORT 类型的对话
      // 不需要过滤，所有对话都正常显示
      otherConversations = formattedConversations;
    }
    
    // 将Support对话放在最前面（如果有的话）
    const allConversations = [
      ...(topSupportConversation ? [topSupportConversation] : []),
      ...otherConversations
    ].filter(Boolean);

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
    const sessionUser = await getSessionUser(request);
    const dbUser = sessionUser
      ? { id: sessionUser.id }
      : null;
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requestBody = await request.json();
    console.log("🔍 Request body:", requestBody);
    
    const { participant_id, listing_id, type = "ORDER" } = requestBody;

    // 🔥 详细的参数验证
    if (!participant_id) {
      console.error("❌ Missing participant_id:", participant_id);
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }
    
    // 🔥 对于ORDER类型的对话，listing_id是必需的；对于GENERAL类型，listing_id是可选的
    if (type === 'ORDER' && !listing_id) {
      console.error("❌ Missing listing_id for ORDER conversation:", listing_id);
      return NextResponse.json({ error: "Missing listing_id for ORDER conversation" }, { status: 400 });
    }

    console.log("🔍 Creating conversation with params:", {
      participant_id,
      listing_id,
      type,
      current_user_id: dbUser.id
    });

    // 🔥 检查是否已存在对话（双向匹配 + 类型匹配 + listing_id 匹配）
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            initiator_id: dbUser.id,
            participant_id: participant_id,
            listing_id: listing_id || null,
            type: type as "ORDER" | "SUPPORT" | "GENERAL"
          },
          {
            initiator_id: participant_id,
            participant_id: dbUser.id,
            listing_id: listing_id || null,
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

// DELETE /api/conversations - 删除对话
export async function DELETE(request: NextRequest) {
  console.log("🔥 DELETE endpoint called - this should appear in server logs");
  
  try {
    const sessionUser = await getSessionUser(request);
    const dbUser = sessionUser
      ? { id: sessionUser.id }
      : null;
    if (!dbUser) {
      console.log("❌ Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("🔍 DB user found:", dbUser.id);

    const requestBody = await request.json();
    console.log("🔍 Request body:", requestBody);
    
    const { conversationId } = requestBody;
    
    if (!conversationId) {
      console.error("❌ Missing conversationId:", conversationId);
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    console.log("🗑️ Deleting conversation:", conversationId, "for user:", dbUser.id);
    console.log("🔍 ConversationId type:", typeof conversationId);
    console.log("🔍 Parsed conversationId:", parseInt(conversationId));

    // 验证对话是否属于当前用户
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: parseInt(conversationId),
        OR: [
          { initiator_id: dbUser.id },
          { participant_id: dbUser.id }
        ]
      },
      include: {
        messages: {
          select: { id: true }
        }
      }
    });

    if (!conversation) {
      console.log("❌ Conversation not found or not owned by user");
      return NextResponse.json({ error: "Conversation not found or not owned by user" }, { status: 404 });
    }

    console.log("🔍 Found conversation with", conversation.messages.length, "messages");

    try {
      // 🔥 使用硬删除：真正删除对话和消息
      console.log("🗑️ Hard deleting conversation and messages");
      
      // 使用事务来确保数据一致性
      await prisma.$transaction(async (tx) => {
        // 先删除所有相关消息
        console.log("🗑️ Deleting all messages for conversation:", conversationId);
        await tx.messages.deleteMany({
          where: { conversation_id: parseInt(conversationId) }
        });

        // 然后删除对话
        console.log("🗑️ Deleting conversation:", conversationId);
        await tx.conversations.delete({
          where: { id: parseInt(conversationId) }
        });
      });

      console.log("✅ Conversation and messages hard deleted successfully:", conversationId);
    } catch (dbError) {
      console.error("❌ Database error during hard deletion:", dbError);
      console.error("❌ Error details:", {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        conversationId: conversationId,
        parsedId: parseInt(conversationId)
      });
      
      // 🔥 返回更详细的错误信息
      return NextResponse.json({ 
        error: "Database deletion failed", 
        details: dbError instanceof Error ? dbError.message : 'Unknown error',
        conversationId: conversationId
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
