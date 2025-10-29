# 🔍 购买流程 ID 传递调试指南

## 关键原则
1. **listing_id** = 商品在数据库中的 ID（唯一标识）
2. **listing_id** 必须从第一个环节传递到最后一个环节
3. 所有地方都要使用 **listing_id**，不要混用其他 ID

## ID 传递链路

### 1. 后端 API (`/api/messages/[conversationId]`)
- **位置**: `web/src/app/api/messages/[conversationId]/route.ts` 第304行
- **返回**: orderCard.order.listing_id
- **状态**: ✅ 已包含 listing_id

### 2. ChatScreen - loadConversationData
- **位置**: `mobile/screens/main/InboxStack/ChatScreen.tsx` 第986行
- **映射**: 保留 API 返回的 listing_id
- **状态**: ✅ 已保留

### 3. ChatScreen - handleBuyNow
- **位置**: `mobile/screens/main/InboxStack/ChatScreen.tsx` 第1268-1284行
- **获取**: 从 order.listing_id 或 conversation.listing.id 获取
- **传递**: 通过 singleItem.item.listing_id 传递
- **状态**: ✅ 已实现，但有容错逻辑

### 4. CheckoutScreen - handlePlaceOrder
- **位置**: `mobile/screens/main/BuyStack/CheckoutScreen.tsx` 第141行
- **使用**: `const listingId = bagItem.item.listing_id || parseInt(bagItem.item.id)`
- **问题**: ⚠️ 如果 listing_id 未传递，会降级使用 id，这可能不正确
- **修复**: 强制要求 listing_id 存在

### 5. OrderDetailScreen - 从 PurchasesTab/SoldTab 导航
- **位置**: `mobile/screens/main/MyTopStack/PurchasesTab.tsx` 第276行
- **获取**: 使用最新的 conversation
- **状态**: ✅ 已修复使用最新 conversation

## 潜在问题

### 问题 1: CheckoutScreen 容错逻辑太弱
- **现状**: 如果 listing_id 不存在，会降级使用 id
- **风险**: id 可能不是 listing_id（例如订单 ID）
- **修复**: 添加验证，如果 listing_id 不存在则报错

### 问题 2: OrderDetailScreen 可能用错 conversationId
- **现状**: 可能使用旧的 conversation（如 admin 的对话）
- **修复**: 使用最新的 conversation，或从订单数据获取

## 建议修复

### 1. CheckoutScreen - 强制验证 listing_id
```typescript
const listingId = bagItem.item.listing_id;
if (!listingId) {
  console.error("❌ Missing listing_id in item:", bagItem.item);
  Alert.alert("Error", "Cannot create order: missing listing information");
  continue; // Skip this item
}
```

### 2. OrderDetailScreen - 验证 conversation 是否正确
```typescript
// 验证 conversation 的用户是否匹配订单
const conversationUserId = conversation.initiator_id; // 或 participant_id
const orderBuyerId = order.buyer_id;
const orderSellerId = order.seller_id;

if (conversationUserId !== orderBuyerId && conversationUserId !== orderSellerId) {
  console.warn("⚠️ Conversation user doesn't match order participants");
  // 使用订单数据中的最新 conversation
}
```

