export interface ClothingItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessories';
  price: number;
  imageUrl: string;
  colors: string[];
  style: string[]; // e.g., ['casual', 'formal', 'sporty']
  season: string[];
  brand: string;
  tags: string[];
}

export interface UserPreferences {
  userId: string;
  favoriteColors: string[];
  preferredStyles: string[];
  priceRange: { min: number; max: number };
  favoriteBrands: string[];
  purchaseHistory: string[]; // item IDs
  likedItems: string[]; // item IDs
  viewedItems: string[]; // item IDs
  dislikedItems: string[];     
  preferredGender: 'boy' | 'girl' | 'both'; 
}

export interface Outfit {
  id: string;
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  accessories?: ClothingItem[];
  totalPrice: number;
  matchScore: number;

}
