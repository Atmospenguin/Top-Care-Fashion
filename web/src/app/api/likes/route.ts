import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/likes - Get user's liked listings
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting liked listings for user:', user.id);

    const likedListings = await prisma.user_likes.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
                average_rating: true,
                total_reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log('Found liked listings:', likedListings.length);

    return NextResponse.json({
      success: true,
      data: likedListings.map(like => ({
        id: like.id,
        listing: like.listing,
        created_at: like.created_at,
      })),
    });
  } catch (error) {
    console.error('Error getting liked listings:', error);
    return NextResponse.json(
      { error: 'Failed to get liked listings' },
      { status: 500 }
    );
  }
}

// POST /api/likes - Like/unlike a listing
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id, action } = await request.json();

    if (!listing_id || !action) {
      return NextResponse.json(
        { error: 'Missing listing_id or action' },
        { status: 400 }
      );
    }

    console.log('Like action:', action, 'for listing:', listing_id, 'by user:', user.id);

    if (action === 'like') {
      // Check if already liked
      const existingLike = await prisma.user_likes.findUnique({
        where: {
          user_id_listing_id: {
            user_id: user.id,
            listing_id: parseInt(listing_id),
          },
        },
      });

      if (existingLike) {
        return NextResponse.json({
          success: true,
          data: { liked: true, message: 'Already liked' },
        });
      }

      // Create new like
      await prisma.user_likes.create({
        data: {
          user_id: user.id,
          listing_id: parseInt(listing_id),
        },
      });

      console.log('Successfully liked listing:', listing_id);
    } else if (action === 'unlike') {
      // Remove like
      await prisma.user_likes.deleteMany({
        where: {
          user_id: user.id,
          listing_id: parseInt(listing_id),
        },
      });

      console.log('Successfully unliked listing:', listing_id);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "like" or "unlike"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { liked: action === 'like' },
    });
  } catch (error) {
    console.error('Error handling like action:', error);
    return NextResponse.json(
      { error: 'Failed to handle like action' },
      { status: 500 }
    );
  }
}

