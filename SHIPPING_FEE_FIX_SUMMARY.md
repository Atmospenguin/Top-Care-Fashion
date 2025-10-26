# 🔧 Shipping Fee 修复总结

## ✅ 问题发现

用户报告：当 listing 显示 "Buyer pays $3 (within 10km)" 时，添加到购物车后 shipping fee 显示为 $0。

### 🔍 根本原因

**问题**：在 `SellScreen.tsx` 创建 listing 时，对于预定义的运费选项（如 "Buyer pays – $3 (within 10km)"），系统没有自动提取并设置 `shipping_fee` 字段。

**原代码**：
```typescript
shippingFee: shippingFee ? parseFloat(shippingFee) : undefined,
```

这只在 "Buyer pays – fixed fee" 选项时，用户手动输入 `shippingFee` 才会设置。对于预定义选项，`shippingFee` 始终是 `undefined`。

## 🛠️ 修复方案

### 1. 修复 `SellScreen.tsx` - 自动计算运费

**位置**：`mobile/screens/main/SellStack/SellScreen.tsx`

在创建 listing 之前，自动从 `shippingOption` 提取运费：

```typescript
// 🔥 自动提取预定义运费选项的费用
let calculatedShippingFee: number | undefined;
if (shippingOption.includes("Buyer pays – $3")) {
  calculatedShippingFee = 3;
} else if (shippingOption.includes("Buyer pays – $5")) {
  calculatedShippingFee = 5;
} else if (shippingOption === "Buyer pays – fixed fee" && shippingFee) {
  calculatedShippingFee = parseFloat(shippingFee);
} else if (shippingOption === "Free shipping" || shippingOption === "Meet-up") {
  calculatedShippingFee = 0;
}

const listingData: CreateListingRequest = {
  // ... 其他字段
  shippingOption,
  shippingFee: calculatedShippingFee,  // 🔥 使用计算出的运费
  location: shippingOption === "Meet-up" ? location.trim() : undefined,
};
```

### 2. 修复 `EditListingScreen.tsx` - 同样逻辑

**位置**：`mobile/screens/main/MyTopStack/EditListingScreen.tsx`

应用相同的自动计算逻辑。

### 3. 更新现有的数据库数据

**位置**：`web/fix_shipping_fee.sql`

运行 SQL 脚本修复数据库中已存在的数据：

```sql
-- 修复 "Buyer pays – $3 (within 10km)"
UPDATE listings
SET shipping_fee = 3
WHERE shipping_option = 'Buyer pays – $3 (within 10km)'
  AND (shipping_fee IS NULL OR shipping_fee = 0);

-- 修复 "Buyer pays – $5 (island-wide)"
UPDATE listings
SET shipping_fee = 5
WHERE shipping_option = 'Buyer pays – $5 (island-wide)'
  AND (shipping_fee IS NULL OR shipping_fee = 0);

-- 修复 "Free shipping" 和 "Meet-up"
UPDATE listings
SET shipping_fee = 0
WHERE shipping_option IN ('Free shipping', 'Meet-up')
  AND shipping_fee IS NOT NULL
  AND shipping_fee != 0;
```

## 📊 Shipping Option 映射表

| Shipping Option | Shipping Fee |
|----------------|--------------|
| Free shipping | 0 |
| Buyer pays – $3 (within 10km) | 3 |
| Buyer pays – $5 (island-wide) | 5 |
| Buyer pays – fixed fee | 用户输入 |
| Meet-up | 0 |

## 🧪 如何验证

### 1. 创建新 Listing 测试

1. 打开 Sell 页面
2. 填写商品信息
3. 选择 "Buyer pays – $3 (within 10km)"
4. 发布 listing
5. 检查数据库：`shipping_fee` 应该是 `3`

### 2. 查看购物车

1. 打开商品详情页
2. 添加商品到购物车
3. 查看 My Bag
4. **应该显示 Shipping: $3.00**

### 3. 更新现有 Listing

1. 打开 "Edit Listing" 页面
2. 选择不同的 shipping option（例如从 "Free shipping" 改为 "Buyer pays – $3 (within 10km)"）
3. 保存
4. 检查：`shipping_fee` 应该是 `3`

## ✅ 修复完成

- ✅ SellScreen 自动计算 shipping fee
- ✅ EditListingScreen 自动计算 shipping fee  
- ✅ SQL 脚本可用于修复现有数据
- ✅ BagScreen 已使用真实的 shipping fee
- ✅ Checkout 已使用真实的 shipping fee

## 📝 下一步

1. 运行 SQL 脚本修复现有数据
2. 测试创建新的 listing
3. 测试添加到购物车和结账流程



