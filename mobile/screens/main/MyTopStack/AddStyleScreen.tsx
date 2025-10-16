import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import Header from "../../../components/Header";
import Icon from "../../../components/Icon";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 两列卡片留边距

const STYLES = [
  {
    name: "Streetwear",
    img: "https://tse1.mm.bing.net/th/id/OIP.VzaAIQ7keKtETkQY3XiR7QHaLG?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    name: "90s/Y2K",
    img: "https://image-cdn.hypb.st/https://hypebeast.com/image/2023/05/diesel-resort-2024-collection-008.jpg?q=75&w=800&cbr=1&fit=max",
  },
  {
    name: "Vintage",
    img: "https://cdn.mos.cms.futurecdn.net/whowhatwear/posts/291781/vintage-inspired-fashion-brands-291781-1614100119475-image-768-80.jpg",
  },
  {
    name: "Sportswear",
    img: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/734a943f-8d74-4841-be22-e6076816ea44/sportswear-tech-fleece-windrunner-mens-full-zip-hoodie-rznlBf.png",
  },
  {
    name: "Independent Brands",
    img: "https://tse3.mm.bing.net/th/id/OIP.zfm0Md_lr-4tMhh7v1W6vAHaKC?cb=12&w=756&h=1024&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    name: "Luxury Designer",
    img: "https://www.chanel.com/us/img/t_one/q_auto:good,f_auto,fl_lossy,dpr_1.2/w_1920/prd-emea/sys-master-content-hfe-h6e-9980941336606look-003-spring-summer-2023-chanel-show.jpg",
  },
];

type AddStyleNav = NativeStackNavigationProp<MyTopStackParamList, "AddStyle">;
type AddStyleRoute = RouteProp<MyTopStackParamList, "AddStyle">;

export default function AddStyleScreen() {
  const navigation = useNavigation<AddStyleNav>();
  const route = useRoute<AddStyleRoute>();
  const initialSelected = useMemo(
    () => route.params?.selectedStyles ?? [],
    [route.params]
  );
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggleSelect = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter((n) => n !== name));
    } else if (selected.length < 3) {
      setSelected([...selected, name]);
    }
  };

  const remaining = 3 - selected.length;
  const tipText =
    remaining > 0
      ? `Pick ${remaining} more style${remaining > 1 ? "s" : ""}`
      : "You’re all set";

  const handleSave = () => {
    navigation.navigate("MyPreference", { selectedStyles: selected });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Styles" showBack />

      <FlatList
        data={STYLES}
        numColumns={2}
        keyExtractor={(item) => item.name}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Text style={styles.subtitle}>
            We’ll use this info to recommend items to you
          </Text>
        )}
        ListFooterComponent={() => (
          <Text style={styles.tipText}>{tipText}</Text>
        )}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.name);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => toggleSelect(item.name)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.img }}
                style={[styles.image, isSelected && { opacity: 0.4 }]}
              />
              {isSelected && (
                <View style={styles.heartOverlay}>
                  <Icon name="heart" size={36} color="#fff" />
                </View>
              )}
              <Text style={styles.styleName}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* 底部 Save 按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: selected.length > 0 ? "#000" : "#ccc" }]}
          disabled={selected.length === 0}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    textAlign: "center",
    color: "#444",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f6f6f6",
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    borderRadius: 10,
  },
  styleName: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    marginVertical: 8,
    color: "#111",
  },
  heartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tipText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  saveBtn: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
