import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting cart items for user:', user.id);

    const cartItems = await prisma.cart_items.findMany({
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
    const formattedItems = cartItems.map((cartItem) => {
      const listing = cartItem.listing;
      
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
        id: cartItem.id,
        quantity: cartItem.quantity,
        created_at: cartItem.created_at,
        updated_at: cartItem.updated_at,
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
          shippingOption: listing.shipping_option || null,
          shippingFee: listing.shipping_fee ? Number(listing.shipping_fee) : null,
          location: listing.location || null,
          seller: {
            id: listing.seller.id,
            name: listing.seller.username,
            avatar: listing.seller.avatar_url || '',
            rating: Number(listing.seller.average_rating || 0),
            sales: Number(listing.seller.total_reviews || 0),
          },
        },
      };
    });

    return NextResponse.json({ items: formattedItems });

  } catch (error) {
    console.error('Error getting cart items:', error);
    return NextResponse.json(
      { error: 'Failed to get cart items' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, quantity = 1 } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // 检查商品是否存在且可购买
    const listing = await prisma.listings.findUnique({
      where: { id: parseInt(listingId) },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot add your own listing to cart' },
        { status: 400 }
      );
    }

    if (listing.sold) {
      return NextResponse.json(
        { error: 'Listing is already sold' },
        { status: 400 }
      );
    }

    if (!listing.listed) {
      return NextResponse.json(
        { error: 'Listing is not available' },
        { status: 400 }
      );
    }

    // 检查是否已经在购物车中
    const existingCartItem = await prisma.cart_items.findUnique({
      where: {
        user_id_listing_id: {
          user_id: user.id,
          listing_id: parseInt(listingId),
        },
      },
    });

    if (existingCartItem) {
      // 更新数量
      const updatedCartItem = await prisma.cart_items.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
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
      });

      return NextResponse.json(updatedCartItem, { status: 200 });
    } else {
      // 创建新的购物车项目
      const newCartItem = await prisma.cart_items.create({
        data: {
          user_id: user.id,
          listing_id: parseInt(listingId),
          quantity: quantity,
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
      });

      return NextResponse.json(newCartItem, { status: 201 });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.cart_items.deleteMany({
      where: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ message: 'Cart cleared successfully' });

  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}