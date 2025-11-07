import { AppState, AppStateStatus } from 'react-native';
import { messagesService } from './messagesService';
import { notificationService, type Notification } from './notificationService';
import { localNotificationService } from './localNotificationService';

// 轮询间隔配置（毫秒）
const POLLING_INTERVALS = {
  ACTIVE: 30000,      // 应用活跃时：30秒
  BACKGROUND: 60000,  // 应用后台时：60秒
  INACTIVE: 120000,   // 应用不活跃时：2分钟
};

// 存储上次检查的数据
interface LastCheckData {
  conversations: {
    [conversationId: string]: {
      lastMessageId: string;
      lastMessageTime: number;
    };
  };
  notifications: {
    lastNotificationId: string;
    lastCheckTime: number;
  };
}

class PollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private appState: AppStateStatus = 'active';
  private isRunning = false;
  private appStateSubscription: any = null; // AppState订阅
  private lastCheckData: LastCheckData = {
    conversations: {},
    notifications: {
      lastNotificationId: '',
      lastCheckTime: 0,
    },
  };
  private currentConversationId: string | null = null; // 当前打开的对话ID

  /**
   * 设置当前打开的对话ID（用于避免在当前对话中显示通知）
   */
  setCurrentConversationId(conversationId: string | null): void {
    this.currentConversationId = conversationId;
  }

  /**
   * 启动轮询服务
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ PollingService is already running');
      return;
    }

    console.log('🚀 Starting PollingService...');
    this.isRunning = true;

    // 获取当前应用状态
    this.appState = AppState.currentState;

    // 监听应用状态变化（新API返回订阅对象）
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // 初始化本地通知服务
    localNotificationService.initialize();
    localNotificationService.requestPermissions();

    // 立即执行一次检查
    this.checkForUpdates();

    // 开始轮询
    this.startPolling();
  }

  /**
   * 停止轮询服务
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping PollingService...');
    this.isRunning = false;

    // 清除定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // 移除应用状态监听（新API使用subscription.remove()）
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * 处理应用状态变化
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App has come to the foreground');
      // 应用回到前台时立即检查
      this.checkForUpdates();
    }

    this.appState = nextAppState;

    // 重新启动轮询以应用新的间隔
    if (this.isRunning) {
      this.startPolling();
    }
  };

  /**
   * 启动轮询
   */
  private startPolling(): void {
    // 清除现有定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // 根据应用状态选择轮询间隔
    const interval = this.getPollingInterval();

    // 设置新的定时器
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.checkForUpdates();
      }
    }, interval);

    console.log(`🔄 Polling started with interval: ${interval}ms (${this.appState})`);
  }

  /**
   * 获取轮询间隔
   */
  private getPollingInterval(): number {
    switch (this.appState) {
      case 'active':
        return POLLING_INTERVALS.ACTIVE;
      case 'background':
        return POLLING_INTERVALS.BACKGROUND;
      case 'inactive':
      default:
        return POLLING_INTERVALS.INACTIVE;
    }
  }

  /**
   * 检查更新（新消息和新通知）
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('🔍 Checking for updates...');

      // 并行检查新消息和新通知
      await Promise.all([
        this.checkForNewMessages(),
        this.checkForNewNotifications(),
      ]);
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
    }
  }

  /**
   * 检查新消息
   */
  private async checkForNewMessages(): Promise<void> {
    try {
      // 获取所有对话
      const conversations = await messagesService.getConversations();

      for (const conversation of conversations) {
        // 跳过当前打开的对话（避免重复通知）
        if (conversation.id === this.currentConversationId) {
          continue;
        }

        // 检查是否有新消息
        const hasNewMessage = await this.checkConversationForNewMessages(conversation.id);

        if (hasNewMessage && conversation.unread) {
          // 获取对话的最新消息详情
          try {
            const conversationDetail = await messagesService.getMessages(conversation.id);
            const messages = conversationDetail.messages || [];
            
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              
              // 显示通知
              await localNotificationService.showMessageNotification({
                title: conversation.sender,
                body: lastMessage.text || '新消息',
                conversationId: conversation.id,
                userId: lastMessage.senderInfo?.id?.toString(),
                username: lastMessage.senderInfo?.username,
              });
            }
          } catch (error) {
            console.error(`❌ Error fetching messages for conversation ${conversation.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new messages:', error);
    }
  }

  /**
   * 检查对话是否有新消息
   */
  private async checkConversationForNewMessages(conversationId: string): Promise<boolean> {
    try {
      const conversationDetail = await messagesService.getMessages(conversationId);
      const messages = conversationDetail.messages || [];

      if (messages.length === 0) {
        return false;
      }

      const lastMessage = messages[messages.length - 1];
      const lastCheck = this.lastCheckData.conversations[conversationId];

      // 如果是第一次检查，记录当前状态
      if (!lastCheck) {
        this.lastCheckData.conversations[conversationId] = {
          lastMessageId: lastMessage.id,
          lastMessageTime: new Date(lastMessage.time || Date.now()).getTime(),
        };
        return false; // 首次检查不通知
      }

      // 检查是否有新消息
      if (lastMessage.id !== lastCheck.lastMessageId) {
        // 更新记录
        this.lastCheckData.conversations[conversationId] = {
          lastMessageId: lastMessage.id,
          lastMessageTime: new Date(lastMessage.time || Date.now()).getTime(),
        };
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error checking conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * 检查新通知
   */
  private async checkForNewNotifications(): Promise<void> {
    try {
      const notifications = await notificationService.getNotifications();
      const unreadNotifications = notifications.filter(n => !n.isRead);

      if (unreadNotifications.length === 0) {
        return;
      }

      // 获取最新的未读通知
      const latestNotification = unreadNotifications[0];

      // 检查是否已经通知过
      const lastCheck = this.lastCheckData.notifications;
      if (latestNotification.id === lastCheck.lastNotificationId) {
        return; // 已经通知过
      }

      // 显示通知
      await localNotificationService.showNotification({
        title: latestNotification.title,
        body: latestNotification.message || '',
        type: latestNotification.type,
        notificationId: latestNotification.id,
        orderId: latestNotification.orderId,
        listingId: latestNotification.listingId,
        userId: latestNotification.userId,
      });

      // 更新记录
      this.lastCheckData.notifications = {
        lastNotificationId: latestNotification.id,
        lastCheckTime: Date.now(),
      };
    } catch (error) {
      console.error('❌ Error checking for new notifications:', error);
    }
  }

  /**
   * 手动触发检查（用于测试或立即刷新）
   */
  async triggerCheck(): Promise<void> {
    await this.checkForUpdates();
  }

  /**
   * 重置检查数据（用于登出或重置状态）
   */
  reset(): void {
    this.lastCheckData = {
      conversations: {},
      notifications: {
        lastNotificationId: '',
        lastCheckTime: 0,
      },
    };
    this.currentConversationId = null;
    console.log('✅ PollingService data reset');
  }
}

export const pollingService = new PollingService();

