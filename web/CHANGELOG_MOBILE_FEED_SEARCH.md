# 移动端Feed算法搜索 - 更新日志

## 2025-11-10: 创建新分支并启用移动端Feed算法搜索

### 新增功能
- ✅ 创建 `feature/mobile-feed-search` 分支
- ✅ 移动端搜索自动启用feed算法
- ✅ 添加移动端标识头 (`x-mobile-app: true`)
- ✅ 实现优雅降级机制（失败时fallback到传统搜索）

### 后端修改

#### 1. 搜索API (`web/src/app/api/search/route.ts`)
- 添加移动端检测逻辑
- 移动端默认启用feed算法搜索
- Web端需要显式启用（`useFeed=true`）
- 支持匿名用户搜索

#### 2. 数据库函数
- `get_search_feed()` 函数支持NULL用户（匿名用户）
- 优化搜索相关性评分算法
- 支持用户偏好和历史行为推荐

### 移动端修改

#### 1. API配置 (`mobile/src/config/api.ts`)
- 添加 `SEARCH: "/api/search"` 端点配置

#### 2. API客户端 (`mobile/src/services/api.ts`)
- 所有请求自动添加 `x-mobile-app: true` 头
- 标识移动端请求来源

#### 3. 商品服务 (`mobile/src/services/listingsService.ts`)
- `searchListings()` 方法使用新的搜索端点
- 自动启用feed算法搜索
- 失败时自动fallback到传统搜索
- 支持categoryId参数

### 兼容性
- ✅ Web端搜索不受影响（默认使用传统搜索）
- ✅ 移动端搜索失败时自动fallback
- ✅ 向后兼容，不影响现有功能
- ✅ 支持匿名用户搜索

### 测试建议
1. 测试移动端搜索功能
2. 验证feed算法搜索结果
3. 测试fallback机制
4. 验证匿名用户搜索
5. 检查Web端搜索不受影响

### 部署步骤
1. 确保数据库迁移已应用
2. 部署后端代码
3. 更新移动端代码
4. 测试搜索功能
5. 监控性能和错误率

