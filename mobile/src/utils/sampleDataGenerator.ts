// mobile/src/utils/sampleDataGenerator.ts

import { ClothingItem, UserPreferences } from '../types/mixAndMatch';

/**
 * Generate sample clothing items for testing
 * Use this while your backend API is being developed
 */
export const generateSampleClothingItems = (): ClothingItem[] => {
  return [
    // TOPS - GIRLS
    {
      id: 'top-g-1',
      name: 'Graphic Hoodie',
      category: 'top',
      price: 74,
      imageUrl: 'https://via.placeholder.com/400x400/f5f5dc/333333?text=Graphic+Hoodie',
      colors: ['white', 'gray'],
      style: ['casual', 'streetwear'],
      season: ['fall', 'winter'],
      brand: 'TopCare',
      tags: ['hoodie', 'graphic', 'comfortable'],
    },
    {
      id: 'top-g-2',
      name: 'Pink Sweater',
      category: 'top',
      price: 45,
      imageUrl: 'https://via.placeholder.com/400x400/ffb6c1/333333?text=Pink+Sweater',
      colors: ['pink', 'white'],
      style: ['casual', 'elegant'],
      season: ['fall', 'winter', 'spring'],
      brand: 'TopCare',
      tags: ['sweater', 'warm', 'cozy'],
    },
    {
      id: 'top-g-3',
      name: 'Floral Blouse',
      category: 'top',
      price: 38,
      imageUrl: 'https://via.placeholder.com/400x400/fff8dc/333333?text=Floral+Blouse',
      colors: ['white', 'pink', 'green'],
      style: ['elegant', 'casual'],
      season: ['spring', 'summer'],
      brand: 'TopCare',
      tags: ['blouse', 'floral', 'feminine'],
    },
    {
      id: 'top-g-4',
      name: 'Denim Jacket',
      category: 'top',
      price: 65,
      imageUrl: 'https://via.placeholder.com/400x400/4682b4/ffffff?text=Denim+Jacket',
      colors: ['denim', 'blue'],
      style: ['casual', 'streetwear'],
      season: ['spring', 'fall'],
      brand: 'TopCare',
      tags: ['jacket', 'denim', 'versatile'],
    },

    // TOPS - BOYS
    {
      id: 'top-b-1',
      name: 'Striped Polo',
      category: 'top',
      price: 35,
      imageUrl: 'https://via.placeholder.com/400x400/4682b4/ffffff?text=Striped+Polo',
      colors: ['navy', 'white'],
      style: ['preppy', 'casual'],
      season: ['spring', 'summer'],
      brand: 'TopCare',
      tags: ['polo', 'striped', 'smart-casual'],
    },
    {
      id: 'top-b-2',
      name: 'Sports Hoodie',
      category: 'top',
      price: 55,
      imageUrl: 'https://via.placeholder.com/400x400/696969/ffffff?text=Sports+Hoodie',
      colors: ['gray', 'black'],
      style: ['sporty', 'casual'],
      season: ['fall', 'winter'],
      brand: 'TopCare',
      tags: ['hoodie', 'sports', 'athletic'],
    },

    // BOTTOMS - GIRLS
    {
      id: 'bottom-g-1',
      name: 'Ruffled Skirt',
      category: 'bottom',
      price: 25,
      imageUrl: 'https://via.placeholder.com/400x400/f0f0f0/333333?text=Ruffled+Skirt',
      colors: ['white', 'silver'],
      style: ['elegant', 'casual'],
      season: ['spring', 'summer'],
      brand: 'TopCare',
      tags: ['skirt', 'ruffled', 'feminine'],
    },
    {
      id: 'bottom-g-2',
      name: 'Denim Jeans',
      category: 'bottom',
      price: 48,
      imageUrl: 'https://via.placeholder.com/400x400/4169e1/ffffff?text=Denim+Jeans',
      colors: ['denim', 'blue'],
      style: ['casual', 'streetwear'],
      season: ['spring', 'fall', 'winter'],
      brand: 'TopCare',
      tags: ['jeans', 'denim', 'versatile'],
    },
    {
      id: 'bottom-g-3',
      name: 'Pink Leggings',
      category: 'bottom',
      price: 28,
      imageUrl: 'https://via.placeholder.com/400x400/ffb6c1/333333?text=Pink+Leggings',
      colors: ['pink'],
      style: ['casual', 'sporty'],
      season: ['spring', 'summer', 'fall'],
      brand: 'TopCare',
      tags: ['leggings', 'comfortable', 'stretchy'],
    },

    // BOTTOMS - BOYS
    {
      id: 'bottom-b-1',
      name: 'Cargo Shorts',
      category: 'bottom',
      price: 35,
      imageUrl: 'https://via.placeholder.com/400x400/8b4513/ffffff?text=Cargo+Shorts',
      colors: ['brown', 'beige'],
      style: ['casual', 'sporty'],
      season: ['spring', 'summer'],
      brand: 'TopCare',
      tags: ['shorts', 'cargo', 'practical'],
    },
    {
      id: 'bottom-b-2',
      name: 'Black Joggers',
      category: 'bottom',
      price: 42,
      imageUrl: 'https://via.placeholder.com/400x400/000000/ffffff?text=Black+Joggers',
      colors: ['black'],
      style: ['sporty', 'casual'],
      season: ['fall', 'winter', 'spring'],
      brand: 'TopCare',
      tags: ['joggers', 'comfortable', 'athletic'],
    },

    // SHOES - GIRLS
    {
      id: 'shoes-g-1',
      name: 'Winter Boots',
      category: 'shoes',
      price: 100,
      imageUrl: 'https://via.placeholder.com/400x400/d2b48c/333333?text=Winter+Boots',
      colors: ['beige', 'brown', 'cream'],
      style: ['casual'],
      season: ['fall', 'winter'],
      brand: 'TopCare',
      tags: ['boots', 'winter', 'warm'],
    },
    {
      id: 'shoes-g-2',
      name: 'White Sneakers',
      category: 'shoes',
      price: 75,
      imageUrl: 'https://via.placeholder.com/400x400/ffffff/333333?text=White+Sneakers',
      colors: ['white'],
      style: ['casual', 'sporty'],
      season: ['spring', 'summer', 'fall'],
      brand: 'TopCare',
      tags: ['sneakers', 'comfortable', 'versatile'],
    },

    // SHOES - BOYS
    {
      id: 'shoes-b-1',
      name: 'Sports Sneakers',
      category: 'shoes',
      price: 85,
      imageUrl: 'https://via.placeholder.com/400x400/4169e1/ffffff?text=Sports+Sneakers',
      colors: ['blue', 'white'],
      style: ['sporty', 'casual'],
      season: ['spring', 'summer', 'fall'],
      brand: 'TopCare',
      tags: ['sneakers', 'athletic', 'comfortable'],
    },
    {
      id: 'shoes-b-2',
      name: 'Black Boots',
      category: 'shoes',
      price: 95,
      imageUrl: 'https://via.placeholder.com/400x400/000000/ffffff?text=Black+Boots',
      colors: ['black'],
      style: ['casual'],
      season: ['fall', 'winter'],
      brand: 'TopCare',
      tags: ['boots', 'durable', 'winter'],
    },

    // ACCESSORIES - UNISEX
    {
      id: 'acc-1',
      name: 'Beanie Hat',
      category: 'accessories',
      price: 18,
      imageUrl: 'https://via.placeholder.com/400x400/696969/ffffff?text=Beanie+Hat',
      colors: ['gray'],
      style: ['casual', 'streetwear'],
      season: ['fall', 'winter'],
      brand: 'TopCare',
      tags: ['hat', 'beanie', 'warm'],
    },
    {
      id: 'acc-2',
      name: 'Sunglasses',
      category: 'accessories',
      price: 35,
      imageUrl: 'https://via.placeholder.com/400x400/000000/ffffff?text=Sunglasses',
      colors: ['black'],
      style: ['casual', 'streetwear'],
      season: ['spring', 'summer'],
      brand: 'TopCare',
      tags: ['sunglasses', 'cool', 'protection'],
    },
  ];
};

/**
 * Generate sample user preferences for testing
 */
export const generateSampleUserPreferences = (userId: string = 'test-user'): UserPreferences => {
  return {
    userId,
    favoriteColors: ['white', 'pink', 'blue', 'gray'],
    preferredStyles: ['casual', 'elegant'],
    priceRange: { min: 0, max: 150 },
    favoriteBrands: ['TopCare'],
    purchaseHistory: ['top-g-2', 'bottom-g-2'], // Previously bought items
    likedItems: ['top-g-1', 'shoes-g-2', 'acc-2'], // Liked items
    viewedItems: ['top-g-3', 'bottom-g-1', 'shoes-g-1'],
  };
};

/**
 * Mock API delay for realistic testing
 */
export const mockAPIDelay = (ms: number = 800) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};