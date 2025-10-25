# 🔧 手动修复Adidas商品状态指南

## 问题描述
你的Adidas商品显示为"sold"状态，但你想要把它重新变成"active"状态。

## 📋 商品状态说明
- **Active (活跃)**: `listed = true, sold = false`
- **Sold (已售出)**: `sold = true`
- **Inactive (下架)**: `listed = false, sold = false`

## 🛠️ 解决方案

### 方法1: 通过Web管理界面 (最简单)

1. **打开Web管理界面**
   - 访问: `http://192.168.0.79:3000/admin/listings`
   - 用你的管理员账户登录

2. **找到Adidas商品**
   - 在商品列表中搜索"adidas"或"Adidas"
   - 找到你要修改的商品

3. **修改商品状态**
   - 点击商品进入详情页面
   - 找到状态设置部分
   - 将"sold"设置为`false`
   - 将"listed"设置为`true`
   - 保存更改

### 方法2: 通过API直接修改

1. **获取你的认证Token**
   - 在移动端应用中，打开开发者工具
   - 查看网络请求，找到Authorization header中的token

2. **使用API修改**
   ```bash
   # 替换{商品ID}和{你的token}
   curl -X PATCH "http://192.168.0.79:3000/api/listings/{商品ID}" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {你的token}" \
     -d '{
       "sold": false,
       "listed": true
     }'
   ```

### 方法3: 使用提供的修复脚本

1. **获取认证Token**
   - 在移动端应用中登录
   - 查看网络请求获取token

2. **运行修复脚本**
   - 打开 `mobile/fix-adidas-listing.js`
   - 替换 `YOUR_AUTH_TOKEN_HERE` 为你的实际token
   - 在Node.js环境中运行脚本

### 方法4: 通过数据库直接修改 (需要数据库访问权限)

1. **连接到数据库**
   ```bash
   # 使用你的数据库连接信息
   psql -h your-host -U your-username -d your-database
   ```

2. **查找Adidas商品**
   ```sql
   SELECT id, name, brand, sold, listed 
   FROM listings 
   WHERE brand ILIKE '%adidas%' 
   AND seller_id = (SELECT id FROM users WHERE username = '你的用户名');
   ```

3. **修改状态**
   ```sql
   UPDATE listings 
   SET sold = false, listed = true, updated_at = NOW() 
   WHERE id = {商品ID};
   ```

## 🔍 如何找到商品ID

### 通过移动端应用
1. 打开你的商品列表
2. 查看网络请求，找到商品ID

### 通过API
```bash
# 获取你的所有商品
curl -H "Authorization: Bearer {你的token}" \
  "http://192.168.0.79:3000/api/listings/my"
```

### 通过数据库
```sql
SELECT id, name, brand, sold, listed 
FROM listings 
WHERE brand ILIKE '%adidas%';
```

## ✅ 验证修改结果

修改完成后，你可以通过以下方式验证：

1. **移动端应用**
   - 刷新商品列表
   - 检查Adidas商品是否显示为"active"

2. **API检查**
   ```bash
   curl -H "Authorization: Bearer {你的token}" \
     "http://192.168.0.79:3000/api/listings/{商品ID}"
   ```

3. **数据库检查**
   ```sql
   SELECT id, name, brand, sold, listed 
   FROM listings 
   WHERE id = {商品ID};
   ```

## 🚨 注意事项

1. **权限要求**: 只有商品的所有者才能修改商品状态
2. **数据备份**: 修改前建议备份数据库
3. **测试环境**: 建议先在测试环境验证修改效果
4. **API限制**: 确保API请求包含正确的认证信息

## 📞 如果遇到问题

1. **检查认证**: 确保token有效且未过期
2. **检查权限**: 确保你是商品的所有者
3. **检查网络**: 确保API服务器正在运行
4. **查看日志**: 检查服务器日志获取详细错误信息

## 🎯 推荐方法

**最简单的方法**: 使用Web管理界面 (`http://192.168.0.79:3000/admin/listings`)
- 界面友好
- 操作简单
- 实时预览
- 错误提示清晰



