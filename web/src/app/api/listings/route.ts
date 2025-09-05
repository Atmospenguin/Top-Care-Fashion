import { NextResponse } from "next/server";

export async function GET() {
  // Static mocked data for prototype stage
  const items = [
    { id: "1", title: "Classic White Tee", category: "Top", price: 19.99 },
    { id: "2", title: "Denim Jacket", category: "Outerwear", price: 59.99 },
    { id: "3", title: "Black Slim Jeans", category: "Bottom", price: 39.99 },
    { id: "4", title: "Summer Dress", category: "Dress", price: 49.99 },
    { id: "5", title: "Running Sneakers", category: "Shoes", price: 79.99 },
    { id: "6", title: "Leather Belt", category: "Accessory", price: 24.99 },
  ];

  return NextResponse.json({ items });
}



