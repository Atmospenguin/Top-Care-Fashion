# 移动端Feed算法搜索分支说明

## 分支信息
- **分支名**: `feature/mobile-feed-search`
- **创建时间**: 2025-11-10
- **目的**: 为移动端启用feed算法搜索功能

## 修改内容

### 1. 后端修改 (web/)

#### 1.1 搜索API (`web/src/app/api/search/route.ts`)
- ✅ 添加移动端检测逻辑
- ✅ 移动端默认启用feed算法搜索
- ✅ Web端需要显式启用（`useFeed=true`）
- ✅ 检测方式：
  - User-Agent包含 "ReactNative" 或 "Mobile"
  - 请求头包含 `x-mobile-app: true`

#### 1.2 数据库函数
- ✅ `get_search_feed()` 函数已创建
- ✅ 支持搜索相关性评分
- ✅ 支持用户偏好匹配
- ✅ 支持用户历史行为推荐

### 2. 移动端修改 (mobile/)

#### 2.1 API配置 (`mobile/src/config/api.ts`)
- ✅ 添加 `SEARCH: "/api/search"` 端点配置

#### 2.2 API客户端 (`mobile/src/services/api.ts`)
- ✅ 添加 `x-mobile-app: true` 请求头
- ✅ 所有移动端请求都会携带此标识

#### 2.3 商品服务 (`mobile/src/services/listingsService.ts`)
- ✅ 修改 `searchListings()` 方法
- ✅ 使用新的 `/api/search` 端点
- ✅ 自动启用feed算法搜索
- ✅ 失败时自动fallback到传统搜索

## 功能特点

### 移动端搜索
1. **自动启用feed算法**
   - 移动端请求自动识别
   - 无需额外参数
   - 默认使用个性化推荐

2. **搜索相关性评分**
   - 名称匹配: 1.0 (完全匹配) / 0.9 (前缀匹配) / 0.7 (包含匹配)
   - 品牌匹配: 0.9 (完全匹配) / 0.6 (包含匹配)
   - 标签匹配: 0.8 (完全匹配) / 0.5 (包含匹配)
   - 描述匹配: 0.3

3. **个性化推荐**
   - 用户偏好品牌/风格匹配
   - 用户历史行为推荐
   - Boost和trending分数
   - 品牌多样性（brand decay）

4. **优雅降级**
   - Feed算法搜索失败时自动fallback
   - 使用传统搜索作为后备
   - 不影响用户体验

### Web端搜索
- 默认使用传统搜索（不影响生产环境）
- 可通过 `useFeed=true` 参数启用feed算法
- 完全向后兼容

## 测试建议

### 1. 移动端测试
```typescript
// 移动端搜索会自动使用feed算法
const result = await listingsService.searchListings('nike', {
  limit: 20,
  page: 1,
  gender: 'Men'
});
```

### 2. Web端测试
```bash
# 传统搜索（默认）
GET /api/listings?search=nike

# Feed算法搜索（需要显式启用）
GET /api/search?q=nike&useFeed=true
```

### 3. 验证点
- ✅ 移动端搜索使用feed算法
- ✅ Web端搜索不受影响
- ✅ 失败时自动fallback
- ✅ 搜索结果包含个性化推荐
- ✅ 搜索相关性评分正确

## 部署注意事项

1. **数据库迁移**
   - 确保 `get_search_feed` 函数已部署
   - 检查数据库连接正常

2. **环境变量**
   - 确保 `SUPABASE_SERVICE_ROLE` 已配置
   - 检查Supabase连接正常

3. **移动端更新**
   - 更新移动端代码
   - 测试搜索功能
   - 验证fallback机制

4. **监控**
   - 监控搜索API性能
   - 监控错误率
   - 收集用户反馈

## 回滚计划

如果需要回滚：
1. 移动端可以继续使用传统搜索（fallback机制）
2. Web端不受影响（默认使用传统搜索）
3. 可以移除 `x-mobile-app` 头，禁用feed算法

## 未来优化

1. **性能优化**
   - 实现搜索结果缓存
   - 优化数据库查询
   - 减少响应时间

2. **功能优化**
   - 支持更多搜索参数
   - 优化搜索相关性算法
   - 改进个性化推荐

3. **用户体验**
   - 添加搜索建议
   - 支持搜索历史
   - 优化搜索结果展示

