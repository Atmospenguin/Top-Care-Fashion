# 聊天和通知推送实现方案

## 概述

本文档描述了如何实现客户端聊天和本地通知推送功能，**不依赖iOS Push和FCM服务器推送**。

## 技术方案

### 1. 客户端本地通知

使用 **Expo Notifications** 库实现本地通知：

- **expo-notifications**: Expo官方通知库，支持iOS和Android
- 无需服务器推送，完全在客户端处理
- 可以在应用关闭时显示通知（需要后台任务支持）

### 2. 实时聊天实现

由于不使用服务器推送，我们使用以下策略实现实时聊天：

#### 方案A: 轮询（Polling）- 推荐
- **优点**: 实现简单，不需要WebSocket服务器
- **缺点**: 有延迟，会增加服务器负载
- **适用场景**: 中小型应用，用户量不大

#### 方案B: WebSocket连接（可选）
- **优点**: 实时性好，延迟低
- **缺点**: 需要WebSocket服务器，实现复杂
- **适用场景**: 大型应用，需要实时性

#### 方案C: Expo Background Fetch（可选）
- **优点**: 应用后台也能检查新消息
- **缺点**: iOS限制较多，执行频率受限
- **适用场景**: 需要后台更新功能

**本项目采用方案A（轮询）+ 本地通知的组合方案**

## 实现架构

```
┌─────────────────────────────────────────┐
│          App.tsx (根组件)                │
│  ┌───────────────────────────────────┐  │
│  │  NotificationService (初始化)      │  │
│  │  - 请求通知权限                    │  │
│  │  - 设置通知处理器                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  PollingService (轮询服务)        │  │
│  │  - 定期检查新消息                  │  │
│  │  - 定期检查新通知                  │  │
│  │  - 触发本地通知                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     LocalNotificationService            │
│  - scheduleNotification()               │
│  - cancelNotification()                 │
│  - cancelAllNotifications()             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      messagesService /                  │
│      notificationService                │
│  - getConversations()                   │
│  - getMessages()                        │
│  - getNotifications()                   │
└─────────────────────────────────────────┘
```

## 功能特性

### 1. 本地通知功能

- ✅ 显示新消息通知
- ✅ 显示新通知（订单、点赞、关注等）
- ✅ 通知点击跳转到相应页面
- ✅ 通知声音和震动
- ✅ 通知图标和样式自定义

### 2. 消息轮询功能

- ✅ 定期检查新消息（默认30秒）
- ✅ 仅在应用在前台或后台时运行
- ✅ 智能轮询间隔（应用活跃时更频繁）
- ✅ 避免重复通知

### 3. 通知轮询功能

- ✅ 定期检查新通知
- ✅ 与消息轮询合并，减少请求次数
- ✅ 支持各种通知类型

## 实现细节

### 1. 轮询策略

```typescript
// 轮询间隔配置
const POLLING_INTERVALS = {
  ACTIVE: 30000,      // 应用活跃时：30秒
  BACKGROUND: 60000,  // 应用后台时：60秒
  INACTIVE: 120000,   // 应用不活跃时：2分钟
};
```

### 2. 通知去重

使用本地存储记录已通知的消息/通知ID，避免重复通知：

```typescript
// 使用AsyncStorage存储已通知的ID
const NOTIFIED_IDS_KEY = '@notified_ids';
```

### 3. 通知权限

在应用启动时请求通知权限：

```typescript
// App.tsx
useEffect(() => {
  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission not granted');
    }
  }
  requestPermissions();
}, []);
```

### 4. 通知点击处理

```typescript
// 监听通知点击事件
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { notification } = response;
      const data = notification.request.content.data;
      
      // 根据通知类型跳转
      if (data.type === 'message') {
        navigation.navigate('Chat', { conversationId: data.conversationId });
      } else if (data.type === 'notification') {
        navigation.navigate('Notification');
      }
    }
  );
  
  return () => subscription.remove();
}, []);
```

## 使用示例

### 1. 发送本地通知

```typescript
import { localNotificationService } from './services/localNotificationService';

// 新消息通知
await localNotificationService.showMessageNotification({
  title: '新消息',
  body: 'John: Hello!',
  conversationId: '123',
  userId: '456',
});

// 新通知
await localNotificationService.showNotification({
  title: '新点赞',
  body: '@summer liked your listing',
  type: 'like',
  listingId: '789',
});
```

### 2. 启动轮询服务

```typescript
import { pollingService } from './services/pollingService';

// 在App.tsx中启动
useEffect(() => {
  if (user) {
    pollingService.start();
  }
  
  return () => {
    pollingService.stop();
  };
}, [user]);
```

## 配置选项

### app.json配置

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#F54B3D",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

## 性能优化

1. **智能轮询**: 根据应用状态调整轮询间隔
2. **批量检查**: 一次请求检查多个对话
3. **本地缓存**: 使用本地存储减少不必要的通知
4. **防抖处理**: 避免频繁触发通知

## 限制和注意事项

### iOS限制
- 后台任务执行时间有限（约30秒）
- 需要用户授权通知权限
- 应用关闭后无法轮询（除非使用Background Fetch）

### Android限制
- 需要通知权限
- 电池优化可能影响后台任务
- 需要在AndroidManifest.xml中配置

### 通用限制
- 轮询会增加服务器负载
- 实时性不如WebSocket
- 用户网络状况影响及时性

## 未来改进

1. **WebSocket支持**: 实现WebSocket连接以获得更好的实时性
2. **后台任务**: 使用Expo TaskManager实现后台任务
3. **通知分组**: 将相同类型的通知分组显示
4. **离线队列**: 缓存未发送的消息，网络恢复后发送

## 参考资源

- [Expo Notifications文档](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Background Tasks](https://reactnative.dev/docs/background-tasks)
- [Expo TaskManager文档](https://docs.expo.dev/versions/latest/sdk/task-manager/)

