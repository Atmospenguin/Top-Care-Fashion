//Rule-based (no external API)
// services/recommendationEngine.ts
export class RecommendationEngine {
  // Calculate compatibility score between items
  private calculateCompatibility(
    item1: ClothingItem,
    item2: ClothingItem
  ): number {
    let score = 0;
    
    // Color harmony
    const colorMatch = this.checkColorHarmony(item1.colors, item2.colors);
    score += colorMatch * 0.3;
    
    // Style matching
    const styleOverlap = item1.style.filter(s => item2.style.includes(s)).length;
    score += (styleOverlap / Math.max(item1.style.length, item2.style.length)) * 0.3;
    
    // Season compatibility
    const seasonMatch = item1.season.some(s => item2.season.includes(s));
    score += seasonMatch ? 0.2 : 0;
    
    // Tag similarity
    const tagOverlap = item1.tags.filter(t => item2.tags.includes(t)).length;
    score += (tagOverlap / Math.max(item1.tags.length, item2.tags.length)) * 0.2;
    
    return score;
  }
  
  private checkColorHarmony(colors1: string[], colors2: string[]): number {
    // Implement color theory rules
    const complementaryPairs = {
      'red': ['green', 'white', 'black'],
      'blue': ['orange', 'white', 'beige'],
      'yellow': ['purple', 'gray', 'navy'],
      // Add more combinations
    };
    
    // Check for direct matches or complementary colors
    for (const color1 of colors1) {
      for (const color2 of colors2) {
        if (color1 === color2) return 1.0;
        if (complementaryPairs[color1]?.includes(color2)) return 0.9;
      }
    }
    return 0.5;
  }
  
  // Generate outfit recommendations based on user preferences
  public generateOutfits(
    items: ClothingItem[],
    userPrefs: UserPreferences,
    count: number = 5
  ): Outfit[] {
    const tops = items.filter(i => i.category === 'top');
    const bottoms = items.filter(i => i.category === 'bottom');
    const shoes = items.filter(i => i.category === 'shoes');
    const accessories = items.filter(i => i.category === 'accessories');
    
    const outfits: Outfit[] = [];
    
    // Generate combinations
    for (const top of tops) {
      for (const bottom of bottoms) {
        for (const shoe of shoes) {
          const outfit: Outfit = {
            id: `${top.id}-${bottom.id}-${shoe.id}`,
            top,
            bottom,
            shoes: shoe,
            accessories: this.selectAccessories(accessories, top, bottom, shoe),
            totalPrice: top.price + bottom.price + shoe.price,
            matchScore: 0
          };
          
          // Calculate match score
          outfit.matchScore = this.calculateOutfitScore(outfit, userPrefs);
          outfits.push(outfit);
        }
      }
    }
    
    // Sort by match score and return top results
    return outfits
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, count);
  }
  
  private calculateOutfitScore(outfit: Outfit, userPrefs: UserPreferences): number {
    let score = 0;
    
    // Item compatibility
    if (outfit.top && outfit.bottom) {
      score += this.calculateCompatibility(outfit.top, outfit.bottom) * 0.4;
    }
    if (outfit.top && outfit.shoes) {
      score += this.calculateCompatibility(outfit.top, outfit.shoes) * 0.3;
    }
    if (outfit.bottom && outfit.shoes) {
      score += this.calculateCompatibility(outfit.bottom, outfit.shoes) * 0.3;
    }
    
    // User preference alignment
    const items = [outfit.top, outfit.bottom, outfit.shoes].filter(Boolean) as ClothingItem[];
    
    // Favorite colors
    const colorMatch = items.some(item => 
      item.colors.some(color => userPrefs.favoriteColors.includes(color))
    );
    score += colorMatch ? 0.2 : 0;
    
    // Preferred styles
    const styleMatch = items.some(item =>
      item.style.some(style => userPrefs.preferredStyles.includes(style))
    );
    score += styleMatch ? 0.2 : 0;
    
    // Price range preference
    if (outfit.totalPrice >= userPrefs.priceRange.min && 
        outfit.totalPrice <= userPrefs.priceRange.max) {
      score += 0.15;
    }
    
    // Purchase history (collaborative filtering)
    const historyMatch = items.filter(item =>
      userPrefs.purchaseHistory.includes(item.id) ||
      userPrefs.likedItems.includes(item.id)
    ).length;
    score += (historyMatch / items.length) * 0.15;
    
    return score;
  }
  
  private selectAccessories(
    accessories: ClothingItem[],
    top: ClothingItem,
    bottom: ClothingItem,
    shoes: ClothingItem
  ): ClothingItem[] {
    // Select 1-2 accessories that match the outfit
    return accessories
      .map(acc => ({
        item: acc,
        score: (
          this.calculateCompatibility(acc, top) +
          this.calculateCompatibility(acc, bottom) +
          this.calculateCompatibility(acc, shoes)
        ) / 3
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(a => a.item);
  }
}