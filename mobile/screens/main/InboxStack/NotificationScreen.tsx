import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";
import { notificationService, type Notification } from "../../../src/services/notificationService";
import Avatar from "../../../components/Avatar";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      console.log("🔔 Loading notifications...");
      
      const fetchedNotifications = await notificationService.getNotifications();
      setNotifications(fetchedNotifications);
      
      console.log("🔔 Loaded", fetchedNotifications.length, "notifications");
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
      Alert.alert("Error", "Failed to load notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // 标记为已读
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        
        // 更新本地状态
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true }
              : n
          )
        );
      }

      // 根据通知类型进行不同的导航
      switch (notification.type) {
        case 'order':
          // 可以导航到订单详情
          console.log("Navigate to order:", notification.orderId);
          break;
        case 'like':
        case 'review':
          // 可以导航到商品详情
          console.log("Navigate to listing:", notification.listingId);
          break;
        case 'follow':
          // 可以导航到用户资料
          console.log("Navigate to user profile:", notification.userId);
          break;
        default:
          console.log("Notification pressed:", notification.title);
      }
    } catch (error) {
      console.error("❌ Error handling notification press:", error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleNotificationPress(item)}
    >
      <Avatar
        source={item.image ? { uri: item.image } : ASSETS.avatars.default}
        style={styles.avatar}
        isPremium={item.isPremiumUser}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        {item.message ? (
          <Text style={styles.message}>{item.message}</Text>
        ) : null}
        <Text style={styles.time}>{item.time}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header title="Notifications" showBack bgColor="#F54B3D" textColor="#fff" iconColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F54B3D" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Notifications" showBack bgColor="#F54B3D" textColor="#fff" iconColor="#fff" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates about orders, likes, and follows here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f2f2",
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  unreadTitle: {
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F54B3D",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
