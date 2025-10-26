# 📸 Review Photos 功能实现完成

## ✅ 已完成的功能

### 1. **ReviewScreen 图片上传功能**
**文件**: `mobile/screens/main/MyTopStack/ReviewScreen.tsx`

**新增功能**：
- ✅ 最多上传 9 张图片
- ✅ 支持图片选择和预览
- ✅ 支持删除已选图片
- ✅ 自动上传到 Supabase Storage
- ✅ 提交评论时包含图片 URL

**新增状态**：
```typescript
const [photos, setPhotos] = useState<{ id: string; uri: string; uploadedUrl?: string }[]>([]);
```

**新增函数**：
1. `handleAddPhoto()` - 选择图片（支持多选）
2. `handleRemovePhoto(id)` - 删除图片
3. `uploadAllPhotos()` - 上传所有图片到 Supabase

### 2. **API 支持图片存储**
**文件**: `web/src/app/api/orders/[id]/reviews/route.ts`

**修改**：
- 接收 `images` 参数
- 将图片数组存储为 JSON 格式

```typescript
const { rating, comment, images } = body;

const review = await prisma.reviews.create({
  data: {
    // ... 其他字段
    images: images ? JSON.stringify(images) : null
  },
});
```

### 3. **Database Schema 更新**
**文件**: `web/prisma/schema.prisma`

**新增字段**：
```prisma
model reviews {
  id             Int          @id @default(autoincrement())
  order_id       Int
  reviewer_id    Int
  reviewee_id    Int
  rating         Int
  comment        String?      // 改为可选
  images         Json?        // 🔥 新增：存储图片URL数组
  reviewer_type  ReviewerType
  created_at     DateTime     @default(now()) @db.Timestamptz(6)
  // ... relations
}
```

### 4. **Service 接口更新**
**文件**: `mobile/src/services/reviewsService.ts`

**新增字段**：
```typescript
export interface CreateReviewRequest {
  rating: number;
  comment?: string;
  images?: string[];  // 🔥 新增：图片URL数组
}
```

## 🎨 UI/UX 改进

### 图片选择界面
- 显示已选中的图片缩略图
- 每个图片右上角有删除按钮
- 水平滚动查看所有图片
- 最多 9 张图片提示
- 添加图片按钮（相机图标）

### 交互流程
1. 点击 "Add Photo" → 打开相册
2. 选择多张图片（最多 9 张）
3. 图片自动显示在界面上
4. 可以点击删除按钮移除图片
5. 提交评论时自动上传所有图片

## 📊 数据流

```
用户选择图片
    ↓
使用 ImagePicker 选择
    ↓
保存到本地状态 photos[]
    ↓
用户提交评论
    ↓
调用 uploadAllPhotos()
    ↓
遍历 photos，调用 listingsService.uploadListingImage()
    ↓
上传到 Supabase Storage
    ↓
获取远程 URL
    ↓
调用 API: POST /api/orders/{id}/reviews
    ↓
保存 images (JSON数组) 到数据库
    ↓
完成！
```

## 🔧 技术实现

### 图片上传
使用现有的 `listingsService.uploadListingImage()` 方法：
- 自动压缩图片（quality: 0.8）
- 自动转换格式
- 上传到 Supabase Storage
- 返回公开访问的 URL

### 图片存储
- 在数据库中存储为 JSON 格式
- 示例：`["url1", "url2", "url3"]`
- 便于查询和解析

## ✅ 测试建议

1. **选择图片**
   - 点击相机图标
   - 选择 1 张图片 → 应该显示缩略图
   - 继续添加图片（最多 9 张）

2. **删除图片**
   - 点击图片右上角的 × 按钮
   - 图片应该被移除

3. **提交评论**
   - 填写评分和评论
   - 添加图片
   - 点击 "Send" 按钮
   - 检查是否能成功提交

4. **查看评论**
   - 在订单详情或聊天中查看评论
   - 确认图片显示正确

## 📝 注意事项

1. **图片限制**: 最多 9 张
2. **格式支持**: JPG/PNG
3. **压缩**: 自动压缩（quality: 0.8）以节省存储空间
4. **可选**: 图片是可选的，可以不添加图片只提交文字评论

## 🎯 完成状态

- ✅ ReviewScreen 图片上传功能
- ✅ API 支持图片存储
- ✅ Database schema 更新
- ✅ Prisma Client 重新生成
- ✅ UI/UX 改进
- ✅ 删除图片功能
- ✅ 图片上传到 Supabase

现在可以测试完整的评论+图片功能了！


