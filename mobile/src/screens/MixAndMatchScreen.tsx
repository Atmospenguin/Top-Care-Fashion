// screens/MixAndMatchScreen.tsx
import { 
  generateSampleClothingItems, 
  generateSampleUserPreferences,
  mockAPIDelay 
} from '../utils/sampleDataGenerator';
import { ClothingItem, UserPreferences, Outfit } from '../types/mixAndMatch';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationEngine } from '../services/recommendationEngine';

const { width } = Dimensions.get('window');

export const MixAndMatchScreen = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  const recommendationEngine = new RecommendationEngine();
  
  useEffect(() => {
    loadRecommendations();
  }, []);
  
  const loadRecommendations = async () => {
    // Fetch items and user preferences from your backend
   const fetchClothingItems = async (): Promise<ClothingItem[]> => {
  await mockAPIDelay(500); // Simulate network delay
  return generateSampleClothingItems();
};
    const fetchUserPreferences = async (): Promise<UserPreferences> => {
  await mockAPIDelay(300);
  return generateSampleUserPreferences('test-user-123');
};
    
    const addItemsToCart = async (items: ClothingItem[]) => {
  console.log('Adding to cart:', items);
  return true;
};
    
    const recommendations = recommendationEngine.generateOutfits(
      items,
      userPrefs,
      10
    );
    
    setOutfits(recommendations);
  };
  
  const currentOutfit = outfits[currentIndex];
  
  const handleItemPress = (item: ClothingItem) => {
    // Navigate to item detail screen
    navigation.navigate('ItemDetail', { itemId: item.id });
  };
  
  const handleLike = (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setCurrentIndex(prev => Math.min(prev + 1, outfits.length - 1));
    } else {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };
  
  const handleSaveToCart = async () => {
    // Add all items in current outfit to cart
    const items = [
      currentOutfit.top,
      currentOutfit.bottom,
      currentOutfit.shoes,
      ...(currentOutfit.accessories || [])
    ].filter(Boolean);
    
    await addItemsToCart(items);
    // Show success message
  };
  
  if (!currentOutfit) {
    return <Text>Loading...</Text>;
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Mix & Match</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="bag-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Gender Selection */}
      <View style={styles.genderSelection}>
        <TouchableOpacity style={[styles.genderBtn, styles.selectedGender]}>
          <Text style={styles.genderText}>Girl</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.genderBtn}>
          <Text style={styles.genderText}>Boy</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Top */}
        {currentOutfit.top && (
          <OutfitItemCard
            item={currentOutfit.top}
            label="TOP"
            onPress={() => handleItemPress(currentOutfit.top!)}
            onLike={() => handleLike(currentOutfit.top!.id)}
            isLiked={likedItems.has(currentOutfit.top.id)}
            onSwipeLeft={() => {/* Swap this item */}}
            onSwipeRight={() => {/* Swap this item */}}
          />
        )}
        
        {/* Bottom */}
        {currentOutfit.bottom && (
          <OutfitItemCard
            item={currentOutfit.bottom}
            label="BOTTOM"
            onPress={() => handleItemPress(currentOutfit.bottom!)}
            onLike={() => handleLike(currentOutfit.bottom!.id)}
            isLiked={likedItems.has(currentOutfit.bottom.id)}
            onSwipeLeft={() => {/* Swap this item */}}
            onSwipeRight={() => {/* Swap this item */}}
          />
        )}
        
        {/* Shoes */}
        {currentOutfit.shoes && (
          <OutfitItemCard
            item={currentOutfit.shoes}
            label="SHOES"
            onPress={() => handleItemPress(currentOutfit.shoes!)}
            onLike={() => handleLike(currentOutfit.shoes!.id)}
            isLiked={likedItems.has(currentOutfit.shoes.id)}
            onSwipeLeft={() => {/* Swap this item */}}
            onSwipeRight={() => {/* Swap this item */}}
          />
        )}
        
        {/* Accessories */}
        {currentOutfit.accessories?.map((acc, idx) => (
          <OutfitItemCard
            key={acc.id}
            item={acc}
            label="ACCESSORY"
            onPress={() => handleItemPress(acc)}
            onLike={() => handleLike(acc.id)}
            isLiked={likedItems.has(acc.id)}
            onSwipeLeft={() => {/* Swap this item */}}
            onSwipeRight={() => {/* Swap this item */}}
          />
        ))}
      </ScrollView>
      
      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveToCart}>
        <Text style={styles.saveButtonText}>Save To Cart</Text>
      </TouchableOpacity>
      
      {/* AI Match Score */}
      <View style={styles.matchScore}>
        <Text style={styles.matchScoreText}>
          Match Score: {Math.round(currentOutfit.matchScore * 100)}%
        </Text>
      </View>
    </View>
  );
};

const OutfitItemCard = ({ item, label, onPress, onLike, isLiked, onSwipeLeft, onSwipeRight }) => (
  <View style={styles.itemCard}>
    <Text style={styles.itemLabel}>{label}</Text>
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={onSwipeLeft} style={styles.swipeButton}>
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onPress} style={styles.itemImageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <Text style={styles.itemPrice}>${item.price}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onSwipeRight} style={styles.swipeButton}>
        <Ionicons name="chevron-forward" size={24} color="#000" />
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity onPress={onLike} style={styles.likeButton}>
      <Ionicons 
        name={isLiked ? "heart" : "heart-outline"} 
        size={24} 
        color={isLiked ? "#FF0000" : "#000"} 
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  genderSelection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  genderBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedGender: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  genderText: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  itemCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeButton: {
    padding: 16,
  },
  itemImageContainer: {
    width: width * 0.7,
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  itemPrice: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  likeButton: {
    position: 'absolute',
    bottom: 8,
    right: width * 0.15 + 16,
  },
  saveButton: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchScore: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  matchScoreText: {
    fontSize: 14,
    color: '#666',
  },

});
