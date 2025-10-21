import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// 获取用户订单
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'buy' or 'sell'
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause: any = {};
    
    if (type === "buy") {
      whereClause.buyer_id = user.id;
    } else if (type === "sell") {
      whereClause.seller_id = user.id;
    } else {
      // 获取所有相关订单
      whereClause.OR = [
        { buyer_id: user.id },
        { seller_id: user.id }
      ];
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        address: true,
        order_items: {
          include: {
            listing: {
              select: {
                id: true,
                name: true,
                image_url: true,
                image_urls: true,
                price: true,
                brand: true,
                size: true,
                condition_type: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc"
      },
      take: limit,
      skip: offset
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status.toLowerCase(),
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shipping_fee),
      taxAmount: Number(order.tax_amount),
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      paymentStatus: order.payment_status,
      shippingMethod: order.shipping_method,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery?.toISOString(),
      notes: order.notes,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
      shippedAt: order.shipped_at?.toISOString(),
      deliveredAt: order.delivered_at?.toISOString(),
      buyer: {
        id: order.buyer.id,
        name: order.buyer.username,
        avatar: order.buyer.avatar_url || ""
      },
      seller: {
        id: order.seller.id,
        name: order.seller.username,
        avatar: order.seller.avatar_url || ""
      },
      address: {
        name: order.address.name,
        phone: order.address.phone,
        line1: order.address.line1,
        line2: order.address.line2,
        city: order.address.city,
        state: order.address.state,
        postalCode: order.address.postal_code,
        country: order.address.country
      },
      items: order.order_items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        product: {
          id: item.listing.id.toString(),
          title: item.listing.name,
          price: Number(item.listing.price),
          brand: item.listing.brand,
          size: item.listing.size,
          condition: item.listing.condition_type.toLowerCase(),
          imageUrl: item.listing.image_url,
          imageUrls: item.listing.image_urls ? (item.listing.image_urls as string[]) : 
                     (item.listing.image_url ? [item.listing.image_url] : [])
        }
      }))
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// 创建订单
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      cartItemIds, 
      addressId, 
      paymentMethodId,
      shippingMethod = "standard",
      notes 
    } = await req.json();

    if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return NextResponse.json(
        { error: "Cart item IDs are required" },
        { status: 400 }
      );
    }

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    // 验证地址属于用户
    const address = await prisma.user_addresses.findFirst({
      where: {
        id: addressId,
        user_id: user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // 获取购物车项
    const cartItems = await prisma.cart_items.findMany({
      where: {
        id: { in: cartItemIds },
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
                avatar_url: true
              }
            }
          }
        }
      }
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "No valid cart items found" },
        { status: 400 }
      );
    }

    // 按卖家分组订单项
    const ordersBySeller = new Map();
    
    for (const cartItem of cartItems) {
      const sellerId = cartItem.listing.seller_id;
      if (!sellerId) continue;

      if (!ordersBySeller.has(sellerId)) {
        ordersBySeller.set(sellerId, {
          seller: cartItem.listing.seller,
          items: []
        });
      }
      
      ordersBySeller.get(sellerId).items.push(cartItem);
    }

    const createdOrders = [];

    // 为每个卖家创建订单
    for (const [sellerId, orderData] of ordersBySeller) {
      const items = orderData.items;
      const seller = orderData.seller;

      // 计算订单金额
      const subtotal = items.reduce((sum, item) => 
        sum + (Number(item.listing.price) * item.quantity), 0
      );
      
      const shippingFee = 8; // 固定运费
      const taxAmount = subtotal * 0.08; // 8% 税率
      const totalAmount = subtotal + shippingFee + taxAmount;

      // 生成订单号
      const orderNumber = `TOP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 创建订单
      const order = await prisma.orders.create({
        data: {
          order_number: orderNumber,
          buyer_id: user.id,
          seller_id: sellerId,
          address_id: addressId,
          payment_method_id: paymentMethodId,
          status: "PENDING",
          subtotal: subtotal,
          shipping_fee: shippingFee,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: "USD",
          payment_status: "pending",
          shipping_method: shippingMethod,
          notes: notes
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              avatar_url: true
            }
          },
          seller: {
            select: {
              id: true,
              username: true,
              avatar_url: true
            }
          },
          address: true,
          order_items: {
            include: {
              listing: {
                select: {
                  id: true,
                  name: true,
                  image_url: true,
                  image_urls: true,
                  price: true,
                  brand: true,
                  size: true,
                  condition_type: true
                }
              }
            }
          }
        }
      });

      // 创建订单项
      for (const cartItem of items) {
        await prisma.order_items.create({
          data: {
            order_id: order.id,
            listing_id: cartItem.listing_id,
            quantity: cartItem.quantity,
            unit_price: cartItem.listing.price,
            total_price: Number(cartItem.listing.price) * cartItem.quantity
          }
        });

        // 更新购物车项状态
        await prisma.cart_items.update({
          where: { id: cartItem.id },
          data: { 
            status: "PURCHASED",
            updated_at: new Date()
          }
        });

        // 更新商品库存
        await prisma.listings.update({
          where: { id: cartItem.listing_id },
          data: {
            inventory_count: { decrement: cartItem.quantity },
            updated_at: new Date()
          }
        });
      }

      createdOrders.push({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status.toLowerCase(),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shipping_fee),
        taxAmount: Number(order.tax_amount),
        totalAmount: Number(order.total_amount),
        currency: order.currency,
        paymentStatus: order.payment_status,
        shippingMethod: order.shipping_method,
        notes: order.notes,
        createdAt: order.created_at.toISOString(),
        buyer: {
          id: order.buyer.id,
          name: order.buyer.username,
          avatar: order.buyer.avatar_url || ""
        },
        seller: {
          id: order.seller.id,
          name: order.seller.username,
          avatar: order.seller.avatar_url || ""
        },
        address: {
          name: order.address.name,
          phone: order.address.phone,
          line1: order.address.line1,
          line2: order.address.line2,
          city: order.address.city,
          state: order.address.state,
          postalCode: order.address.postal_code,
          country: order.address.country
        }
      });
    }

    return NextResponse.json({
      message: "Orders created successfully",
      orders: createdOrders
    });
  } catch (error) {
    console.error("Error creating orders:", error);
    return NextResponse.json(
      { error: "Failed to create orders" },
      { status: 500 }
    );
  }
}
