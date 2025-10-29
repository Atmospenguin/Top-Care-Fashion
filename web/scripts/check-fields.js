// 检查 listing 字段
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFields() {
  try {
    const listing = await prisma.listings.findFirst();
    if (listing) {
      console.log('Sample listing fields:', Object.keys(listing));
      console.log('Title:', listing.title);
      console.log('Description:', listing.description);
      console.log('Price:', listing.price);
      console.log('Brand:', listing.brand);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFields();
