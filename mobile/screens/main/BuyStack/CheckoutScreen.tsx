import React, { useMemo, useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert, Modal } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import PaymentSelector from "../../../components/PaymentSelector";
import type { BuyStackParamList } from "./index";
import {
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_SHIPPING_ADDRESS,
} from "../../../mocks/shop";
import { ordersService, paymentMethodsService, type PaymentMethod } from "../../../src/services";
import { messagesService } from "../../../src/services/messagesService";
import { useAuth } from "../../../contexts/AuthContext";

function getDeliveryEstimate(): string {
  const today = new Date();
  const delivery = new Date(today);
  delivery.setDate(delivery.getDate() + 3); // 🔥 新加坡3天内配送
  return delivery.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CheckoutScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BuyStackParamList>>();
  const {
    params: { items, subtotal, shipping, conversationId },
  } = useRoute<RouteProp<BuyStackParamList, "Checkout">>();
  const { user } = useAuth();

  // 🔥 状态管理 - 地址和付款方式
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_SHIPPING_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // 🔥 编辑状态管理
  const [editingField, setEditingField] = useState<'personal' | 'payment' | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  const deliveryEstimate = useMemo(() => getDeliveryEstimate(), []);

  // 🔥 从后端加载用户默认支付方式（如果存在）
  useEffect(() => {
    let mounted = true;
    const loadDefaultPayment = async () => {
      try {
        const def = await paymentMethodsService.getDefaultPaymentMethod();
        if (!mounted) return;
        if (def) {
          setSelectedPaymentMethodId(def.id);
          setPaymentMethod({
            label: def.label,
            brand: def.brand || 'Card',
            last4: def.last4 || '0000',
          });
        }
      } catch (err) {
        console.warn('Failed to load default payment method', err);
      }
    };

    loadDefaultPayment();
    return () => { mounted = false; };
  }, []);

  // 🔥 格式化地址函数
  const formatCurrentAddress = () => {
    const parts = [shippingAddress.line1];
    if (shippingAddress.line2) parts.push(shippingAddress.line2);
    parts.push(
      `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
    );
    parts.push(shippingAddress.country);
    return parts.join("\n");
  };

  // 🔥 编辑功能
  const handleEditField = (field: 'personal' | 'payment') => {
    setEditingField(field);
    // 初始化表单数据
    setEditForm({
      name: shippingAddress.name,
      phone: shippingAddress.phone,
      line1: shippingAddress.line1,
      line2: shippingAddress.line2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    });
  };

  const handleSaveEdit = () => {
    if (editingField === 'personal') {
      setShippingAddress({
        ...shippingAddress,
        name: editForm.name,
        phone: editForm.phone,
        line1: editForm.line1,
        line2: editForm.line2,
        city: editForm.city,
        state: editForm.state,
        postalCode: editForm.postalCode,
        country: editForm.country
      });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  // 🔥 创建真实订单
  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to place an order");
      return;
    }

    // 🔥 验证支付方式
    if (!selectedPaymentMethodId) {
      Alert.alert("Missing Payment Method", "Please select a payment method");
      return;
    }

    try {
      setIsCreatingOrder(true);
      
      // 🔥 获取完整的支付方式数据
      const methods = await paymentMethodsService.getPaymentMethods();
      const fullPaymentMethod = methods.find(m => m.id === selectedPaymentMethodId);
      
      if (!fullPaymentMethod) {
        Alert.alert("Error", "Selected payment method not found");
        return;
      }
      
      // 🔥 为每个商品创建订单
      const createdOrders = [];
      for (const bagItem of items) {
        console.log("🔍 Creating order for item:", bagItem.item.id);
        console.log("🔍 Item details:", {
          id: bagItem.item.id,
          title: bagItem.item.title,
          seller: bagItem.item.seller
        });
        
        const newOrder = await ordersService.createOrder({
          listing_id: parseInt(bagItem.item.id),
          buyer_name: shippingAddress.name,
          buyer_phone: shippingAddress.phone,
          shipping_address: `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
          payment_method: fullPaymentMethod.brand || 'Card',
          payment_method_id: fullPaymentMethod.id, // 🔥 使用后端支付方式 ID
          payment_details: {
            brand: fullPaymentMethod.brand,
            last4: fullPaymentMethod.last4,
            expiry: fullPaymentMethod.expiryMonth && fullPaymentMethod.expiryYear 
              ? `${String(fullPaymentMethod.expiryMonth).padStart(2, '0')}/${fullPaymentMethod.expiryYear}` 
              : 'N/A',
          }
        });
        
        console.log("✅ Order created successfully:", newOrder);
        createdOrders.push(newOrder);
      }
      
      // 🔥 订单创建成功，显示成功消息并返回上一页
      console.log("✅ Order created successfully:", createdOrders);
      
      // 🔥 使用第一个创建的订单信息
      const firstOrder = createdOrders[0];
      if (firstOrder && firstOrder.id) {
        // 🔥 立即发送 "I've paid" 系统消息
        const sendPaidMessage = async () => {
          try {
            if (conversationId) {
              console.log("📤 Sending SYSTEM message to conversation:", conversationId);
              await messagesService.sendMessage(conversationId, {
                content: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
                message_type: "SYSTEM"
              });
              console.log("✅ SYSTEM message sent successfully");
            } else {
              console.warn("❌ No conversationId when trying to send system message");
            }
          } catch (error) {
            console.error("❌ Failed to send SYSTEM message:", error);
          }
        };
        
        // 发送系统消息
        sendPaidMessage();
        
        Alert.alert(
          "Order Created", 
          "Your order has been placed successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                // 🔥 返回上一页
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert("Success", "Order created successfully!");
        navigation.goBack();
      }
      
    } catch (error) {
      console.error("❌ Error creating order:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack",
        error: error
      });
      Alert.alert(
        "Error", 
        error instanceof Error ? error.message : "Failed to create order. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Checkout" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleEditField('personal')}>
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          
          {/* 显示姓名 */}
          <Text style={styles.addressName}>{shippingAddress.name}</Text>
          
          {/* 显示电话 */}
          <Text style={styles.addressPhone}>{shippingAddress.phone}</Text>
          
          {/* 显示地址 */}
          <Text style={styles.addressBody}>{formatCurrentAddress()}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => handleEditField('payment')}>
              <Text style={styles.sectionAction}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentRow}>
            <Icon name="card" size={20} color="#111" />
            <Text style={styles.paymentText}>
              {paymentMethod.brand} ending in {paymentMethod.last4}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.summaryItems}>{items.length} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Delivery</Text>
            <Text style={styles.summaryValue}>{deliveryEstimate}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryButton, isCreatingOrder && styles.primaryButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isCreatingOrder}
        >
          <Text style={styles.primaryText}>
            {isCreatingOrder ? "Creating Order..." : "Place order"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 编辑模态框 */}
      <Modal
        visible={editingField !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelEdit}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingField === 'personal' && 'Edit Personal Information'}
              {editingField === 'payment' && 'Edit Payment'}
            </Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {editingField === 'personal' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Enter your full name"
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.line1}
                  onChangeText={(text) => setEditForm({ ...editForm, line1: text })}
                  placeholder="Enter your street address"
                />

                <Text style={styles.inputLabel}>Apartment, suite, etc. (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.line2}
                  onChangeText={(text) => setEditForm({ ...editForm, line2: text })}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />

                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.city}
                  onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                  placeholder="City"
                />

                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.state}
                  onChangeText={(text) => setEditForm({ ...editForm, state: text })}
                  placeholder="State"
                />

                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.postalCode}
                  onChangeText={(text) => setEditForm({ ...editForm, postalCode: text })}
                  placeholder="Postal Code"
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.country}
                  onChangeText={(text) => setEditForm({ ...editForm, country: text })}
                  placeholder="Country"
                />
              </View>
            )}

            {editingField === 'payment' && (
              <PaymentSelector
                selectedPaymentMethodId={selectedPaymentMethodId}
                onSelect={(method) => {
                  setSelectedPaymentMethodId(method?.id ?? null);
                  if (method) {
                    setPaymentMethod({
                      label: method.label,
                      brand: method.brand || 'Card',
                      last4: method.last4 || '0000',
                    });
                  }
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: {
    padding: 16,
    rowGap: 16,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eee",
    rowGap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A7BF4",
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
  },
  addressPhone: {
    fontSize: 13,
    color: "#666",
  },
  addressBody: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryItems: {
    fontSize: 13,
    color: "#666",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  summaryTotal: { fontSize: 16, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#bbb",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // 🔥 编辑相关样式
  editableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // 🔥 模态框样式
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  modalCancel: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSave: {
    fontSize: 16,
    color: "#2A7BF4",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  // 🔥 地址编辑布局样式
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  addressColumn: {
    flex: 1,
    marginRight: 8,
  },
  // 🔥 支付选项样式
  paymentOptions: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  paymentOptionSelected: {
    borderColor: "#2A7BF4",
    backgroundColor: "#E6F0FF",
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  paymentNote: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  paymentNoteText: {
    fontSize: 12,
    color: "#856404",
    lineHeight: 16,
  },
});