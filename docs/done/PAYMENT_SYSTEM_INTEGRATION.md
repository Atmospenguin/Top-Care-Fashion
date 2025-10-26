# 支付系统集成完成文档

## ✅ 已完成功能

### 1. 后端 API (已存在)
- **GET /api/payment-methods**: 获取用户所有支付方式
- **POST /api/payment-methods**: 创建新支付方式
- **PUT /api/payment-methods**: 更新支付方式（包括设为默认）
- **DELETE /api/payment-methods**: 删除支付方式

### 2. 移动端服务层
**文件**: `mobile/src/services/paymentMethodsService.ts`
- ✅ `getPaymentMethods()`: 获取所有支付方式
- ✅ `getDefaultPaymentMethod()`: 获取默认支付方式
- ✅ `createPaymentMethod()`: 创建新支付方式
- ✅ `updatePaymentMethod()`: 更新支付方式
- ✅ `setDefaultPaymentMethod()`: 设为默认
- ✅ `deletePaymentMethod()`: 删除支付方式

### 3. UI 组件
**PaymentMethodForm** (`mobile/components/PaymentMethodForm.tsx`)
- ✅ 卡片品牌选择（Visa, Mastercard, Amex, Discover）
- ✅ 卡号后4位输入
- ✅ 过期日期自动格式化（MM/YY）
- ✅ CVV 输入（仅用于验证）
- ✅ 卡片标签（可选）

**PaymentSelector** (`mobile/components/PaymentSelector.tsx`)
- ✅ 显示已保存的支付方式列表
- ✅ 视觉选中状态（蓝色边框 + 对勾）
- ✅ 默认标签显示
- ✅ 添加新卡按钮 + 模态框
- ✅ 删除按钮（带确认）
- ✅ 设为默认功能
- ✅ 空状态提示

### 4. 页面集成

#### CheckoutScreen (`mobile/screens/main/BuyStack/CheckoutScreen.tsx`)
- ✅ 页面加载时从后端获取默认支付方式
- ✅ Payment 卡片显示后端数据（brand + last4）
- ✅ "Change" 按钮打开 PaymentSelector 模态框
- ✅ 创建订单时使用真实的 payment_method_id 和完整数据
- ✅ 移除了 mock 的 expiry 和 cvv 数据

#### PremiumPlansScreen (`mobile/screens/main/MyTopStack/PremiumPlansScreen.tsx`)
- ✅ 页面加载时从后端获取默认支付方式
- ✅ "GET IT NOW" 打开支付模态框
- ✅ 模态框中使用 PaymentSelector
- ✅ 未选择支付方式时禁用 "Confirm & Pay" 按钮
- ✅ 传递选中的支付方式给 premiumService.upgrade()

#### ManagePaymentsScreen (`mobile/screens/main/MyTopStack/ManagePaymentsScreen.tsx`)
- ✅ 完整的支付方式管理页面
- ✅ 使用 PaymentSelector 组件
- ✅ 显示当前选中的支付方式
- ✅ 已注册到 MyTopStack 导航器

#### SettingScreen (`mobile/screens/main/MyTopStack/SettingScreen.tsx`)
- ✅ Account 区域添加了 "Payment methods" 入口
- ✅ 使用 card-outline 图标
- ✅ 点击导航到 ManagePaymentsScreen

### 5. 数据库更新
**Schema 更新** (`web/prisma/schema.prisma`)
- ✅ `orders.payment_method_id`: 新增字段，关联 user_payment_methods
- ✅ `orders.payment_method_ref`: 添加关系定义（onDelete: SetNull）
- ✅ `user_payment_methods.orders`: 添加反向关系

**SQL 迁移文件** (`web/add_payment_method_id_to_orders.sql`)
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER;
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_method 
  FOREIGN KEY (payment_method_id) REFERENCES user_payment_methods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
```

### 6. API 更新
**Orders API** (`web/src/app/api/orders/route.ts`)
- ✅ POST /api/orders 接受 `payment_method_id` 参数
- ✅ 将 payment_method_id 存储到数据库
- ✅ Console 日志输出 payment_method_id

**TypeScript 类型** (`mobile/src/services/ordersService.ts`)
- ✅ `CreateOrderRequest.payment_method_id?: number`

## 📋 完整用户流程

### 流程 1: 添加支付方式
1. 用户进入 **Settings** → **Payment methods**
2. 点击 **Add New Card** 按钮
3. 填写表单：
   - Card Nickname (可选)
   - Card Brand (Visa/Mastercard/Amex/Discover)
   - Last 4 digits
   - Expiry Date (MM/YY)
   - CVV (仅验证)
4. 点击 **Save**
5. 新卡片自动保存到后端 `user_payment_methods` 表
6. 如果是第一张卡，自动设为默认

### 流程 2: 结账使用支付方式
1. 用户进入 **Checkout** 页面
2. 页面自动显示默认支付方式
3. 用户点击 Payment 区域的 **Change** 按钮
4. 在 PaymentSelector 中选择已保存的卡片或添加新卡
5. 点击 **Place order**
6. 订单创建时携带 `payment_method_id` 和完整支付信息
7. 后端将订单关联到 user_payment_methods 表

### 流程 3: Premium 升级使用支付方式
1. 用户进入 **Premium Plans** 页面
2. 页面自动加载默认支付方式
3. 选择订阅计划后点击 **GET IT NOW**
4. 弹出支付模态框，显示 PaymentSelector
5. 选择支付方式（或添加新卡）
6. 点击 **Confirm & Pay**
7. 调用 `premiumService.upgrade()` 并传递支付方式信息

### 流程 4: 管理支付方式
1. 用户进入 **Settings** → **Payment methods**
2. 查看所有已保存的卡片
3. 可以执行：
   - **选择**某张卡（蓝色边框 + 对勾）
   - **设为默认**（显示绿色 Default 标签）
   - **删除**卡片（带确认弹窗）
   - **添加新卡**（打开表单模态框）

## 🔧 技术要点

### 数据流
```
移动端 → paymentMethodsService → /api/payment-methods → Supabase (user_payment_methods 表)
         ↓
    CheckoutScreen / PremiumPlansScreen
         ↓
    ordersService.createOrder({ payment_method_id })
         ↓
    /api/orders → Supabase (orders 表，含 payment_method_id 外键)
