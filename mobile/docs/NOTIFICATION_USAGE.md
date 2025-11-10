# 客户端通知和聊天功能使用说明

## 概述

本项目实现了**客户端本地通知**和**实时聊天**功能，**不依赖iOS Push和FCM服务器推送**。

## 功能特性

### ✅ 已实现功能

1. **本地通知服务**
   - 显示新消息通知
   - 显示应用通知（订单、点赞、关注等）
   - 通知点击跳转到相应页面
   - 通知去重（避免重复通知）

2. **消息轮询服务**
   - 定期检查新消息（应用活跃时30秒，后台时60秒）
   - 仅在用户登录时运行
   - 智能避免在当前打开的对话中显示通知

3. **通知轮询服务**
   - 定期检查新通知
   - 支持各种通知类型（订单、点赞、关注、评论、系统通知）

## 使用方法

### 1. 安装依赖

依赖已添加到 `package.json`，运行：

```bash
cd mobile
npm install
```

### 2. 配置 app.json

通知插件已配置在 `app.json` 中：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#F54B3D",
          "sounds": []
        }
      ]
    ]
  }
}
```

### 3. 运行应用

```bash
npm start
# 或
npx expo start
```

### 4. 通知权限

首次运行时，应用会请求通知权限。用户需要授予权限才能接收通知。

## 服务说明

### LocalNotificationService

本地通知服务，负责显示通知和管理通知权限。

**主要方法：**

```typescript
// 显示新消息通知
await localNotificationService.showMessageNotification({
  title: '新消息',
  body: 'John: Hello!',
  conversationId: '123',
  userId: '456',
  username: 'John',
});

// 显示应用通知
await localNotificationService.showNotification({
  title: '新点赞',
  body: '@summer liked your listing',
  type: 'like',
  notificationId: '789',
  listingId: '101',
});
```

### PollingService

轮询服务，负责定期检查新消息和新通知。

**主要方法：**

```typescript
// 启动轮询（用户登录后自动启动）
pollingService.start();

// 停止轮询（用户登出后自动停止）
pollingService.stop();

// 设置当前打开的对话ID（避免显示通知）
pollingService.setCurrentConversationId('conversationId');

// 清除当前对话ID
pollingService.setCurrentConversationId(null);

// 手动触发检查
await pollingService.triggerCheck();
```

## 轮询间隔配置

轮询间隔可以在 `pollingService.ts` 中配置：

```typescript
const POLLING_INTERVALS = {
  ACTIVE: 30000,      // 应用活跃时：30秒
  BACKGROUND: 60000,  // 应用后台时：60秒
  INACTIVE: 120000,   // 应用不活跃时：2分钟
};
```

## 通知点击处理

通知点击会自动跳转到相应页面：

- **消息通知** → 跳转到聊天页面
- **应用通知** → 跳转到通知页面
- **订单通知** → 跳转到订单详情（需要实现）

## 注意事项

### iOS限制

1. **后台任务限制**
   - iOS限制后台任务执行时间（约30秒）
   - 应用关闭后无法轮询（除非使用Background Fetch）

2. **通知权限**
   - 需要用户授权通知权限
   - 可以在系统设置中管理权限

### Android限制

1. **电池优化**
   - 可能需要将应用添加到电池优化白名单
   - 部分设备可能限制后台任务

2. **通知渠道**
   - Android 8.0+需要配置通知渠道
   - 已在代码中自动配置

### 通用限制

1. **实时性**
   - 轮询方式不如WebSocket实时
   - 最快检查间隔为30秒

2. **服务器负载**
   - 轮询会增加服务器请求
   - 建议根据用户量调整轮询间隔

3. **网络依赖**
   - 需要网络连接才能检查新消息
   - 离线时无法接收通知

## 测试

### 测试通知

1. **测试消息通知**
   - 使用另一个账号发送消息
   - 等待轮询检查（最多30秒）
   - 应该收到通知

2. **测试应用通知**
   - 触发一个通知事件（如点赞、关注）
   - 等待轮询检查
   - 应该收到通知

3. **测试通知点击**
   - 点击通知
   - 应该跳转到相应页面

### 调试

查看控制台日志：

```bash
# 启动日志
🚀 Starting PollingService...

# 检查更新
🔍 Checking for updates...

# 显示通知
✅ Message notification shown: ...
✅ App notification shown: ...

# 通知点击
📱 Notification clicked: ...
```

## 未来改进

1. **WebSocket支持**
   - 实现WebSocket连接以获得更好的实时性
   - 减少服务器负载

2. **后台任务**
   - 使用Expo TaskManager实现后台任务
   - 支持应用关闭后检查新消息

3. **通知分组**
   - 将相同类型的通知分组显示
   - 改善用户体验

4. **离线队列**
   - 缓存未发送的消息
   - 网络恢复后自动发送

## 相关文档

- [实现方案文档](./CHAT_AND_NOTIFICATION_IMPLEMENTATION.md)
- [Expo Notifications文档](https://docs.expo.dev/versions/latest/sdk/notifications/)

