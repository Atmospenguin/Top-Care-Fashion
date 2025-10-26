# 🛒 My Bag 和 Checkout 的 Shipping Fee 修复

## ✅ 问题发现

用户发现 My Bag Screen 和 Checkout 的 shipping fee 不是真实的，使用了硬编码的 $8。

### 🔍 问题分析

1. **BagScreen.tsx** - 第 69 行使用了硬编码的 shipping fee：
   ```typescript
   const shippingFee = items.length > 0 ? 8 : 0; // ❌ 硬编码
   ```

2. **Cart API** - `/api/cart` 端点没有返回 `shipping_fee` 字段

3. **CartItem 接口** - Mobile 端的 CartItem 接口缺少 `shippingFee` 字段

## 🛠️ 修复方案

### 1. 更新 Cart API - 添加 shipping fee 字段

**文件**: `web/src/app/api/cart/route.ts`

在 GET 方法的返回数据中添加 `shippingOption`、`shippingFee` 和 `location` 字段：

```typescript
return {
  id: cartItem.id,
  quantity: cartItem.quantity,
  created_at: cartItem.created_at,
  updated_at: cartItem.updated_at,
  item: {
    id: listing.id.toString(),
    title: listing.name,
    // ... 其他字段
    shippingOption: listing.shipping_option || null,
    shippingFee: listing.shipping_fee ? Number(listing.shipping_fee) : null,
    location: listing.location || null,
    seller: {
      // ... seller 字段
    },
  },
};
```

### 2. 更新 CartItem 接口

**文件**: `mobile/src/services/cartService.ts`

在 CartItem 接口的 item 对象中添加新的字段：

```typescript
export interface CartItem {
  id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  item: {
    id: string;
    title: string;
    // ... 其他字段
    shippingOption?: string | null;
    shippingFee?: number | null;
    location?: string | null;
    seller: {
      // ... seller 字段
    };
  };
}
```

### 3. 修改 BagScreen 使用真实的 shipping fee

**文件**: `mobile/screens/main/BuyStack/BagScreen.tsx`

替换硬编码的 shipping fee 为累加所有商品的真实运费：

```typescript
const { subtotal, shipping, total } = useMemo(() => {
  const computedSubtotal = items.reduce(
    (sum, current) => {
      const price = typeof current.item.price === 'number' 
        ? current.item.price 
        : parseFloat(current.item.price || '0');
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
```

## 📊 数据流

```
Supabase Database
    ↓ listings.shipping_fee 字段
    ↓ Cart API: GET /api/cart
    ↓ 返回每个商品的 shippingFee
    ↓ Mobile App
    ↓ CartService.getCartItems()
    ↓ BagScreen: 累加所有商品的 shipping fee
    ↓ CheckoutScreen: 使用 BagScreen 传递的 shipping fee
```

## 🎯 功能说明

### Shipping Fee 计算逻辑

- **有运费的商品**: 累加每个商品的 `shippingFee` 值
- **免费配送的商品**: 运费为 $0
- **Meet-up 商品**: 运费为 $0（卖家选择面交）
- **Seller pays**: 运费为 $0

### 示例

如果有两个商品在购物车：
- 商品 A: price=$50, shippingFee=$5
- 商品 B: price=$30, shippingFee=null（seller pays）

计算结果：
- Subtotal: $50 + $30 = $80
- Shipping: $5 + $0 = $5
- Total: $85

## 🧪 测试建议

1. **测试 My Bag Screen**
   - 添加一个有运费的商品（例如 shippingFee=$5）
   - 检查 shipping fee 是否显示 $5.00
   - 添加一个免费配送的商品
   - 检查 shipping 是否累加为 $5.00

2. **测试 Checkout Screen**
   - 从 My Bag 进入 Checkout
   - 检查 shipping fee 是否与 My Bag 一致
   - 检查 total 计算是否正确

3. **测试不同商品类型**
   - Seller pays shipping
   - Buyer pays fixed fee
   - Meet-up
   - Free shipping

## ✅ 修复完成

- ✅ Cart API 返回真实的 shipping fee 数据
- ✅ CartItem 接口包含 shipping fee 字段
- ✅ BagScreen 使用累加的真实运费
- ✅ CheckoutScreen 自动使用正确的运费（从 BagScreen 传递）

## 📝 注意事项

- CheckoutScreen 直接从 BagScreen 接收 `shipping` 参数，无需额外修改
- 如果购物车为空，shipping fee 为 $0
- 每个商品的运费会被累加（适用于多卖家场景）



