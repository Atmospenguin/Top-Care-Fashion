import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import SaveOutfitModal from "../../../src/components/SaveOutfitModal";
import { outfitService } from "../../../src/services/outfitService";
import type { BuyStackParamList } from "./index";
import type { BagItem, ListingItem } from "../../../types/shop";

const PLACEHOLDER_MESSAGE = "Select an item";

function PreviewCard({
  item,
  imageMode = "contain",
}: {
  item: ListingItem | null;
  imageMode?: "contain" | "cover";
}) {
  const [aspect, setAspect] = useState(3 / 4);

  useEffect(() => {
    if (!item?.images?.length) return;
    let mounted = true;
    Image.getSize(
      item.images[0],
      (width, height) => {
        if (!mounted || !height) return;
        setAspect(width / height);
      },
      () => {}
    );
    return () => {
      mounted = false;
    };
  }, [item?.images]);

  if (!item) {
    return (
      <View style={styles.previewPlaceholder}>
        <Text style={styles.previewPlaceholderText}>{PLACEHOLDER_MESSAGE}</Text>
      </View>
    );
  }

  return (
    <View style={styles.previewBlock}>
      <View style={styles.previewImageWrap}>
        <Image
          source={{ uri: item.images[0] }}
          resizeMode={imageMode}
          style={[styles.previewCardImage, { aspectRatio: aspect }]}
        />
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>${item.price.toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.previewItemTitle}>
        {item.title}
      </Text>
    </View>
  );
}

function AccessoryGrid({
  items,
}: {
  items: ListingItem[];
}) {
  if (!items.length) {
    return (
      <View style={styles.previewPlaceholder}>
        <Text style={styles.previewPlaceholderText}>
          Add accessories to complete the look
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.accessoryColumn}>
      {items.map((item) => (
        <View key={item.id} style={styles.accessoryBlock}>
          <View style={styles.accessoryImageWrap}>
            <Image
              source={{ uri: item.images[0] }}
              style={styles.accessoryImage}
              resizeMode="cover"
            />
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${item.price.toFixed(0)}</Text>
            </View>
          </View>
          <Text style={styles.accessoryTitle}>
            {item.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ViewOutfitScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const route = useRoute<RouteProp<BuyStackParamList, "ViewOutfit">>();
  const { baseItem, top, bottom, shoe, accessories, selection } = route.params;
  const captureViewRef = useRef<View | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveOutfitModalVisible, setSaveOutfitModalVisible] = useState(false);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);

  const composedSelection: BagItem[] = useMemo(() => {
    const unique = new Map<string, ListingItem>();
    selection.forEach((entry) => unique.set(entry.item.id, entry.item));
    return Array.from(unique.values()).map((item) => ({ item, quantity: 1 }));
  }, [selection]);

  const handleShare = useCallback(async () => {
    if (!captureViewRef.current) return;
    
    try {
      setIsSaving(true);
      const uri = await captureRef(captureViewRef, {
        format: "png",
        quality: 0.95,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Share your outfit",
          mimeType: "image/png",
        });
      } else {
        Alert.alert("Unable to share", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("handleShare", error);
      Alert.alert("Error", "Unable to export image, please try again later");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAddToBag = useCallback(() => {
    navigation.navigate("Bag", { items: composedSelection });
  }, [navigation, composedSelection]);

  const handleSaveOutfit = async (outfitName: string) => {
    try {
      setIsSavingOutfit(true);
      
      await outfitService.createOutfit({
        outfit_name: outfitName,
        base_item_id: baseItem.id,
        top_item_id: top?.id || null,
        bottom_item_id: bottom?.id || null,
        shoe_item_id: shoe?.id || null,
        accessory_ids: accessories.map(acc => acc.id),
      });

      Alert.alert('Success', `"${outfitName}" saved successfully!`);
      setSaveOutfitModalVisible(false);
    } catch (error) {
      console.error('Error saving outfit:', error);
      throw error;
    } finally {
      setIsSavingOutfit(false);
    }
  };

  const leftItems: Array<{ item: ListingItem | null }> = [
    { item: top || baseItem },
    { item: bottom || baseItem },
  ];
  
  const rightItems = shoe ? [shoe, ...accessories] : accessories;

  return (
    <View style={styles.container}>
      <Header title="View Outfit" showBack />
      <SafeAreaView style={styles.body} edges={["left", "right"]}>
        <View style={[styles.content, { paddingBottom: 120 }]}>
          <View
            ref={captureViewRef}
            collapsable={false}
            style={styles.captureCanvas}
          >
            <View style={styles.previewRow}>
              <View style={styles.leftColumn}>
                {leftItems.map((section, index) => (
                  <PreviewCard key={index} item={section.item} />
                ))}
              </View>
              <View style={styles.rightColumn}>
                <Text style={styles.sectionLabel}>ACCESSORIES</Text>
                <AccessoryGrid items={rightItems} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSafe}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.saveOutfitButton}
              onPress={() => setSaveOutfitModalVisible(true)}
            >
              <Icon name="bookmark" size={20} color="#111" />
              <Text style={styles.saveOutfitButtonText}>Save Outfit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShare}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <Icon name="refresh" size={18} color="#111" />
              ) : (
                <>
                  <Icon name="share" size={18} color="#111" />
                  <Text style={styles.secondaryText}>Share</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddToBag}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryText}>Add All To Bag</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SaveOutfitModal
          visible={saveOutfitModalVisible}
          onClose={() => setSaveOutfitModalVisible(false)}
          onSave={handleSaveOutfit}
          isLoading={isSavingOutfit}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 120,
    paddingHorizontal: 8,
    paddingTop: 0,
    rowGap: 20,
  },
  captureCanvas: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 24,
  },
  previewRow: {
    flexDirection: "row",
    columnGap: 20,
  },
  leftColumn: {
    flex: 3,
    rowGap: 12,
  },
  rightColumn: {
    flex: 2,
    rowGap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#6a6a6a",
  },
  previewBlock: {
    rowGap: 6,
  },
  previewImageWrap: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f4f4f4",
  },
  previewCardImage: {
    width: "100%",
    height: undefined,
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },
  previewItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6a6a6a",
    textAlign: "left",
    paddingHorizontal: 6,
  },
  previewPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#f4f4f4",
    borderRadius: 20,
    padding: 32,
  },
  previewPlaceholderText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  accessoryColumn: {
    rowGap: 24,
  },
  accessoryBlock: {
    rowGap: 6,
  },
  accessoryImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f4f4f4",
  },
  accessoryImage: {
    width: "100%",
    height: "100%",
  },
  accessoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6a6a6a",
    textAlign: "center",
  },
  bottomSafe: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    columnGap: 8,
  },
  saveOutfitButton: {
    flex: 1,
    marginRight: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    columnGap: 8,
  },
  saveOutfitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    marginRight: 0,
    backgroundColor: "#fff",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
