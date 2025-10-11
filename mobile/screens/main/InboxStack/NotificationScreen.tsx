import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import Header from "../../../components/Header";
import ASSETS from "../../../constants/assetUrls";

const mockNotifications = [
  {
    id: "n1",
    type: "like",
    title: "@summer liked your listing",
    message: "Vintage Denim Jacket",
    image: "https://i.pravatar.cc/100?img=5",
    time: "2h ago",
  },
  {
    id: "n2",
    type: "orderPaid",
    title: "Buyer @alex has paid",
    message: "Please ship your item soon.",
    image: "https://i.pravatar.cc/100?img=12",
    time: "5h ago",
  },
  {
    id: "n3",
    type: "shipped",
    title: "Seller @mike has shipped your parcel",
    time: "1d ago",
  },
];

export default function NotificationScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Notifications" showBack bgColor="#F54B3D" textColor="#fff" iconColor="#fff" />
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Image
              source={item.image ? { uri: item.image } : ASSETS.avatars.default}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
});
