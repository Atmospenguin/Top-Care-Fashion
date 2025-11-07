# 🔧 Bug Fix - Notification Avatar Display Logic (Frontend)

## 问题描述
通知列表中，订单和评论通知（如 Jae 和 Cindy 购买 UGG）显示的是**商品图片**（UGG boots），而不是**用户头像**（Jae 和 Cindy 的头像）。

## 问题截图
```
@Cindy liked your listing        → 显示 UGG 图片 ❌ (应该显示 Cindy 头像)
UGG boots

New order received               → 显示 Cindy 头像 ❌ (应该显示 Cindy 头像，但显示的是 UGG)
@Cindy placed an order...

@Jae left a review for you       → 显示 UGG 图片 ❌ (应该显示 Jae 头像)
UGG boots - 4 stars
```

## 问题根源

### 前端显示逻辑错误
**文件**: `mobile/screens/main/InboxStack/NotificationScreen.tsx` Line 311-319

**修复前的错误逻辑**:
```typescript
// ✅ 优先显示商品图片，其次显示用户头像，最后显示默认头像
let imageSource;
if (item.listingImage && item.listingImage !== '') {
  imageSource = { uri: item.listingImage };  // ❌ 总是优先显示商品图片
} else if (item.image && item.image !== '') {
  imageSource = { uri: item.image };
} else {
  imageSource = ASSETS.avatars.default;
}
```

**问题**：
- 不管通知类型是什么，都**优先显示商品图片 (listingImage)**
- 导致订单、评论、关注等需要显示用户头像的通知也显示了商品图片
- `image` 字段（用户头像）被忽略了

### 后端数据结构
后端 API 返回的通知数据包含：
```typescript
{
  id: "123",
  type: "order",  // 或 "review", "like", "follow"
  title: "New order received",
  message: "@Cindy placed an order...",
  image: "https://.../cindy_avatar.jpg",  // 🔥 用户头像
  listingImage: "https://.../ugg_boots.jpg",  // 🔥 商品图片
  // ...
}
```

- **`image`**: 用户头像（来自 `related_user.avatar_url`）
- **`listingImage`**: 商品图片（来自 `listing.image_url`）

## 修复方案

### 根据通知类型选择显示内容

**修复后的正确逻辑**:
```typescript
// 🔥 根据通知类型决定显示什么图片：
// ORDER/REVIEW/FOLLOW → 显示用户头像（image 字段）
// LIKE → 可以显示商品图片（listingImage）
let imageSource;

if (item.type === 'order' || item.type === 'review' || item.type === 'follow') {
  // 订单、评论、关注通知 → 显示用户头像
  if (item.image && item.image !== '') {
    imageSource = { uri: item.image };
  } else {
    imageSource = ASSETS.avatars.default;
  }
} else if (item.type === 'like') {
  // 点赞通知 → 优先显示商品图片，回退到用户头像
  if (item.listingImage && item.listingImage !== '') {
    imageSource = { uri: item.listingImage };
  } else if (item.image && item.image !== '') {
    imageSource = { uri: item.image };
  } else {
    imageSource = ASSETS.avatars.default;
  }
} else {
  // 其他通知 → 优先用户头像，回退到商品图片
  if (item.image && item.image !== '') {
    imageSource = { uri: item.image };
  } else if (item.listingImage && item.listingImage !== '') {
    imageSource = { uri: item.listingImage };
  } else {
    imageSource = ASSETS.avatars.default;
  }
}
```

### 修改的文件
1. ✅ `mobile/screens/main/InboxStack/NotificationScreen.tsx` - 通知显示逻辑

## 修复效果

### 修复前 ❌
```
@Cindy liked your listing        → 🖼️ UGG 图片
@Cindy placed an order           → 🖼️ UGG 图片
@Jae left a review for you       → 🖼️ UGG 图片
@Jae liked your listing          → 🖼️ UGG 图片
```

### 修复后 ✅
```
@Cindy liked your listing        → 🖼️ UGG 图片 (点赞通知显示商品) ✅
@Cindy placed an order           → 👤 Cindy 头像 (订单通知显示用户) ✅
@Jae left a review for you       → 👤 Jae 头像 (评论通知显示用户) ✅
@Jae liked your listing          → 🖼️ UGG 图片 (点赞通知显示商品) ✅
```

## 通知类型对应关系

| 通知类型 | 显示内容 | 字段 | 原因 |
|---------|---------|------|------|
| **ORDER** (订单) | 👤 用户头像 | `image` | 需要知道是谁下单/发货/确认 |
| **REVIEW** (评论) | 👤 用户头像 | `image` | 需要知道是谁评论 |
| **FOLLOW** (关注) | 👤 用户头像 | `image` | 需要知道是谁关注 |
| **LIKE** (点赞) | 🖼️ 商品图片 | `listingImage` | 重点是哪个商品被点赞 |
| **SYSTEM** (系统) | 👤 用户头像 | `image` (回退 `listingImage`) | 根据具体情况 |

## 技术细节

### 为什么点赞通知显示商品图片？
点赞通知的重点是**哪个商品被点赞**，而不是谁点赞的（用户名已经在标题中显示）。显示商品图片可以让用户快速识别被点赞的商品。

### 为什么订单/评论通知显示用户头像？
订单和评论通知的重点是**谁执行的操作**（下单、发货、评论），显示用户头像可以帮助用户快速识别交易对方。

### 数据流程
```
1. 后端创建通知 (web/src/app/api/orders/[id]/route.ts)
   ↓
   {
     type: "ORDER",
     image_url: buyer_avatar,
     related_user_id: buyer_id,
     listing_id: listing_id
   }

2. 后端格式化返回 (web/src/app/api/notifications/route.ts)
   ↓
   {
     type: "order",
     image: related_user.avatar_url || image_url,  // 用户头像
     listingImage: listing.image_url               // 商品图片
   }

3. 前端根据类型显示 (mobile/screens/.../NotificationScreen.tsx)
   ↓
   if (type === 'order') {
     显示 image (用户头像) ✅
   } else if (type === 'like') {
     显示 listingImage (商品图片) ✅
   }
```

## 相关修复
这个修复配合之前的后端修复（`web/BUGFIX_NOTIFICATION_AVATAR.md`）：
1. ✅ 后端：优先使用 `related_user.avatar_url`（动态数据）
2. ✅ 前端：根据通知类型正确显示 `image` 或 `listingImage`

## 测试验证

### 测试场景 1: 同一商品多个买家
1. Jae 购买 UGG → 卖家通知显示 Jae 头像 ✅
2. Cindy 购买 UGG → 卖家通知显示 Cindy 头像 ✅
3. 两个通知的头像应该不同 ✅

### 测试场景 2: 不同通知类型
1. Cindy 点赞 UGG → 显示 UGG 商品图片 ✅
2. Cindy 购买 UGG → 显示 Cindy 头像 ✅
3. Cindy 评论订单 → 显示 Cindy 头像 ✅
4. Cindy 关注用户 → 显示 Cindy 头像 ✅

### 测试场景 3: 用户更新头像
1. Jae 购买商品（创建通知）
2. Jae 更新头像
3. 通知应该显示 Jae 的新头像 ✅

## 总结
通过根据通知类型（`type` 字段）来决定显示用户头像还是商品图片，成功修复了订单和评论通知错误显示商品图片的问题。现在通知列表的显示逻辑更加合理，用户体验得到提升。✅

