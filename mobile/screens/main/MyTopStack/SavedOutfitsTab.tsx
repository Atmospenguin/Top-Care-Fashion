import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../../../components/Icon';

interface SavedOutfit {
  id: number;
  outfit_name: string | null;
  user_id: number;
  base_item_id: number | null;
  top_item_id: number | null;
  bottom_item_id: number | null;
  shoe_item_id: number | null;
  accessory_ids: number[];
  created_at: string;
  updated_at: string;
}

interface ListingItem {
  id: string;
  title: string;
  images: string[];
  price: number;
  category: string;
}

interface OutfitWithItems extends SavedOutfit {
  base_item?: ListingItem;
  top_item?: ListingItem;
  bottom_item?: ListingItem;
  shoe_item?: ListingItem;
  accessory_items?: ListingItem[];
}

const API_URL = 'http://192.168.31.188:3000';
const { width } = Dimensions.get('window');

export default function SavedOutfitsTab() {
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitWithItems | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchSavedOutfits();
  }, []);

  const fetchListingDetails = async (listingId: number): Promise<ListingItem | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log(`📦 Fetching listing ${listingId}...`);
      
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      console.log(`📦 Listing ${listingId} response status:`, response.status);

      if (!response.ok) {
        console.log(`❌ Failed to fetch listing ${listingId}`);
        return null;
      }

      const result = await response.json();
      console.log(`🔍 Full response for listing ${listingId}:`, JSON.stringify(result, null, 2));
      
      // Try different response structures
      const listing = result.data || result.listing || result;
      console.log(`✅ Fetched listing ${listingId}:`, listing?.title || listing?.name);
      
      // Map the response to our ListingItem format
      if (listing) {
        return {
          id: String(listing.id),
          title: listing.title || listing.name || 'Unknown Item',
          images: listing.images || listing.image_urls || [listing.image_url] || [],
          price: listing.price || 0,
          category: listing.category || '',
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching listing:', listingId, error);
      return null;
    }
  };

  const fetchSavedOutfits = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      console.log('🔍 Fetching saved outfits...');
      
      const response = await fetch(`${API_URL}/api/outfits`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();
      const outfitsData: SavedOutfit[] = result.data || [];
      
      console.log('📖 Fetched', outfitsData.length, 'outfits');

      // Fetch item details for each outfit
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
  };

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
            const token = await AsyncStorage.getItem('authToken');
            
            const response = await fetch(`${API_URL}/api/outfits/${outfitId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': token ? `Bearer ${token}` : '',
              },
            });

            if (response.ok) {
              setOutfits(outfits.filter(o => o.id !== outfitId));
              Alert.alert('Success', 'Outfit deleted');
            } else {
              Alert.alert('Error', 'Failed to delete outfit');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete outfit');
          }
        },
      },
    ]);
  };

  const renderItemImage = (item?: ListingItem, label?: string) => {
    if (!item) return null;

    return (
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {label && <Text style={styles.itemLabel}>{label}</Text>}
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
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
                <Text style={styles.outfitName}>
                  {item.outfit_name || 'Unnamed Outfit'}
                </Text>
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
              {item.top_item && renderItemImage(item.top_item, 'Top')}
              {item.bottom_item && renderItemImage(item.bottom_item, 'Bottom')}
              {item.shoe_item && renderItemImage(item.shoe_item, 'Shoes')}
              {item.accessory_items?.map((acc, idx) => (
                <View key={`accessory-${acc.id}-${idx}`}>
                  {renderItemImage(acc, `Accessory ${idx + 1}`)}
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
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedOutfit?.outfit_name || 'Unnamed Outfit'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {!selectedOutfit ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : (
              <>
                {/* Don't show base_item since it's already included in top/bottom/shoe */}
                
                {selectedOutfit.top_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Top</Text>
                    {renderItemImage(selectedOutfit.top_item)}
                  </View>
                )}

                {selectedOutfit.bottom_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Bottom</Text>
                    {renderItemImage(selectedOutfit.bottom_item)}
                  </View>
                )}

                {selectedOutfit.shoe_item && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Shoes</Text>
                    {renderItemImage(selectedOutfit.shoe_item)}
                  </View>
                )}

                {selectedOutfit.accessory_items && selectedOutfit.accessory_items.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Accessories</Text>
                    {selectedOutfit.accessory_items.map((item, idx) => (
                      <View key={`modal-accessory-${item.id}-${idx}`} style={{ marginBottom: 12 }}>
                        {renderItemImage(item)}
                      </View>
                    ))}
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
  outfitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
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
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
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
