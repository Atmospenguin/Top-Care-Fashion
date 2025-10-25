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
      return null;
    }

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
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
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
      }
    }

    return null;
  } catch (err) {
    console.error("❌ getCurrentUserWithLegacySupport failed:", err);
    return null;
  }
}

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserWithLegacySupport(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderId = parseInt(resolvedParams.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyer_id: true,
        seller_id: true,
        listing_id: true,
        order_number: true,
        status: true,
        total_amount: true,
        shipping_method: true,
        notes: true,
        // 买家信息字段
        buyer_name: true,
        buyer_phone: true,
        shipping_address: true,
        payment_method: true,
        payment_details: true,
        created_at: true,
        updated_at: true,
        buyer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            email: true,
            phone_number: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            email: true,
            phone_number: true
          }
        },
        listing: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image_url: true,
            image_urls: true,
            brand: true,
            size: true,
            condition_type: true,
            gender: true,
            shipping_option: true,
            shipping_fee: true,
            location: true
          }
        },
        reviews: {
          select: {
            id: true,
            reviewer_id: true,
            reviewee_id: true,
            rating: true,
            comment: true,
            created_at: true,
            reviewer: {
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

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this order
    if (order.buyer_id !== currentUser.id && order.seller_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    // Handle null values by providing defaults
    const orderWithDefaults = {
      ...order,
      order_number: order.order_number || `ORD-${order.id}-${Date.now()}`,
      total_amount: order.total_amount || 0
    };

    return NextResponse.json(orderWithDefaults);

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserWithLegacySupport(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderId = parseInt(resolvedParams.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Valid status values
    const validStatuses = [
      'IN_PROGRESS', 'TO_SHIP', 'SHIPPED', 'DELIVERED', 
      'RECEIVED', 'COMPLETED', 'REVIEWED', 'CANCELLED'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the order first
    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization based on status change
    let canUpdate = false;
    
    if (status === 'CANCELLED') {
      // Only buyer can cancel before shipping, seller can cancel anytime
      canUpdate = existingOrder.buyer_id === currentUser.id || 
                  existingOrder.seller_id === currentUser.id;
    } else if (status === 'TO_SHIP' || status === 'SHIPPED') {
      // Only seller can mark as shipped
      canUpdate = existingOrder.seller_id === currentUser.id;
    } else if (status === 'DELIVERED') {
      // Only seller can mark as delivered (package arrived)
      canUpdate = existingOrder.seller_id === currentUser.id;
    } else if (status === 'RECEIVED') {
      // Only buyer can mark as received
      canUpdate = existingOrder.buyer_id === currentUser.id;
    } else if (status === 'COMPLETED' || status === 'REVIEWED') {
      // Either party can mark as completed/reviewed
      canUpdate = existingOrder.buyer_id === currentUser.id || 
                  existingOrder.seller_id === currentUser.id;
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Unauthorized to update this order status' },
        { status: 403 }
      );
    }

    // Update the order
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: status as any,
        updated_at: new Date()
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            email: true,
            phone_number: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            email: true,
            phone_number: true
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
      }
    });

    // 🔥 如果订单被取消，恢复商品状态
    if (status === 'CANCELLED' && existingOrder.listing_id) {
      await prisma.listings.update({
        where: { id: existingOrder.listing_id },
        data: {
          sold: false,
          sold_at: null
        }
      });
      console.log(`✅ Listing ${existingOrder.listing_id} restored to available after order ${orderId} cancellation`);
    }

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
