import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../../components/Icon';
import { outfitService } from '../../../src/services/outfitService';
import { listingsService } from '../../../src/services/listingsService';
import type { SavedOutfit } from '../../../src/services/outfitService';
import type { ListingItem } from '../../../types/shop';

type OutfitWithItems = SavedOutfit & {
  base_item?: ListingItem;
  top_item?: ListingItem;
  bottom_item?: ListingItem;
  shoe_item?: ListingItem;
  accessory_items?: ListingItem[];
};

export default function SavedOutfitsTab() {
  const insets = useSafeAreaInsets();
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitWithItems | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const listingCache = useRef<Map<number, ListingItem | null>>(new Map());

  const fetchListingDetails = useCallback(async (listingId: number): Promise<ListingItem | null> => {
    if (listingCache.current.has(listingId)) {
      return listingCache.current.get(listingId) ?? null;
    }

    try {
      const listing = await listingsService.getListingById(String(listingId));
      listingCache.current.set(listingId, listing);
      return listing;
    } catch (error) {
      console.error('❌ Error fetching listing:', listingId, error);
      listingCache.current.set(listingId, null);
      return null;
    }
  }, []);

  const fetchSavedOutfits = useCallback(async () => {
    try {
      setLoading(true);

      const outfitsData = await outfitService.getSavedOutfits();
      console.log('📖 Fetched', outfitsData.length, 'outfits');

      const outfitsWithItems = await Promise.all(
        outfitsData.map(async (outfit) => {
          const [base_item, top_item, bottom_item, shoe_item] = await Promise.all([
            outfit.base_item_id ? fetchListingDetails(outfit.base_item_id) : null,
            outfit.top_item_id ? fetchListingDetails(outfit.top_item_id) : null,
            outfit.bottom_item_id ? fetchListingDetails(outfit.bottom_item_id) : null,
            outfit.shoe_item_id ? fetchListingDetails(outfit.shoe_item_id) : null,
          ]);

          const accessory_items = await Promise.all(
            outfit.accessory_ids.map(id => fetchListingDetails(id))
          );

          return {
            ...outfit,
            base_item: base_item || undefined,
            top_item: top_item || undefined,
            bottom_item: bottom_item || undefined,
            shoe_item: shoe_item || undefined,
            accessory_items: accessory_items.filter((item): item is ListingItem => item !== null),
          };
        })
      );

      setOutfits(outfitsWithItems);
      console.log('✅ Loaded outfits with item details');
    } catch (error) {
      console.error('❌ Error fetching saved outfits:', error);
      Alert.alert('Error', 'Failed to load saved outfits');
    } finally {
      setLoading(false);
    }
  }, [fetchListingDetails]);

  useEffect(() => {
    fetchSavedOutfits();
  }, [fetchSavedOutfits]);

  const handleViewOutfit = (outfit: OutfitWithItems) => {
    console.log('👁️ Viewing outfit:', outfit.outfit_name);
    console.log('👁️ Outfit items:', {
      base: outfit.base_item?.title,
      top: outfit.top_item?.title,
      bottom: outfit.bottom_item?.title,
      shoes: outfit.shoe_item?.title,
      accessories: outfit.accessory_items?.length,
    });
    setSelectedOutfit(outfit);
    setModalVisible(true);
  };

  const handleDeleteOutfit = async (outfitId: number) => {
    Alert.alert('Delete Outfit', 'Are you sure you want to delete this outfit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await outfitService.deleteOutfit(outfitId);
            setOutfits((prev) => prev.filter((o) => o.id !== outfitId));
            Alert.alert('Success', 'Outfit deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete outfit');
          }
        },
      },
    ]);
  };

  // ⭐ NEW: Helper to render match percentage badge
  const getMatchBadge = (score: number | undefined) => {
    if (!score || score === 0) return null;
    
    let badgeColor = '#4CAF50'; // Green for high match
    let starColor = '#FFD700';  // Gold star
    
    if (score < 70) {
      badgeColor = '#FF9800'; // Orange for medium match
      starColor = '#FFA500';
    }
    if (score < 50) {
      badgeColor = '#9E9E9E'; // Gray for low match
      starColor = '#BDBDBD';
    }
    
    return (
      <View style={[styles.matchBadge, { backgroundColor: badgeColor }]}>
        <Icon name="star" size={10} color={starColor} />
        <Text style={styles.matchBadgeText}>{Math.round(score)}%</Text>
      </View>
    );
  };

  const renderItemImage = (item?: ListingItem, label?: string, matchScore?: number | null) => {
    if (!item) return null;

    const primaryImage = Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : 'https://via.placeholder.com/150';

    const displayScore = typeof matchScore === 'number' ? matchScore : undefined;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: primaryImage }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          {/* ⭐ NEW: Show match badge if score exists */}
          {displayScore && displayScore > 0 && (
            <View style={styles.badgeContainer}>
              {getMatchBadge(displayScore)}
            </View>
          )}
        </View>
        {label && <Text style={styles.itemLabel}>{label}</Text>}
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        {/* ⭐ NEW: Show price */}
        <Text style={styles.itemPrice}>${item.price.toFixed(0)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={[styles.emptySubtext, { marginTop: 12 }]}>Loading your outfits...</Text>
      </View>
    );
  }

  if (outfits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No saved outfits yet</Text>
        <Text style={styles.emptySubtext}>
          Create your first outfit using Mix & Match!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={outfits}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.outfitCard}
            onPress={() => handleViewOutfit(item)}
            activeOpacity={0.7}
          >
            <View style={styles.outfitHeader}>
              <View style={styles.outfitInfo}>
                <View style={styles.outfitNameRow}>
                  <Text style={styles.outfitName}>
                    {item.outfit_name || 'Unnamed Outfit'}
                  </Text>
                  {/* ⭐ NEW: Show AI rating if available */}
                  {item.ai_rating && item.ai_rating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={12} color="#FFD700" />
                      <Text style={styles.ratingText}>{item.ai_rating}/10</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.outfitDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteOutfit(item.id);
                }}
                style={styles.deleteButton}
              >
                <Icon name="trash-outline" size={20} color="#FF4D4D" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.itemsScroll}
            >
              {/* Don't show base_item since it's already included in top/bottom/shoe */}
              {item.top_item && renderItemImage(item.top_item, 'Top', item.top_match_score)}
              {item.bottom_item && renderItemImage(item.bottom_item, 'Bottom', item.bottom_match_score)}
              {item.shoe_item && renderItemImage(item.shoe_item, 'Shoes', item.shoe_match_score)}
              {item.accessory_items?.map((acc, idx) => (
                <View key={`accessory-${acc.id}-${idx}`}>
                  {renderItemImage(
                    acc,
                    `Accessory ${idx + 1}`,
                    item.accessory_match_scores?.[String(acc.id)]
                  )}
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        )}
      />

      {/* Full Outfit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedOutfit(null);
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                {selectedOutfit?.outfit_name || 'Unnamed Outfit'}
              </Text>
              {/* ⭐ NEW: Show rating in modal */}
              {selectedOutfit?.ai_rating && selectedOutfit.ai_rating > 0 && (
                <View style={styles.modalRatingBadge}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <Text style={styles.modalRatingText}>{selectedOutfit.ai_rating}/10</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setSelectedOutfit(null);
            }}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {!selectedOutfit ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : (
              <>
                {/* ⭐ NEW: Show style name if available */}
                {selectedOutfit.style_name && (
                  <View style={styles.styleNameBanner}>
                    <Icon name="sparkles" size={16} color="#8B5CF6" />
                    <Text style={styles.styleNameText}>{selectedOutfit.style_name}</Text>
                  </View>
                )}
                
                {/* Don't show base_item since it's already included in top/bottom/shoe */}
                
                {selectedOutfit.top_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Top</Text>
                    {renderItemImage(selectedOutfit.top_item, undefined, selectedOutfit.top_match_score)}
                  </View>
                )}

                {selectedOutfit.bottom_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Bottom</Text>
                    {renderItemImage(selectedOutfit.bottom_item, undefined, selectedOutfit.bottom_match_score)}
                  </View>
                )}

                {selectedOutfit.shoe_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Shoes</Text>
                    {renderItemImage(selectedOutfit.shoe_item, undefined, selectedOutfit.shoe_match_score)}
                  </View>
                )}

                {selectedOutfit.accessory_items && selectedOutfit.accessory_items.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Accessories</Text>
                    {selectedOutfit.accessory_items.map((item, idx) => (
                      <View key={`modal-accessory-${item.id}-${idx}`} style={{ marginBottom: 12 }}>
                        {renderItemImage(
                          item,
                          undefined,
                          selectedOutfit.accessory_match_scores?.[String(item.id)]
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* ⭐ NEW: Show total price if available */}
                {selectedOutfit.total_price && selectedOutfit.total_price > 0 && (
                  <View style={styles.totalPriceSection}>
                    <Text style={styles.totalPriceLabel}>💰 Total Price:</Text>
                    <Text style={styles.totalPriceValue}>${selectedOutfit.total_price.toFixed(0)}</Text>
                  </View>
                )}

                {!selectedOutfit.top_item && 
                 !selectedOutfit.bottom_item && 
                 !selectedOutfit.shoe_item && 
                 (!selectedOutfit.accessory_items || selectedOutfit.accessory_items.length === 0) && (
                  <Text style={styles.emptyText}>No items found in this outfit</Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  outfitCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  outfitInfo: {
    flex: 1,
  },
  // ⭐ NEW: Row for outfit name + rating
  outfitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: '600',
  },
  // ⭐ NEW: Rating badge next to outfit name
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  outfitDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  itemsScroll: {
    marginTop: 8,
  },
  itemContainer: {
    marginRight: 12,
    width: 100,
  },
  // ⭐ NEW: Wrapper for image with badge positioning
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  // ⭐ NEW: Badge container positioned on image
  badgeContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  // ⭐ NEW: Match badge style
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  itemLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  // ⭐ NEW: Item price style
  itemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 2,
  },
  // ⭐ NEW: Total price section in modal
  totalPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  totalPriceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // ⭐ NEW: Container for modal title + rating
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  // ⭐ NEW: Rating badge in modal header
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  modalRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  // ⭐ NEW: Style name banner in modal
  styleNameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  styleNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B21A8',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});
