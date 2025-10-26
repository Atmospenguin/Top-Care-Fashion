# 系统消息分析：买卖方不同视角

## 📋 Mock 数据分析

### 🛒 买家视角 (seller111 - 当前用户是买家)

```javascript
// 买家看到的消息序列
[
  { id: "card0", type: "orderCard", order: o },
  { 
    id: "sysPay", 
    type: "system", 
    text: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP.",
    sentByUser: true  // 黄色卡片
  },
  { id: "sys1", type: "system", text: "Seller has shipped your parcel.", time: "Sep 20, 2025 18:37" },
  { id: "sys2", type: "system", text: "Parcel is in transit.", time: "Sep 23, 2025 13:40" },
  { id: "sys3", type: "system", text: "Parcel arrived. Waiting for buyer to confirm received.", time: "Sep 24, 2025 08:00" },
  { id: "sys4", type: "system", text: "Order confirmed received. Transaction completed.", time: "Sep 25, 2025 12:50" },
  { id: "cta1", type: "reviewCta", text: "How was your experience? Leave a review to help others discover great items.", orderId: o.id }
]
```

### 🏪 卖家视角 (buyer002 - 当前用户是卖家)

```javascript
// 卖家看到的消息序列
[
  { id: "card0", type: "orderCard", order: o },
  {
    id: "cardPay",
    type: "system",
    text: "buyer002 has paid for the order.\nPlease prepare the package and ship soon.",
    sentByUser: false,  // 灰色卡片
    avatar: o.buyer?.avatar
  },
  { id: "sys1", type: "system", text: "Seller has shipped your parcel.", time: "Sep 29, 2025 10:15" },
  { id: "sys2", type: "system", text: "Parcel is in transit.", time: "Oct 1, 2025 14:20" },
  { id: "sys3", type: "system", text: "Parcel arrived. Waiting for buyer to confirm received.", time: "Oct 3, 2025 09:30" },
  { id: "cta1", type: "reviewCta", text: "How was your experience? Leave a review to help others discover great items.", orderId: o.id }
]
```

## 🔍 关键发现

### 1. **付款消息** - 买卖方视角不同 ✅
- **买家视角**: "I've paid, waiting for you to ship\nPlease pack the item and ship to the address I provided on TOP." (黄色卡片)
- **卖家视角**: "buyer002 has paid for the order.\nPlease prepare the package and ship soon." (灰色卡片)

### 2. **发货消息** - 买卖方视角相同
- **买家视角**: "Seller has shipped your parcel."
- **卖家视角**: "Seller has shipped your parcel."

### 3. **运输中消息** - 买卖方视角相同
- **买家视角**: "Parcel is in transit."
- **卖家视角**: "Parcel is in transit."

### 4. **到达消息** - 买卖方视角相同
- **买家视角**: "Parcel arrived. Waiting for buyer to confirm received."
- **卖家视角**: "Parcel arrived. Waiting for buyer to confirm received."

### 5. **确认收货消息** - 只有买家视角
- **买家视角**: "Order confirmed received. Transaction completed."
- **卖家视角**: (没有显示，因为卖家不会确认收货)

## ❌ 当前实现的问题

### 问题 1: 所有系统消息对买卖方都是一样的
当前实现中，我直接发送固定的系统消息，没有考虑买卖方的不同视角。

### 问题 2: 缺少 "Parcel is in transit." 消息
当前实现中，我没有在 "Mark as Shipped" 后发送 "Parcel is in transit." 消息。

## ✅ 正确的实现方式

根据 mock 数据，系统消息应该：

1. **付款消息** - 已正确实现（买家黄色卡片，卖家灰色卡片）
2. **发货消息** - 对买卖方显示相同内容："Seller has shipped your parcel."
3. **运输中消息** - 对买卖方显示相同内容："Parcel is in transit."
4. **到达消息** - 对买卖方显示相同内容："Parcel arrived. Waiting for buyer to confirm received."
5. **确认收货消息** - 对买卖方显示相同内容："Order confirmed received. Transaction completed."
6. **取消消息** - 需要根据买卖方显示不同内容

## 📝 结论

从 mock 数据看，**除了付款消息外，其他系统消息对买卖方都是相同的**。

这意味着我当前的实现基本正确，只需要确保：
1. ✅ 付款消息对买卖方显示不同视角（已实现）
2. ✅ 其他系统消息对买卖方显示相同内容（已实现）
3. ❌ 取消消息需要根据买卖方显示不同内容（需要修正）

