# 图片上传 API 使用指南 (Image Upload API Usage Guide)

本指南说明如何使用 Top Care Fashion 应用的图片上传 API。  
(This guide explains how to use the Top Care Fashion app's image upload API.)

## 目录 (Table of Contents)

- [概述 (Overview)](#概述-overview)
- [认证 (Authentication)](#认证-authentication)
- [API 端点 (API Endpoints)](#api-端点-api-endpoints)
  - [商品图片上传 (Listing Image Upload)](#1-商品图片上传-listing-image-upload)
  - [头像上传 (FormData) (Avatar Upload - FormData)](#2-头像上传-formdata-avatar-upload-formdata)
  - [头像上传 (Base64) (Avatar Upload - Base64)](#3-头像上传-base64-avatar-upload-base64)
  - [管理员资源上传 (Admin Asset Upload)](#4-管理员资源上传-admin-asset-upload)
- [Mobile 客户端使用 (Mobile Client Usage)](#mobile-客户端使用-mobile-client-usage)
- [错误处理 (Error Handling)](#错误处理-error-handling)
- [限制与约束 (Limitations & Constraints)](#限制与约束-limitations-constraints)

---

## 概述 (Overview)

我们的图片上传系统使用 **Supabase Storage** 作为后端存储，支持多种上传方式：  
(Our image upload system uses **Supabase Storage** as backend, supporting multiple upload methods:)
- **Base64 编码上传**：适用于商品图片  
  (**Base64 encoded upload**: for listing images)
- **FormData 上传**：适用于头像和管理员文件  
  (**FormData upload**: for avatars and admin files)
- **自动降级**：头像上传会先尝试 FormData，失败后自动降级到 Base64  
  (**Auto fallback**: avatar upload tries FormData first, falls back to Base64 if failed)

**支持的图片格式**：JPG, JPEG, PNG, WebP  
(Supported image formats: JPG, JPEG, PNG, WebP)

**存储桶 (Buckets)**：  
- `listing-images` - 商品图片 (Listing images)
- `avatars` - 用户头像 (User avatars)
- `assets` - 管理员资源 (Admin assets)

---

## 认证 (Authentication)

所有上传 API 都需要认证（测试端点除外）。  
(All upload APIs require authentication except test endpoints.)

### Web 端认证 (Web Authentication)
使用 Supabase Session Cookie（自动处理）  
(Use Supabase Session Cookie, handled automatically)

### Mobile 端认证 (Mobile Authentication)
需要在请求头中包含 JWT token：  
(JWT token must be included in request headers:)

```typescript
Authorization: Bearer <your_jwt_token>
```

**Token 获取方式 (How to get token)**：
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('auth_token');
```

---

## API 端点 (API Endpoints)

### 1. 商品图片上传 (Listing Image Upload)

**端点 (Endpoint)**: `POST /api/listings/upload-image`

**用途 (Purpose)**: 上传商品发布时的图片（最多 9 张）  
(Upload images for product listing, up to 9 images)

#### 请求格式 (Request Format)

**Content-Type**: `application/json`

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "imageData": "base64-encoded-image-string",
  "fileName": "photo.jpg"
}
```

#### 响应格式 (Response Format)

**成功 (200) (Success 200)**:
```json
{
  "imageUrl": "https://ilykxrtilsbymlncunua.supabase.co/storage/v1/object/public/listing-images/listing-123-1699999999-abc123.jpg",
  "bucket": "listing-images"
}
```

**错误 (400/401/500) (Error 400/401/500)**:
```json
{
  "error": "Error message"
}
```

#### 示例代码 (Sample Code)

**JavaScript/TypeScript**:
```typescript
async function uploadListingImage(imageUri: string, fileName: string) {
  // 1. 读取图片并转换为 base64 (Read image and convert to base64)
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const reader = new FileReader();

  const base64 = await new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  // 2. 发送上传请求 (Send upload request)
  const uploadResponse = await fetch('/api/listings/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64,
      fileName: fileName
    })
  });

  const result = await uploadResponse.json();
  return result.imageUrl;
}
```

**React Native** (已在 `listingsService.ts` 实现 / Already implemented in `listingsService.ts`):
```typescript
import listingsService from '@/services/listingsService';

// 直接使用服务 (Use service directly)
const imageUrl = await listingsService.uploadListingImage(localImageUri);
console.log('Uploaded:', imageUrl);
```

#### 文件命名规则 (File Naming Rule)
- 格式: `listing-{userId}-{timestamp}-{uuid}.{ext}`  
  (Format: `listing-{userId}-{timestamp}-{uuid}.{ext}`)
- 示例: `listing-123-1699999999-abc123.jpg`  
  (Example: `listing-123-1699999999-abc123.jpg`)

---

### 2. 头像上传 (FormData) (Avatar Upload - FormData)

**端点 (Endpoint)**: `POST /api/profile/avatar`

**用途 (Purpose)**: 上传或更新用户头像（推荐方式）  
(Upload or update user avatar, recommended)

#### 请求格式 (Request Format)

**Content-Type**: `multipart/form-data`

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body** (FormData):
```javascript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,           // 本地文件路径 (Local file path)
  name: 'avatar.jpg',      // 文件名 (File name)
  type: 'image/jpeg'       // MIME 类型 (MIME type)
});
```

#### 响应格式 (Response Format)

**成功 (200) (Success 200)**:
```json
{
  "ok": true,
  "avatarUrl": "https://ilykxrtilsbymlncunua.supabase.co/storage/v1/object/public/avatars/avatar-123-1699999999.jpg",
  "message": "Avatar uploaded successfully"
}
```

#### 示例代码 (Sample Code)

**React Native**:
```typescript
import userService from '@/services/userService';

async function updateAvatar(imageUri: string) {
  try {
    const avatarUrl = await userService.uploadAvatar(imageUri);
    console.log('Avatar uploaded:', avatarUrl);

    // 更新用户信息 (Update user info)
    await userService.updateProfile({ avatar_url: avatarUrl });
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

**Web (Fetch API)**:
```typescript
async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  return result.avatarUrl;
}
```

---

### 3. 头像上传 (Base64) (Avatar Upload - Base64)

**端点 (Endpoint)**: `POST /api/profile/avatar-base64`

**用途 (Purpose)**: 头像上传的降级方案（当 FormData 失败时自动使用）  
(Fallback for avatar upload, used when FormData fails)

#### 请求格式 (Request Format)

**Content-Type**: `application/json`

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "imageData": "base64-string-or-data-url",
  "fileName": "avatar.jpg"
}
```

**支持的 imageData 格式 (Supported imageData formats)**:
1. 纯 Base64 字符串: `iVBORw0KGgoAAAANSUhEUgA...`  
   (Pure Base64 string)
2. Data URL: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`  
   (Data URL)

#### 响应格式 (Response Format)

**成功 (200) (Success 200)**:
```json
{
  "ok": true,
  "avatarUrl": "https://ilykxrtilsbymlncunua.supabase.co/storage/v1/object/public/avatars/avatar-123-1699999999.jpg"
}
```

#### 示例代码 (Sample Code)

```typescript
async function uploadAvatarBase64(base64Data: string, fileName: string) {
  const response = await fetch('/api/profile/avatar-base64', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageData: base64Data,
      fileName: fileName
    })
  });

  const result = await response.json();
  return result.avatarUrl;
}
```

---

### 4. 管理员资源上传 (Admin Asset Upload)

**端点 (Endpoint)**: `POST /api/admin/storage/upload?prefix=assets/...`

**用途 (Purpose)**: 管理员上传系统资源文件  
(Admin uploads system asset files)

**权限 (Permission)**: 需要管理员角色 (Admin role required)

#### 请求格式 (Request Format)

**Query Parameters**:
- `prefix` (optional): 文件在存储桶中的路径前缀  
  (File path prefix in bucket)
  - 示例: `assets/banners/` → 文件会存储到 `assets/banners/filename.jpg`  
    (Example: `assets/banners/` → file stored as `assets/banners/filename.jpg`)

**Content-Type**: `multipart/form-data`

**Headers**:
```http
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body** (FormData):
```javascript
const formData = new FormData();
formData.append('file', file);
```

#### 响应格式 (Response Format)

**成功 (200) (Success 200)**:
```json
{
  "bucket": "assets",
  "path": "assets/banners/banner-1699999999.jpg",
  "url": "https://ilykxrtilsbymlncunua.supabase.co/storage/v1/object/public/assets/banners/banner-1699999999.jpg"
}
```

#### 示例代码 (Sample Code)

```typescript
async function uploadAdminAsset(file: File, prefix: string = 'assets/') {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/admin/storage/upload?prefix=${prefix}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });

  const result = await response.json();
  return result.url;
}
```

---

## Mobile 客户端使用 (Mobile Client Usage)

### 商品发布页面上传图片 (Upload Images in Listing Page)

在 `SellScreen` 中已经实现了完整的图片上传流程：  
(The complete image upload flow is implemented in `SellScreen`:)

```typescript
import listingsService from '@/services/listingsService';
import * as ImagePicker from 'expo-image-picker';

// 1. 选择图片 (Pick image)
const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets) {
    for (const asset of result.assets) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 添加临时占位 (Add temporary placeholder)
      setPhotos(prev => [...prev, {
        id: tempId,
        localUri: asset.uri,
        remoteUrl: '',
        uploading: true
      }]);

      try {
        // 上传到服务器 (Upload to server)
        const remoteUrl = await listingsService.uploadListingImage(asset.uri);

        // 更新为远程 URL (Update to remote URL)
        setPhotos(prev => prev.map(p =>
          p.id === tempId
            ? { ...p, remoteUrl, uploading: false }
            : p
        ));
      } catch (error) {
        console.error('Upload failed:', error);
        // 移除失败的图片 (Remove failed image)
        setPhotos(prev => prev.filter(p => p.id !== tempId));
      }
    }
  }
};
```

### 头像上传 (Avatar Upload)

在 `ProfileEditScreen` 中使用：  
(Used in `ProfileEditScreen`:)

```typescript
import userService from '@/services/userService';
import * as ImagePicker from 'expo-image-picker';

const handleChangeAvatar = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    try {
      const avatarUrl = await userService.uploadAvatar(result.assets[0].uri);
      await userService.updateProfile({ avatar_url: avatarUrl });
      console.log('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload failed:', error);
    }
  }
};
```

---

## 错误处理 (Error Handling)

### 常见错误码 (Common Error Codes)

| 状态码 (Status) | 错误信息 (Error) | 原因 (Reason) | 解决方案 (Solution) |
|--------|----------|------|----------|
| 400 | `Invalid image data` | Base64 数据为空或格式错误 (Base64 data empty or invalid) | 检查图片是否正确转换为 Base64 (Check image conversion) |
| 400 | `No file provided` | FormData 中没有文件 (No file in FormData) | 确保 FormData 包含 'file' 字段 (Ensure 'file' in FormData) |
| 400 | `Storage bucket is not configured` | 存储桶未创建或配置错误 (Bucket not created/configured) | 检查 Supabase 项目配置 (Check Supabase config) |
| 401 | `Unauthorized` | 缺少或无效的认证 token (Missing/invalid token) | 检查 Authorization header (Check header) |
| 403 | `Forbidden` | 权限不足（如非管理员访问管理员接口） (Insufficient permission) | 确认用户角色权限 (Check user role) |
| 500 | `Failed to upload image` | 服务器内部错误 (Server error) | 查看服务器日志，检查 Supabase 连接 (Check logs/Supabase) |

### 错误处理最佳实践 (Best Practices)

```typescript
async function safeUploadImage(imageUri: string) {
  try {
    const url = await listingsService.uploadListingImage(imageUri);
    return { success: true, url };
  } catch (error: any) {
    console.error('Upload error:', error);

    // 根据错误类型处理 (Handle by error type)
    if (error.response?.status === 401) {
      // Token 过期，尝试刷新 (Token expired, try refresh)
      await refreshAuthToken();
      return safeUploadImage(imageUri); // 重试 (Retry)
    } else if (error.response?.status === 400) {
      // 数据格式错误 (Data format error)
      return { success: false, error: '图片格式不正确' };
    } else if (error.code === 'NETWORK_ERROR') {
      // 网络错误 (Network error)
      return { success: false, error: '网络连接失败，请稍后重试' };
    } else {
      return { success: false, error: '上传失败，请重试' };
    }
  }
}
```

### 自动重试机制 (Auto Retry Mechanism)

Mobile 客户端已实现自动重试（在 `api.ts` 中）：  
(Mobile client implements auto-retry in `api.ts`:)

```typescript
// 401 错误会自动触发 token 刷新并重试一次 (401 triggers token refresh and retry)
if (error.response?.status === 401 && !config._retry) {
  try {
    await refreshSession();
    config._retry = true;
    return apiClient.request(config);
  } catch (refreshError) {
    // 刷新失败，跳转到登录页 (Refresh failed, go to login)
  }
}
```

---

## 限制与约束 (Limitations & Constraints)

### 文件限制 (File Limits)

| 项目 (Item) | 限制 (Limit) |
|------|------|
| **支持格式 (Supported formats)** | JPG, JPEG, PNG, WebP |
| **商品图片数量 (Listing image count)** | 每个商品最多 9 张 (Max 9 per listing) |
| **文件大小 (File size)** | 未明确限制（建议 < 10MB） (No strict limit, suggest <10MB) |
| **图片质量 (Image quality)** | 建议使用 0.8 质量压缩 (Suggest quality 0.8) |

### 命名规则 (Naming Rules)

**商品图片 (Listing images)**:
```
listing-{userId}-{timestamp}-{uuid}.{ext}
例: listing-123-1699999999-abc123-def456.jpg
(Example: listing-123-1699999999-abc123-def456.jpg)
```

**头像 (Avatar)**:
```
avatar-{userId}-{timestamp}.{ext}
例: avatar-123-1699999999.jpg
(Example: avatar-123-1699999999.jpg)
```

**管理员资源 (Admin asset)**:
```
{timestamp}_{originalFileName}
例: 1699999999_banner.jpg
(Example: 1699999999_banner.jpg)
```

### 性能建议 (Performance Tips)

1. **图片压缩 (Image compression)**: 上传前使用 `quality: 0.8` 压缩图片 (Compress before upload)
2. **批量上传 (Batch upload)**: 使用 `Promise.all()` 并行上传多张图片 (Parallel upload with Promise.all)
3. **进度显示 (Progress display)**: 为用户显示上传进度，提升体验 (Show progress to user)
4. **本地预览 (Local preview)**: 先显示本地图片，上传完成后替换为远程 URL (Show local preview, replace with remote URL after upload)

```typescript
// 批量上传示例 (Batch upload example)
async function uploadMultipleImages(imageUris: string[]) {
  const uploadPromises = imageUris.map(uri =>
    listingsService.uploadListingImage(uri)
  );

  const results = await Promise.allSettled(uploadPromises);

  const successUrls = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<string>).value);

  return successUrls;
}
```

### 缓存控制 (Cache Control)

所有上传的文件默认设置：  
(All uploaded files default settings:)
- **Cache-Control**: `3600` (1 小时 / 1 hour)
- **公开访问 (Public access)**: 所有图片都是公开可访问的 (All images are public)
- **Upsert 模式 (Upsert mode)**: 头像上传使用 `upsert: true`，会覆盖同名文件 (Avatar upload uses upsert, overwrites same name)

---

## 环境配置 (Environment Setup)

### 必需的环境变量 (Required Environment Variables)

```bash
# .env.local (Web)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase 存储桶配置 (Supabase Bucket Setup)

确保以下存储桶已创建并设置为公开访问：  
(Make sure these buckets are created and set to public:)

1. `listing-images` - 商品图片 (Listing images)
2. `avatars` - 用户头像 (User avatars)
3. `assets` - 管理员资源（仅管理员上传） (Admin assets, admin only)

**创建存储桶 (Create bucket, Supabase Dashboard)**:
1. 进入 Storage → Buckets (Go to Storage → Buckets)
2. 点击 "New Bucket" (Click "New Bucket")
3. 名称: `listing-images` (Name: `listing-images`)
4. 勾选 "Public bucket" (Check "Public bucket")
5. 点击 "Create bucket" (Click "Create bucket")

---

## 常见问题 (FAQ)

### 1. 为什么头像上传有两个接口？ (Why are there two avatar upload endpoints?)

**答 (Answer)**: 为了兼容性和可靠性。`/profile/avatar` 使用 FormData 是标准方式，但某些环境（如旧版 React Native）可能不支持，因此提供了 Base64 降级方案。客户端会自动尝试 FormData，失败后切换到 Base64。  
(To ensure compatibility and reliability. `/profile/avatar` uses FormData (standard), but some environments (e.g. old React Native) may not support it, so a Base64 fallback is provided. Client tries FormData first, falls back to Base64 if failed.)

### 2. 图片上传很慢怎么办？ (What if image upload is slow?)

**答 (Answer)**:
- 上传前压缩图片 (`quality: 0.8`) (Compress before upload)
- 检查网络连接 (Check network)
- 考虑使用图片裁剪减小尺寸 (Crop image to reduce size)
- 对于商品图片，可使用批量并行上传 (Use batch parallel upload for listing images)

### 3. 上传失败但没有错误信息？ (Upload failed but no error message?)

**答 (Answer)**: 检查以下几点：  
(Check these:)
1. 控制台是否有网络错误 (Any network error in console)
2. Token 是否过期（客户端会自动刷新） (Token expired, client auto refresh)
3. Supabase 存储桶是否正确配置 (Supabase bucket config)
4. 环境变量是否正确设置 (Env variables set correctly)

### 4. 如何删除已上传的图片？ (How to delete uploaded images?)

**答 (Answer)**: 当前实现未提供删除接口。如需删除，可以：  
(Currently no delete API. To delete:)
1. 使用 Supabase Dashboard 手动删除 (Delete manually in Supabase Dashboard)
2. 实现管理员删除接口（参考 `/admin/storage/delete`） (Implement admin delete API, see `/admin/storage/delete`)
3. 通过 Supabase RLS 策略自动清理 (Auto clean via Supabase RLS policy)

### 5. 能否上传视频？ (Can I upload videos?)

**答 (Answer)**: 当前实现仅支持图片格式（JPG, PNG, WebP）。如需支持视频，需要：  
(Currently only images supported. To support video:)
1. 修改文件类型验证逻辑 (Change file type validation)
2. 调整存储桶配置 (Adjust bucket config)
3. 考虑视频转码和压缩 (Consider video transcoding/compression)

---

## 相关文件 (Related Files)

| 文件 (File) | 说明 (Description) |
|------|------|
| [web/src/app/api/listings/upload-image/route.ts](../web/src/app/api/listings/upload-image/route.ts) | 商品图片上传接口 (Listing image upload API) |
| [web/src/app/api/profile/avatar/route.ts](../web/src/app/api/profile/avatar/route.ts) | 头像上传接口 (FormData) (Avatar upload API - FormData) |
| [web/src/app/api/profile/avatar-base64/route.ts](../web/src/app/api/profile/avatar-base64/route.ts) | 头像上传接口 (Base64) (Avatar upload API - Base64) |
| [mobile/src/services/listingsService.ts](../mobile/src/services/listingsService.ts) | Mobile 商品图片上传服务 (Mobile listing image upload service) |
| [mobile/src/services/userService.ts](../mobile/src/services/userService.ts) | Mobile 用户头像上传服务 (Mobile user avatar upload service) |
| [mobile/src/services/api.ts](../mobile/src/services/api.ts) | API 客户端（含认证逻辑） (API client with authentication logic) |

---

## 更新日志 (Changelog)

- **2025-11**: 初始版本，支持商品图片和头像上传 (Initial version, supports listing and avatar upload)
- 支持 FormData 和 Base64 两种上传方式 (Supports FormData and Base64 upload)
- 实现自动降级和重试机制 (Implements auto fallback and retry)
- 添加管理员资源上传功能 (Adds admin asset upload)

---

**如有问题，请联系开发团队或查看源代码。**  
(For any questions, contact the dev team or check the source code.)
