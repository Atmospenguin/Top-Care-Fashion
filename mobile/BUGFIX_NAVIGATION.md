# 🔧 Navigation Bug Fix - ChatScreen Buy Now Button

## 问题描述
从搜索 → 商品详情 → 点击 Message Seller → ChatScreen，然后在 ChatScreen 的订单卡片中点击 "Buy Now" 按钮时，导航失败并提示 "navigation 找不到"。

## 问题根源
在 ChatScreen（属于 InboxStack）中的 `handleBuyNow` 函数使用 `navigation.getParent()` 只能获取到一层父导航器，无法获取到根级别的导航器来访问 BuyStack。

### 原代码：
```typescript
const rootNavigation = (navigation as any).getParent?.();
if (rootNavigation) {
  rootNavigation.navigate("Buy", {
    screen: "Checkout",
    params: { ... }
  });
}
```

## 解决方案
使用循环遍历所有父级导航器，直到找到根导航器：

### 修复后代码：
```typescript
// 获取根导航器（Main Tab Navigator）
let rootNavigation: any = navigation;
while (rootNavigation.getParent && typeof rootNavigation.getParent === 'function') {
  const parent = rootNavigation.getParent();
  if (!parent) break;
  rootNavigation = parent;
}

if (rootNavigation) {
  try {
    rootNavigation.navigate("Buy", {
      screen: "Checkout",
      params: {
        items: [singleItem],
        subtotal: o.product.price,
        shipping: o.product.shippingFee || 0,
        conversationId: conversationId
      }
    });
  } catch (error) {
    console.error("❌ Navigation error:", error);
    Alert.alert("Error", "Unable to navigate to checkout. Please try again.");
  }
}
```

## 导航结构
```
RootNavigator
  ├── Main (TabNavigator)
  │   ├── Home
  │   ├── Discover
  │   ├── Buy (Stack)
  │   │   ├── ListingDetail
  │   │   └── Checkout ← 目标
  │   ├── Inbox (Stack)
  │   │   └── Chat ← 当前位置
  │   └── My TOP
  └── Premium (Stack)
```

## 测试步骤
1. 打开 APP
2. 搜索 "dress"
3. 点击任意商品进入商品详情页
4. 点击 "Message Seller" 按钮
5. 进入聊天界面后，点击订单卡片中的 "Buy Now" 按钮
6. ✅ 应该成功导航到 CheckoutScreen

## 相关文件
- `mobile/screens/main/InboxStack/ChatScreen.tsx` (Line 901-950)

## 影响范围
- 修复了从 ChatScreen 点击 Buy Now 导航失败的问题
- 不影响其他导航路径（ListingDetailScreen, BagScreen 等都在 BuyStack 内，不受影响）

## 额外改进
- 添加了 try-catch 错误处理
- 添加了详细的调试日志
- 添加了用户友好的错误提示

