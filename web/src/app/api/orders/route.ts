import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/orders - Get user's orders (as buyer or seller)
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Orders API - Starting request");
    const currentUser = await getSessionUser(request);
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

    const totalCount = await prisma.orders.count({
      where: whereClause
    });

    return NextResponse.json({
      orders,
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
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Get the listing details
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

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot buy your own listing' },
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

    // Resolve seller id (some schemas may have nullable seller_id)
    const sellerId: number | null = (listing as any).seller_id ?? (listing as any).seller?.id ?? null;
    if (sellerId === null || sellerId === undefined) {
      return NextResponse.json(
        { error: 'Listing has no seller associated' },
        { status: 400 }
      );
    }

    // Create the order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const totalAmount = ((): string => {
      const p: any = (listing as any).price;
      try { return typeof p === 'string' ? p : p?.toString?.() ?? String(p ?? 0); } catch { return '0'; }
    })();

    const order = await prisma.orders.create({
      data: {
        buyer_id: currentUser.id,
        seller_id: sellerId,
        listing_id: listing.id,
        status: 'IN_PROGRESS',
        order_number: orderNumber,
        total_amount: totalAmount,
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
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
