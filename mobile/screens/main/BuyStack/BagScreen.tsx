import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import type { BuyStackParamList } from "./index";
import type { HomeStackParamList } from "../HomeStack";
import { DEFAULT_BAG_ITEMS } from "../../../mocks/shop";
import { cartService, CartItem } from "../../../src/services";

export default function BagScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const route = useRoute<RouteProp<BuyStackParamList, "Bag">>();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用传入的items作为fallback，或者从API获取
  const items = route.params?.items ?? cartItems;

  // 加载购物车数据
  useEffect(() => {
    const loadCartItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await cartService.getCartItems();
        setCartItems(items);
      } catch (err) {
        console.error('Error loading cart items:', err);
        setError('Failed to load cart items');
        // 如果API失败，使用默认数据
        setCartItems(DEFAULT_BAG_ITEMS);
      } finally {
        setLoading(false);
      }
    };

    // 如果没有传入items参数，则从API加载
    if (!route.params?.items) {
      loadCartItems();
    } else {
      setLoading(false);
    }
  }, [route.params?.items]);

  const { subtotal, shipping, total } = useMemo(() => {
    const computedSubtotal = items.reduce(
      (sum, current) => {
        const price = typeof current.item.price === 'number' ? current.item.price : parseFloat(current.item.price || '0');
        return sum + price * current.quantity;
      },
      0,
    );
    // 🔥 使用真实的 shipping fee 数据
    // 累加所有商品的 shipping fee（如果商品有运费的话）
    const shippingFee = items.reduce((sum, current) => {
      const fee = current.item.shippingFee ? Number(current.item.shippingFee) : 0;
      return sum + fee;
    }, 0);
    return {
      subtotal: computedSubtotal,
      shipping: shippingFee,
      total: computedSubtotal + shippingFee,
    };
  }, [items]);

  // 更新商品数量
  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(cartItemId);
      return;
    }

    try {
      await cartService.updateCartItem(cartItemId, newQuantity);
      // 更新本地状态
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } catch (err) {
      console.error('Error updating quantity:', err);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // 删除商品
  const removeItem = async (cartItemId: number) => {
    try {
      await cartService.removeCartItem(cartItemId);
      // 更新本地状态
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    } catch (err) {
      console.error('Error removing item:', err);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header title="My Bag" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.screen}>
        <Header title="My Bag" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              cartService.getCartItems()
                .then(setCartItems)
                .catch(() => setError('Failed to load cart items'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="My Bag" showBack />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="bag-handle-outline" size={42} color="#bbb" />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to see them appear here.</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => {
              const parent = (navigation as any).getParent?.();
              if (parent?.reset) {
                parent.reset({
                  index: 0,
                  routes: [
                    { name: "Main", params: { screen: "Home", params: { screen: "HomeMain" } } },
                  ],
                });
              } else {
                parent?.navigate?.("Main", { screen: "Home", params: { screen: "HomeMain" } });
              }
            }}
          >
            <Text style={styles.exploreText}>Explore listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.itemsCard}>
            {items.map((cartItem) => {
              const { item, quantity, id } = cartItem;
              return (
                <View key={`${item.id}`} style={styles.itemRow}>
                  <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      Size {item.size} | {item.condition}
                    </Text>
                    <Text style={styles.itemPrice}>${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || '0').toFixed(2)}</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => updateQuantity(id, quantity - 1)}
                    >
                      <Icon name="remove" size={16} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => updateQuantity(id, quantity + 1)}
                    >
                      <Icon name="add" size={16} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeItem(id)}
                    >
                      <Icon name="trash-outline" size={16} color="#F54B3D" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {items.length > 0 ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              const parent = (navigation as any).getParent?.();
              if (parent?.reset) {
                parent.reset({
                  index: 0,
                  routes: [
                    { name: "Main", params: { screen: "Home", params: { screen: "HomeMain" } } },
                  ],
                });
              } else {
                parent?.navigate?.("Main", { screen: "Home", params: { screen: "HomeMain" } });
              }
            }}
          >
            <Text style={styles.secondaryText}>Continue browsing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              navigation.navigate("Checkout", {
                items,
                subtotal,
                shipping,
              })
            }
          >
            <Text style={styles.primaryText}>Proceed to checkout</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 16,
    rowGap: 16,
    paddingBottom: 140,
  },
  itemsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    padding: 16,
    columnGap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  itemImage: {
    width: 76,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#f4f4f4",
  },
  itemInfo: { flex: 1, rowGap: 4 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  itemMeta: { fontSize: 13, color: "#666" },
  itemPrice: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  quantityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
  },
  quantityText: { fontSize: 13, fontWeight: "600" },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    rowGap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, color: "#555" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
  },
  summaryTotal: { fontSize: 16, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    columnGap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: "#111" },
  primaryButton: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  emptySubtitle: { fontSize: 14, color: "#666", textAlign: "center" },
  exploreBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#111",
  },
  exploreText: { color: "#fff", fontWeight: "700" },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F54B3D',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
