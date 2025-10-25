import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
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
            description: true,
            price: true,
            image_url: true,
            image_urls: true,
            brand: true,
            size: true,
            condition_type: true,
            material: true,
            weight: true,
            dimensions: true
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

    return NextResponse.json(order);

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const orderId = parseInt(id);
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
    } else if (status === 'DELIVERED' || status === 'RECEIVED') {
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
      }
    });

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
