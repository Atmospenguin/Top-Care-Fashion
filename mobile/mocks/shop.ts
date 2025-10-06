import type { BagItem, ListingItem, PaymentMethod, ShippingAddress } from "../types/shop";

export type PurchaseOrderStatus = "InProgress" | "Delivered" | "Cancelled";
export type SoldOrderStatus = "ToShip" | "InTransit" | "Cancelled" | "Completed";

export type PurchaseOrder = {
  id: string;
  product: ListingItem;
  seller: { name: string; avatar: string };
  status: PurchaseOrderStatus;
  address: ShippingAddress & { detail: string };
  payment: {
    method: string;
    amount: number;
    date: string;
    transactionId: string;
  };
  feedbackGiven: boolean;
};

export type SoldOrder = {
  id: string;
  product: ListingItem;
  buyer: { name: string; avatar: string };
  status: SoldOrderStatus;
  feedbackGiven: boolean;
};

const avatar = (id: number) => `https://i.pravatar.cc/100?img=${id}`;

export const MOCK_LISTINGS: ListingItem[] = [
  {
    id: "listing-green-dress",
    title: "Green Midi Dress",
    price: 20,
    description:
      "Relaxed-fit midi dress in emerald green with a subtle pleated skirt and adjustable straps for a flattering fit.",
    brand: "TOP Studio",
    size: "S",
    condition: "Very good",
    material: "Polyester blend",
    colors: ["Emerald", "Soft white"],
    images: [
      "https://cdn.shopify.com/s/files/1/0281/2071/1254/products/191219hm74370_1800x1800.jpg?v=1607871412",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
    ],
    seller: {
      name: "sellerA",
      avatar: avatar(11),
      rating: 4.8,
      sales: 248,
    },
  },
  {
    id: "listing-skinny-jeans",
    title: "American Eagle Super Stretch Jeans",
    price: 14.5,
    description:
      "High-rise skinny jeans in a soft, super-stretch denim that keeps its shape all day.",
    brand: "American Eagle",
    size: "6",
    condition: "Like new",
    material: "Cotton & Elastane",
    colors: ["Mid wash"],
    images: [
      "https://tse4.mm.bing.net/th/id/OIP.TC_mOkLd6sQzsLiE_uSloQHaJ3?w=600&h=799&rs=1&pid=ImgDetMain&o=7&rm=3",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    ],
    seller: {
      name: "seller111",
      avatar: avatar(12),
      rating: 4.6,
      sales: 192,
    },
  },
  {
    id: "listing-nerdy-hoodie",
    title: "Purple Nerdy Hoodie",
    price: 15,
    description:
      "Oversized hoodie from Nerdy with brushed fleece interior and embroidered chest logo.",
    brand: "Nerdy",
    size: "M",
    condition: "Good",
    material: "Cotton",
    colors: ["Purple"],
    images: [
      "https://assets.atmos-tokyo.com/items/L/pnef21ke11-ppl-1.jpg",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    ],
    seller: {
      name: "seller222",
      avatar: avatar(13),
      rating: 4.5,
      sales: 143,
    },
  },
  {
    id: "listing-red-jacket",
    title: "Vintage Red Jacket",
    price: 30,
    description:
      "Statement red wool jacket with structured shoulders and snap-button closure.",
    brand: "RetroFinds",
    size: "M",
    condition: "Good",
    material: "Wool",
    colors: ["Ruby"],
    images: [
      "https://th.bing.com/th/id/R.d54043fa984e94c86b926d96ed3eb6a1?rik=l0s2kAsoEoM6Og&pid=ImgRaw&r=0",
    ],
    seller: {
      name: "sellerRetro",
      avatar: avatar(21),
      rating: 4.7,
      sales: 98,
    },
  },
  {
    id: "listing-casual-hoodie",
    title: "Casual Beige Hoodie",
    price: 25,
    description:
      "Neutral-toned hoodie with kangaroo pocket and ribbed cuffs, perfect for everyday wear.",
    brand: "Everyday",
    size: "L",
    condition: "Very good",
    material: "Cotton",
    colors: ["Beige"],
    images: [
      "https://i5.walmartimages.com/asr/7aed82da-69af-46b8-854e-5c22d45a4df3.e7011d0ebdea1d9fabb68417c789ae16.jpeg",
    ],
    seller: {
      name: "sellerCozy",
      avatar: avatar(22),
      rating: 4.4,
      sales: 112,
    },
  },
];

export const DEFAULT_BAG_ITEMS: BagItem[] = [
  { item: MOCK_LISTINGS[0], quantity: 1 },
  { item: MOCK_LISTINGS[1], quantity: 1 },
];

export const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  name: "Mia Chen",
  phone: "+1 917-555-1200",
  line1: "245 Grand St",
  line2: "Apt 5C",
  city: "New York",
  state: "NY",
  postalCode: "10002",
  country: "USA",
};

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = {
  label: "Visa Debit",
  brand: "Visa",
  last4: "1123",
};

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "1",
    product: MOCK_LISTINGS[0],
    seller: { name: "sellerA", avatar: avatar(11) },
    status: "InProgress",
    address: {
      ...DEFAULT_SHIPPING_ADDRESS,
      detail: "Singapore, Parc Riviera",
    },
    payment: {
      method: "PayPal",
      amount: 20,
      date: "2025-09-20 18:32",
      transactionId: "TXN0001",
    },
    feedbackGiven: false,
  },
  {
    id: "2",
    product: MOCK_LISTINGS[1],
    seller: { name: "seller111", avatar: avatar(12) },
    status: "Delivered",
    address: {
      ...DEFAULT_SHIPPING_ADDRESS,
      detail: "101 W Coast Vale, Block101 17-05, Parc Riviera, Singapore",
    },
    payment: {
      method: "PayPal",
      amount: 14.5,
      date: "2025-09-20 18:32",
      transactionId: "TXN123456789",
    },
    feedbackGiven: false,
  },
  {
    id: "3",
    product: MOCK_LISTINGS[2],
    seller: { name: "seller222", avatar: avatar(13) },
    status: "Cancelled",
    address: {
      ...DEFAULT_SHIPPING_ADDRESS,
      detail: "Singapore, Clementi Ave",
    },
    payment: {
      method: "PayPal",
      amount: 15,
      date: "2025-09-22 15:10",
      transactionId: "TXN999888777",
    },
    feedbackGiven: false,
  },
];

export const SOLD_ORDERS: SoldOrder[] = [
  {
    id: "1",
    product: MOCK_LISTINGS[3],
    buyer: { name: "buyer001", avatar: avatar(31) },
    status: "ToShip",
    feedbackGiven: false,
  },
  {
    id: "2",
    product: MOCK_LISTINGS[4],
    buyer: { name: "buyer002", avatar: avatar(32) },
    status: "Completed",
    feedbackGiven: false,
  },
];

export const PURCHASE_GRID_ITEMS = PURCHASE_ORDERS.map(({ id, product, status }) => ({
  id,
  image: product.images[0],
  status,
}));

export const SOLD_GRID_ITEMS = SOLD_ORDERS.map(({ id, product, status }) => ({
  id,
  image: product.images[0],
  status,
}));
