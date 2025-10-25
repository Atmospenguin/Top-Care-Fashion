import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyLegacyToken } from '@/lib/jwt';
import { createSupabaseServer } from '@/lib/supabase';

// 支持legacy token的getCurrentUser函数
async function getCurrentUserWithLegacySupport(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      console.log("❌ No token provided");
      return null;
    }

    console.log("🔍 Token received:", token.substring(0, 50) + "...");

    // 优先尝试 legacy JWT
    const legacy = verifyLegacyToken(token);
    if (legacy.valid && legacy.payload?.uid) {
      const legacyUser = await prisma.users.findUnique({
        where: { id: Number(legacy.payload.uid) },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          is_premium: true,
          dob: true,
          gender: true,
        },
      });
      if (legacyUser) {
        return {
          id: legacyUser.id,
          username: legacyUser.username,
          email: legacyUser.email,
          role: legacyUser.role,
          status: legacyUser.status,
          isPremium: Boolean(legacyUser.is_premium),
          dob: legacyUser.dob ? legacyUser.dob.toISOString().slice(0, 10) : null,
          gender: legacyUser.gender,
        };
      }
    }

    // 回退到Supabase认证
    console.log("🔍 Trying Supabase authentication...");
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log("❌ Supabase auth error:", error.message);
      return null;
    }

    if (!user) {
      console.log("❌ No Supabase user found");
      return null;
    }

    console.log("✅ Supabase user found:", user.email);

    const dbUser = await prisma.users.findUnique({
      where: { supabase_user_id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        is_premium: true,
        dob: true,
        gender: true,
      },
    });

    if (dbUser) {
      console.log("✅ Local user found:", dbUser.username, "ID:", dbUser.id);
      return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        isPremium: Boolean(dbUser.is_premium),
        dob: dbUser.dob ? dbUser.dob.toISOString().slice(0, 10) : null,
        gender: dbUser.gender,
      };
    } else {
      console.log("❌ No local user found for Supabase user:", user.email);
      return null;
    }

    return null;
  } catch (err) {
    console.error("❌ getCurrentUserWithLegacySupport failed:", err);
    return null;
  }
}

// GET /api/orders - Get user's orders (as buyer or seller)
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Orders API - Starting request");
    const currentUser = await getCurrentUserWithLegacySupport(request);
    console.log("🔍 Orders API - Current user:", currentUser?.username || "null");
    
    if (!currentUser) {
      console.log("🔍 Orders API - No user, returning 401");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'bought' or 'sold'
    const status = searchParams.get('status'); // OrderStatus filter
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    
    if (type === 'bought') {
      whereClause.buyer_id = currentUser.id;
    } else if (type === 'sold') {
      whereClause.seller_id = currentUser.id;
    } else {
      // Return both bought and sold orders
      whereClause = {
        OR: [
          { buyer_id: currentUser.id },
          { seller_id: currentUser.id }
        ]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          }
        },
        listing: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
            image_urls: true,
            brand: true,
            size: true,
            condition_type: true
          }
        },
        reviews: {
          select: {
            id: true,
            reviewer_id: true,
            rating: true,
            comment: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip: offset,
      take: limit
    });

    // 🔥 为每个订单获取对应的 conversationId
    const ordersWithConversations = await Promise.all(
      orders.map(async (order) => {
        let conversationId = null;
        
        // 通过 listing_id 查找对应的 conversation
        const conversation = await prisma.conversations.findFirst({
          where: {
            listing_id: order.listing_id,
            OR: [
              { initiator_id: order.buyer_id },
              { participant_id: order.buyer_id }
            ]
          },
          select: {
            id: true
          }
        });
        
        conversationId = conversation?.id?.toString() || null;
        
        return {
          ...order,
          conversationId
        };
      })
    );

    const totalCount = await prisma.orders.count({
      where: whereClause
    });

    return NextResponse.json({
      orders: ordersWithConversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('❌ Orders API - Error details:', error);
    console.error('❌ Orders API - Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Orders API - Starting POST request");
    const currentUser = await getCurrentUserWithLegacySupport(request);
    console.log("🔍 Orders API - Current user:", currentUser?.username || "null", "ID:", currentUser?.id || "null");
    if (!currentUser) {
      console.log("❌ Orders API - No user found, returning 401");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log("🔍 Orders API - Request body:", JSON.stringify(body, null, 2));
    const { 
      listing_id, 
      buyer_name, 
      buyer_phone, 
      shipping_address, 
      payment_method, 
      payment_details 
    } = body;

    if (!listing_id) {
      console.log("❌ Orders API - No listing_id provided");
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Get the listing details
    console.log("🔍 Orders API - Looking for listing ID:", listing_id);
    const listing = await prisma.listings.findUnique({
      where: { id: listing_id },
      include: {
        seller: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    console.log("🔍 Orders API - Found listing:", listing ? `ID ${listing.id}, Seller: ${listing.seller?.username} (${listing.seller?.id}), Listed: ${listing.listed}, Sold: ${listing.sold}` : "null");

    if (!listing) {
      console.log("❌ Orders API - Listing not found");
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_id === currentUser.id) {
      console.log("❌ Orders API - User trying to buy own listing");
      console.log("❌ Orders API - Seller ID:", listing.seller_id);
      console.log("❌ Orders API - Current User ID:", currentUser.id);
      return NextResponse.json(
        { error: 'Cannot buy your own listing' },
        { status: 400 }
      );
    }

    if (listing.sold) {
      console.log("❌ Orders API - Listing already sold");
      return NextResponse.json(
        { error: 'Listing is already sold' },
        { status: 400 }
      );
    }

    if (!listing.listed) {
      console.log("❌ Orders API - Listing not available");
      console.log("❌ Orders API - Listing listed status:", listing.listed);
      return NextResponse.json(
        { error: 'Listing is not available' },
        { status: 400 }
      );
    }

    // Create the order
    console.log("🔍 Orders API - Creating order with data:", {
      buyer_id: currentUser.id,
      seller_id: listing.seller_id,
      listing_id: listing.id,
      status: 'IN_PROGRESS',
      total_amount: Number(listing.price),
      buyer_name: buyer_name || null,
      buyer_phone: buyer_phone || null,
      shipping_address: shipping_address || null,
      payment_method: payment_method || null,
      payment_details: payment_details || null
    });
    
    const order = await prisma.orders.create({
      data: {
        buyer_id: currentUser.id,
        seller_id: listing.seller_id,
        listing_id: listing.id,
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'IN_PROGRESS',
        total_amount: Number(listing.price),
        // 保存买家结账信息
        buyer_name: buyer_name || null,
        buyer_phone: buyer_phone || null,
        shipping_address: shipping_address || null,
        payment_method: payment_method || null,
        payment_details: payment_details || null
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          }
        },
        listing: {
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
            image_urls: true,
            brand: true,
            size: true,
            condition_type: true
          }
        }
      }
    });

    // Mark the listing as sold
    await prisma.listings.update({
      where: { id: listing.id },
      data: {
        sold: true,
        sold_at: new Date()
      }
    });

    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      error: error
    });
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}