```

### 关键设计
1. **自动选择默认**: 首次加载时自动选中 `is_default=true` 的支付方式
2. **首张卡自动默认**: 创建第一张卡时自动设为默认
3. **唯一默认**: 设置新默认时，后端自动取消其他卡的默认状态
4. **级联删除**: 删除用户时自动删除其所有支付方式
5. **软关联**: 删除支付方式时，订单的 payment_method_id 设为 NULL（历史数据保留）

### 验证逻辑
- **PaymentMethodForm**: 前端验证卡号4位、过期日期格式
- **PaymentSelector**: 禁止未选择支付方式时提交
- **CheckoutScreen**: 下单前检查 selectedPaymentMethodId 是否存在
- **PremiumPlansScreen**: 支付按钮在未选择时禁用

## ⚠️ 待执行操作

### 数据库迁移
需要在生产数据库执行以下 SQL（文件：`web/add_payment_method_id_to_orders.sql`）：
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER;
ALTER TABLE orders ADD CONSTRAINT fk_orders_payment_method 
  FOREIGN KEY (payment_method_id) REFERENCES user_payment_methods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
```

### Prisma Client 重新生成
```bash
cd web
npx prisma generate
```

## 🧪 测试清单

### 单元测试
- [ ] 在 ManagePaymentsScreen 添加卡片
- [ ] 设置某张卡为默认
- [ ] 删除卡片（确认弹窗）
- [ ] 添加时验证必填字段

### 集成测试
- [ ] Checkout → 默认卡显示
- [ ] Checkout → Change → 选择其他卡
- [ ] Checkout → Change → 添加新卡
- [ ] Checkout → Place order → 验证 payment_method_id 传递
- [ ] Premium Plans → 默认卡加载
- [ ] Premium Plans → 选择卡后升级
- [ ] Settings → Payment methods → 查看列表

### 边界测试
- [ ] 无卡时的空状态
- [ ] 只有一张卡时无法删除（或允许删除后空状态）
- [ ] 删除默认卡后自动选择另一张
- [ ] 同时在多个页面操作时数据同步

## 📊 数据库表结构

### user_payment_methods
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID（外键） |
| type | VARCHAR(50) | 支付类型（card/wallet） |
| label | VARCHAR(100) | 卡片标签 |
| brand | VARCHAR(50) | 品牌（Visa/Mastercard等） |
| last4 | VARCHAR(4) | 卡号后4位 |
| expiry_month | INT | 过期月份 |
| expiry_year | INT | 过期年份 |
| is_default | BOOLEAN | 是否默认 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### orders（更新后）
| 新增字段 | 类型 | 说明 |
|---------|------|------|
| payment_method_id | INT | 关联 user_payment_methods.id |

## 🎯 业务价值

1. **统一管理**: 用户只需添加一次支付方式，全 app 复用
2. **数据持久化**: 所有支付方式存储在后端数据库
3. **历史追踪**: 订单关联 payment_method_id，可追溯支付方式
4. **安全合规**: 不存储完整卡号和 CVV，仅保存 last4 和 expiry
5. **用户体验**: 默认卡自动选中，减少操作步骤

## 🚀 上线准备

### 前置条件
1. ✅ 后端 API 已部署（/api/payment-methods）
2. ⏳ 执行数据库迁移 SQL
3. ⏳ 重新生成 Prisma Client
4. ✅ 移动端代码已完成

### 部署步骤
1. 连接生产数据库，执行 `add_payment_method_id_to_orders.sql`
2. 在 web 目录运行 `npx prisma generate`
3. 重启 web 服务器
4. 发布移动端更新
5. 验证测试账号的支付流程

### 回滚方案
如果出现问题，可以：
1. 回滚数据库（删除 payment_method_id 字段）
2. 恢复 web API 代码到之前版本
3. 回滚移动端到之前版本

---

**完成时间**: 2025-01-27
**开发者**: AI Assistant + User
**状态**: ✅ 前后端打通完成，待数据库迁移
