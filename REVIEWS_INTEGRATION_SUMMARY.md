# 🎯 Reviews 功能集成总结

## ✅ 已完成的修复

### 1. **ReviewScreen 用户识别修复**
**文件**: `mobile/screens/main/MyTopStack/ReviewScreen.tsx`

**问题**：
- 原代码直接使用 `orderData.buyer_id` 作为当前用户ID
- 这会导致买家评论时身份识别错误

**修复**：
```typescript
// ❌ 错误代码
const currentUserId = orderData.buyer_id;

// ✅ 修复后
const { user } = useAuth();
const currentUserId = user.id;
const revieweeData = orderData.buyer_id === currentUserId ? orderData.seller : orderData.buyer;
```

### 2. **API 路由参数修复**
**文件**: `web/src/app/api/orders/[id]/reviews/route.ts`

**问题**：
- Next.js 15 中 params 是 Promise 类型

**修复**：
```typescript
// ❌ 旧代码
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
)

// ✅ 新代码
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const orderId = parseInt(resolvedParams.id);
}
```

## 📍 可以评论的 Screen

### 1. **OrderDetailScreen (卖家的 Sold 订单)**
**位置**: `mobile/screens/main/MyTopStack/OrderDetailScreen.tsx`
- 当订单状态是 COMPLETED 时
- 如果还没有互评完成，显示 "Leave Feedback" 按钮
- 导航到 Review screen

### 2. **ChatScreen (买家)**
**位置**: `mobile/screens/main/InboxStack/ChatScreen.tsx`
- 在聊天中收到 "Order Marked as Received" 消息后
- 显示 "Leave Review" CTA 按钮
- 导航到 Review screen

### 3. **PurchasesTab (买家的 Purchases)**
**位置**: `mobile/screens/main/MyTopStack/PurchasesTab.tsx`
- 点击已完成的订单
- 进入 OrderDetailScreen (买家视角)
- 从那里可以导航到 Review screen

## 🔧 Reviews Service

**文件**: `mobile/src/services/reviewsService.ts`

```typescript
class ReviewsService {
  // 获取订单的评论
  async getOrderReviews(orderId: number): Promise<Review[]>

  // 创建评论
  async createReview(orderId: number, reviewData: CreateReviewRequest): Promise<Review>
}
```

**API 端点**:
- `GET /api/orders/{id}/reviews` - 获取订单的所有评论
- `POST /api/orders/{id}/reviews` - 创建新评论

## 📊 Reviews 数据流

```
Order Status = COMPLETED
    ↓
用户点击 "Leave Review"
    ↓
导航到 ReviewScreen
    ↓
ReviewScreen 加载订单数据
    ↓
用户输入评分和评论
    ↓
调用 reviewsService.createReview()
    ↓
POST /api/orders/{id}/reviews
    ↓
创建 review 记录到数据库
    ↓
如果双方都评论了，订单状态变为 REVIEWED
    ↓
更新被评论用户的平均评分
    ↓
创建通知给被评论的用户
    ↓
返回成功
```

## 🎯 评论逻辑

1. **买家评论卖家**: 
   - `reviewer_id` = 买家的 user ID
   - `reviewee_id` = 卖家的 user ID

2. **卖家评论买家**:
   - `reviewer_id` = 卖家的 user ID
   - `reviewee_id` = 买家的 user ID

3. **互评完成**: 
   - 当订单有 >= 2 个 review 时
   - 订单状态自动变为 'REVIEWED'

4. **评分更新**:
   - 计算被评论用户的所有 review 的平均值
   - 更新用户的 `average_rating` 和 `total_reviews`

## 🔔 通知功能

创建 review 时会自动创建通知：
```typescript
await prisma.notifications.create({
  data: {
    user_id: revieweeId,
    type: 'REVIEW',
    title: `@${currentUser.username} left a review for your product`,
    message: `${listing.name} - ${rating} stars`,
    image_url: currentUser.avatar_url,
    listing_id: listing.id,
    related_user_id: currentUser.id,
  },
});
```

## ✅ 测试检查清单

- [ ] 从 OrderDetailScreen (卖家) 可以导航到 Review
- [ ] 从 ChatScreen (买家) 可以导航到 Review  
- [ ] 从 PurchasesTab (买家) 可以导航到 Review
- [ ] Review 可以成功提交
- [ ] 评论后会收到通知
- [ ] 双方的评分都会更新
- [ ] 互评完成后订单状态变为 REVIEWED

## 🐛 调试日志

ReviewScreen 已添加调试日志：
```typescript
console.log('🔍 Review Screen - Current user ID:', currentUserId);
console.log('🔍 Review Screen - Order buyer ID:', orderData.buyer_id);
console.log('🔍 Review Screen - Order seller ID:', orderData.seller_id);
console.log('🔍 Review Screen - Reviewee:', revieweeData);
console.log('🔍 Submitting review for order:', orderId);
console.log('🔍 Rating:', rating);
console.log('🔍 Comment:', review);
```

## 📝 注意事项

1. 用户必须登录才能评论
2. 只能评论已完成的订单
3. 每个订单每个用户只能评论一次
4. 必须有 rating，comment 是可选的



