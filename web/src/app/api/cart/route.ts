import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// 获取用户购物车
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await prisma.cart_items.findMany({
      where: {
        user_id: user.id,
        status: "ACTIVE"
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
                total_reviews: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const items = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      status: item.status,
      createdAt: item.created_at.toISOString(),
      item: {
        id: item.listing.id.toString(),
        title: item.listing.name,
        price: Number(item.listing.price),
        description: item.listing.description,
        brand: item.listing.brand,
        size: item.listing.size,
        condition: item.listing.condition_type.toLowerCase(),
        material: item.listing.material,
        images: item.listing.image_urls ? (item.listing.image_urls as string[]) : 
                (item.listing.image_url ? [item.listing.image_url] : []),
        category: item.listing.category_id?.toString(),
        seller: {
          name: item.listing.seller?.username || "Unknown",
          avatar: item.listing.seller?.avatar_url || "",
          rating: Number(item.listing.seller?.average_rating) || 0,
          sales: item.listing.seller?.total_reviews || 0
        }
      }
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// 添加商品到购物车
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, quantity = 1 } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // 检查商品是否存在且可购买
    const listing = await prisma.listings.findFirst({
      where: {
        id: parseInt(listingId),
        listed: true,
        sold: false
      }
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found or not available" },
        { status: 404 }
      );
    }

    // 检查是否已经在购物车中
    const existingItem = await prisma.cart_items.findFirst({
      where: {
        user_id: user.id,
        listing_id: parseInt(listingId),
        status: "ACTIVE"
      }
    });

    if (existingItem) {
      // 更新数量
      const updatedItem = await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { 
          quantity: existingItem.quantity + quantity,
          updated_at: new Date()
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
                  total_reviews: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        message: "Cart updated successfully",
        item: {
          id: updatedItem.id,
          quantity: updatedItem.quantity,
          status: updatedItem.status,
          createdAt: updatedItem.created_at.toISOString(),
          item: {
            id: updatedItem.listing.id.toString(),
            title: updatedItem.listing.name,
            price: Number(updatedItem.listing.price),
            description: updatedItem.listing.description,
            brand: updatedItem.listing.brand,
            size: updatedItem.listing.size,
            condition: updatedItem.listing.condition_type.toLowerCase(),
            material: updatedItem.listing.material,
            images: updatedItem.listing.image_urls ? (updatedItem.listing.image_urls as string[]) : 
                    (updatedItem.listing.image_url ? [updatedItem.listing.image_url] : []),
            category: updatedItem.listing.category_id?.toString(),
            seller: {
              name: updatedItem.listing.seller?.username || "Unknown",
              avatar: updatedItem.listing.seller?.avatar_url || "",
              rating: Number(updatedItem.listing.seller?.average_rating) || 0,
              sales: updatedItem.listing.seller?.total_reviews || 0
            }
          }
        }
      });
    } else {
      // 创建新的购物车项
      const newItem = await prisma.cart_items.create({
        data: {
          user_id: user.id,
          listing_id: parseInt(listingId),
          quantity: quantity,
          status: "ACTIVE"
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
                  total_reviews: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        message: "Item added to cart successfully",
        item: {
          id: newItem.id,
          quantity: newItem.quantity,
          status: newItem.status,
          createdAt: newItem.created_at.toISOString(),
          item: {
            id: newItem.listing.id.toString(),
            title: newItem.listing.name,
            price: Number(newItem.listing.price),
            description: newItem.listing.description,
            brand: newItem.listing.brand,
            size: newItem.listing.size,
            condition: newItem.listing.condition_type.toLowerCase(),
            material: newItem.listing.material,
            images: newItem.listing.image_urls ? (newItem.listing.image_urls as string[]) : 
                    (newItem.listing.image_url ? [newItem.listing.image_url] : []),
            category: newItem.listing.category_id?.toString(),
            seller: {
              name: newItem.listing.seller?.username || "Unknown",
              avatar: newItem.listing.seller?.avatar_url || "",
              rating: Number(newItem.listing.seller?.average_rating) || 0,
              sales: newItem.listing.seller?.total_reviews || 0
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// 更新购物车项数量
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cartItemId, quantity } = await req.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Cart item ID and quantity are required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.cart_items.update({
      where: {
        id: cartItemId,
        user_id: user.id
      },
      data: {
        quantity: quantity,
        updated_at: new Date()
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
                total_reviews: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "Cart item updated successfully",
      item: {
        id: updatedItem.id,
        quantity: updatedItem.quantity,
        status: updatedItem.status,
        createdAt: updatedItem.created_at.toISOString(),
        item: {
          id: updatedItem.listing.id.toString(),
          title: updatedItem.listing.name,
          price: Number(updatedItem.listing.price),
          description: updatedItem.listing.description,
          brand: updatedItem.listing.brand,
          size: updatedItem.listing.size,
          condition: updatedItem.listing.condition_type.toLowerCase(),
          material: updatedItem.listing.material,
          images: updatedItem.listing.image_urls ? (updatedItem.listing.image_urls as string[]) : 
                  (updatedItem.listing.image_url ? [updatedItem.listing.image_url] : []),
          category: updatedItem.listing.category_id?.toString(),
          seller: {
            name: updatedItem.listing.seller?.username || "Unknown",
            avatar: updatedItem.listing.seller?.avatar_url || "",
            rating: Number(updatedItem.listing.seller?.average_rating) || 0,
            sales: updatedItem.listing.seller?.total_reviews || 0
          }
        }
      }
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// 删除购物车项
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get("cartItemId");

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    await prisma.cart_items.update({
      where: {
        id: parseInt(cartItemId),
        user_id: user.id
      },
      data: {
        status: "REMOVED",
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      message: "Item removed from cart successfully"
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
