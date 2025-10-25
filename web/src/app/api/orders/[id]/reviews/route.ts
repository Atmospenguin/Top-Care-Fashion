import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/orders/[id]/reviews - Get reviews for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if user is authorized to view this order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        buyer_id: true,
        seller_id: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.buyer_id !== currentUser.id && order.seller_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    const reviews = await prisma.reviews.findMany({
      where: { order_id: orderId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            avatar_path: true
          }
        },
        reviewee: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            avatar_path: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(reviews);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/reviews - Create a review for an order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get the order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true,
        reviews: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to review this order
    if (order.buyer_id !== currentUser.id && order.seller_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized to review this order' },
        { status: 403 }
      );
    }

    // Check if order is in a reviewable state
    if (!['COMPLETED', 'REVIEWED'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order must be completed before reviewing' },
        { status: 400 }
      );
    }

    // Determine who the user is reviewing
    const revieweeId = order.buyer_id === currentUser.id ? order.seller_id : order.buyer_id;

    // Check if user has already reviewed this order
    const existingReview = order.reviews.find(
      review => review.reviewer_id === currentUser.id
    );

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this order' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.reviews.create({
      data: {
        order_id: orderId,
        reviewer_id: currentUser.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment || null
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            avatar_path: true
          }
        },
        reviewee: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            avatar_path: true
          }
        }
      }
    });

    // Update order status to REVIEWED if both parties have reviewed
    const allReviews = await prisma.reviews.findMany({
      where: { order_id: orderId }
    });

    if (allReviews.length >= 2) {
      await prisma.orders.update({
        where: { id: orderId },
        data: { status: 'REVIEWED' }
      });
    }

    // Update reviewee's average rating
    const revieweeReviews = await prisma.reviews.findMany({
      where: { reviewee_id: revieweeId }
    });

    const averageRating = revieweeReviews.reduce((sum, r) => sum + r.rating, 0) / revieweeReviews.length;

    await prisma.users.update({
      where: { id: revieweeId },
      data: {
        average_rating: averageRating,
        total_reviews: revieweeReviews.length
      }
    });

    // 🔔 创建review notification
    try {
      // 获取商品信息
      const orderWithListing = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          listing: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (orderWithListing && orderWithListing.listing) {
        await prisma.notifications.create({
          data: {
            user_id: revieweeId, // 被review的用户收到通知
            type: 'REVIEW',
            title: `@${currentUser.username} left a review for your product`,
            message: `${orderWithListing.listing.name} - ${rating} stars`,
            image_url: currentUser.avatar_url,
            listing_id: orderWithListing.listing.id,
            related_user_id: currentUser.id,
          },
        });
        console.log(`🔔 Review notification created for user ${revieweeId}`);
      }
    } catch (notificationError) {
      console.error("❌ Error creating review notification:", notificationError);
      // 不阻止review创建，即使notification创建失败
    }

    return NextResponse.json(review, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
