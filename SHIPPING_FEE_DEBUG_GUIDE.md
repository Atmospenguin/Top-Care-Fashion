# 🔍 Shipping Fee Debug Guide

## 问题

用户反馈商品页面显示 "buyers pay $3 (within 10km)"，但添加到购物车（bag）后显示 shipping fee 为 $0。

## 已完成的修复

1. ✅ Cart API 返回 `shippingFee` 字段
2. ✅ CartItem 接口包含 `shippingFee` 字段
3. ✅ BagScreen 累加所有商品的真实 shipping fee
4. ✅ ListingDetailScreen 添加了详细的调试日志

## 调试步骤

### 1. 查看 Console 日志

在 Expo Go 中打开商品详情页，打开 Console，你会看到以下调试日志：

```
🔍 Debug - Original item: {...}
🔍 Debug - Original item.shippingFee: ...
🔍 Debug - Original item.shippingOption: ...
🔍 Debug - Original item.location: ...
```

**检查点：**
- 如果 `shippingFee` 是 `null`、`undefined` 或 `0`，说明从 API 获取的数据就没有运费
- 如果 `shippingFee` 是 `3`，但 `shippingFee` 计算函数返回 `0`，说明逻辑有问题

### 2. 可能的原因

#### 原因 1: API 没有返回 shippingFee

检查 `/api/listings` 端点的返回数据是否包含 `shippingFee` 字段。

**解决方法：**
- 确保数据库中有 `shipping_fee` 字段
- 确保 API 查询时包含 `shipping_fee` 字段

#### 原因 2: 字段名称不匹配

检查 mobile 端使用的字段名是否与 API 返回的字段名匹配。

**检查字段：**
- `shippingFee` (camelCase) vs `shipping_fee` (snake_case)
- `shippingOption` (camelCase) vs `shipping_option` (snake_case)

#### 原因 3: 数据类型问题

检查 API 返回的 shippingFee 是数字还是字符串。

**解决方法：**
```typescript
const fee = typeof safeItem.shippingFee === 'number' 
  ? safeItem.shippingFee 
  : Number(safeItem.shippingFee);
```

### 3. 测试添加购物车

点击 "Add to Bag" 按钮后，检查 Console：

```
🔍 Debug - safeItem?.shippingFee: ...
🔍 Debug - safeItem?.shippingOption: ...
```

然后进入 My Bag 页面，检查 shipping fee 是否正确显示。

### 4. 检查购物车数据

在 My Bag 页面，打开 Console，查看 cart items 数据：

```typescript
// 在 BagScreen 中添加临时调试
console.log('📦 Cart items:', items);
console.log('📦 First item shippingFee:', items[0]?.item?.shippingFee);
```

## 预期的日志输出

如果一切正常，你应该看到：

```
🔍 Debug - Original item.shippingFee: 3
🔍 Debug - Original item.shippingOption: "Buyers pay – fixed fee"
🔍 Debug - Original item.location: "within 10km"
✅ Using shipping fee: 3
```

如果显示为 0，你应该看到：

```
🔍 Debug - Original item.shippingFee: null
⚠️ Shipping fee is null or undefined, returning 0
```

## 下一步

根据调试日志的结果，我们可以：

1. 如果 API 返回了正确的 shippingFee，问题可能在数据传递过程中
2. 如果 API 没有返回 shippingFee，需要修改 API
3. 如果数据类型不匹配，需要添加类型转换

## 快速测试

1. 打开 Expo Go
2. 进入 Home Screen
3. 点击一个商品，进入 ListingDetailScreen
4. 查看 Console 日志
5. 点击 "Add to Bag"
6. 进入 My Bag 页面
7. 检查 shipping fee 是否显示正确的金额

**报告结果：**
- 在 ListingDetailScreen 的 Console 中，`shippingFee` 的值是多少？
- 在 My Bag 页面，显示的 shipping fee 是多少？
- 是否看到任何错误日志？



