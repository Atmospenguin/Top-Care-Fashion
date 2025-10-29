import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/users/[username]/likes - Get public liked listings for a specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await context.params;

    console.log('Getting public liked listings for user:', username);

    // 首先找到目标用户
    const targetUser = await prisma.users.findUnique({
      where: { username },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 获取目标用户的喜欢商品
    const likedListings = await prisma.user_likes.findMany({
      where: {
        user_id: targetUser.id,
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
                is_premium: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // 转换数据格式以匹配前端期望
    const formattedItems = likedListings.map((likedListing) => {
      const listing = likedListing.listing;
      
      // 处理图片数据
      let images = [];
      if (listing.image_url) {
        images = [listing.image_url];
      } else if (listing.image_urls) {
        try {
          const imageUrls = typeof listing.image_urls === 'string' 
            ? JSON.parse(listing.image_urls) 
            : listing.image_urls;
          images = Array.isArray(imageUrls) ? imageUrls : [];
        } catch (e) {
          console.log('Error parsing image_urls:', e);
          images = [];
        }
      }

      // 处理tags数据
      let tags = [];
      if (listing.tags) {
        try {
          tags = typeof listing.tags === 'string' 
            ? JSON.parse(listing.tags) 
            : listing.tags;
          if (!Array.isArray(tags)) {
            tags = [];
          }
        } catch (e) {
          console.log('Error parsing tags:', e);
          tags = [];
        }
      }

      return {
        id: likedListing.id,
        quantity: 1,
        created_at: likedListing.created_at,
        updated_at: listing.updated_at || likedListing.created_at,
        item: {
          id: listing.id.toString(),
          title: listing.name,
          price: Number(listing.price),
          description: listing.description,
          brand: listing.brand,
          size: listing.size,
          condition: listing.condition_type,
          material: listing.material,
          gender: listing.gender || 'unisex',
          tags: tags,
          category: listing.category?.name || null,
          images: images,
          seller: listing.seller ? {
            id: listing.seller.id,
            name: listing.seller.username,
            avatar: listing.seller.avatar_url || '',
            rating: Number(listing.seller.average_rating || 0),
            sales: Number(listing.seller.total_reviews || 0),
            isPremium: Boolean(listing.seller.is_premium),
          } : null,
        },
      };
    });

    return NextResponse.json({ items: formattedItems });

  } catch (error) {
    console.error('Error getting public liked listings:', error);
    return NextResponse.json(
      { error: 'Failed to get public liked listings' },
      { status: 500 }
    );
  }
}
