// Simple script to seed the canonical listing categories.
// Run with: node web/insert-categories.js

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BASE_CATEGORIES = [
  {
    name: "Accessories",
    description: "General accessories such as bags, jewelry, belts, etc.",
  },
  {
    name: "Bottoms",
    description: "Pants, jeans, skirts, shorts and related items.",
  },
  {
    name: "Footwear",
    description: "Sneakers, boots, heels and other shoes.",
  },
  {
    name: "Outerwear",
    description: "Coats, jackets, blazers and layering pieces.",
  },
  {
    name: "Tops",
    description: "Tops, shirts, dresses, hoodies and similar apparel.",
  },
];

async function main() {
  try {
    console.log("🚀 Seeding listing categories...");
    for (const category of BASE_CATEGORIES) {
      // Prisma `upsert` requires a unique field in `where`.
      // The schema doesn't mark `name` as unique, so use findFirst -> update/create.
      const existing = await prisma.listing_categories.findFirst({
        where: { name: category.name },
      });

      if (existing) {
        await prisma.listing_categories.update({
          where: { id: existing.id },
          data: { description: category.description },
        });
        console.log(`✅ Updated category '${category.name}' (id=${existing.id})`);
      } else {
        const created = await prisma.listing_categories.create({
          data: {
            name: category.name,
            description: category.description,
          },
        });
        console.log(`✅ Created category '${category.name}' (id=${created.id})`);
      }
    }
    console.log("🎉 Category seeding complete!");
  } catch (error) {
    console.error("❌ Failed to seed categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
