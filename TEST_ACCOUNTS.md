# 测试账户信息

## 🔐 测试账户列表

为了方便开发和测试，以下是可以直接登录的测试账户：

| 用户名 | 邮箱 | 明文密码 | 角色 | 高级会员 | 描述 |
|--------|------|----------|------|----------|------|
| admin | admin@topcare.com | admin123 | 管理员 | 是 | 系统管理员，可访问所有功能 |
| fashionista_emma | emma@example.com | password123 | 用户 | 是 | 时尚达人，高级会员功能测试 |
| vintage_hunter | vintage@gmail.com | password123 | 用户 | 否 | 复古服装爱好者，普通用户 |
| style_guru_alex | alex@fashion.co | password123 | 用户 | 是 | 风格顾问，高级卖家 |
| casual_buyer | buyer@email.com | password123 | 用户 | 否 | 普通买家，基础功能测试 |
| premium_seller | seller@pro.com | password123 | 用户 | 是 | 专业卖家，高级功能测试 |
| trend_setter | trends@style.net | password123 | 用户 | 否 | 潮流设定者，社交功能测试 |
| eco_warrior | eco@green.org | password123 | 用户 | 是 | 环保倡导者，可持续时尚 |
| budget_shopper | budget@student.edu | password123 | 用户 | 否 | 预算购物者，学生用户 |
| luxury_lover | luxury@designer.com | password123 | 用户 | 是 | 奢侈品爱好者，高端市场 |

## 🧪 测试场景建议

### 管理员功能测试
- **账户**: admin / admin123
- **测试内容**: 
  - 用户管理
  - 反馈/推荐信管理
  - 商品审核
  - 数据统计查看
  - 系统配置

### 高级会员功能测试
- **账户**: fashionista_emma / password123 或 style_guru_alex / password123
- **测试内容**:
  - 无限商品发布
  - Mix & Match AI无限使用
  - 推广优惠 (30% off)
  - 高级徽章显示
  - 低佣金率 (5%)

### 普通用户功能测试
- **账户**: casual_buyer / password123 或 vintage_hunter / password123
- **测试内容**:
  - 限制商品发布 (最多2个)
  - Mix & Match AI限制使用 (3次)
  - 标准推广价格
  - 标准佣金率 (10%)

### 买卖交易测试
- **买家**: casual_buyer / password123
- **卖家**: premium_seller / password123
- **测试内容**:
  - 商品浏览和购买
  - 交易流程
  - 评价系统
  - 消息沟通

## 🔄 更新密码

系统使用 **SHA256** 哈希算法（不是bcrypt）。如果需要重置密码，可以使用以下方法：

### 方法1: SQL命令
```sql
-- 更新admin密码为 'admin123' (SHA256 hash)
UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' 
WHERE username = 'admin';

-- 批量更新所有测试用户密码为 'password123' (SHA256 hash)
UPDATE users SET password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f' 
WHERE username IN ('fashionista_emma', 'vintage_hunter', 'style_guru_alex', 'casual_buyer', 'premium_seller', 'trend_setter', 'eco_warrior', 'budget_shopper', 'luxury_lover');
```

### 方法2: JavaScript生成哈希
```javascript
const crypto = require('crypto');

// 生成密码哈希
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('admin123 hash:', hashPassword('admin123'));
console.log('password123 hash:', hashPassword('password123'));
```

## ⚠️ 安全提醒

**仅用于开发和测试环境！**

- 这些密码仅用于开发和测试
- 生产环境必须使用强密码
- 定期更换测试环境密码
- 不要在生产代码中硬编码密码

## 🔧 自动设置测试密码

运行以下命令自动设置所有测试账户密码：

```bash
cd web
node -e "
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function setTestPasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'top_care_fashion'
  });
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await connection.execute('UPDATE users SET password_hash = ? WHERE username = ?', [adminPassword, 'admin']);
  await connection.execute('UPDATE users SET password_hash = ? WHERE username != ?', [hashedPassword, 'admin']);
  
  console.log('✅ 测试密码设置完成！');
  await connection.end();
}

setTestPasswords().catch(console.error);
"
```
