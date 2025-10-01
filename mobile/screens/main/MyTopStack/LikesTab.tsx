import React from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import Icon from "../../../components/Icon"; // 用你封装的 Ionicons

const likedItems = [
  {
    id: "1",
    uri: "https://tse1.mm.bing.net/th/id/OIP._PU2jbpd_bGX-M3WoLm6IAHaLe?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    id: "2",
    uri: "https://tse3.mm.bing.net/th/id/OIP.mbv8-A49xgbIH4hkKjhCBwHaJc?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    id: "3",
    uri: "https://y2kdream.com/cdn/shop/files/Y2K-Football-Crop-Top-6.webp?v=1723621579&width=750",
  },
  {
    id: "4",
    uri: "https://tse3.mm.bing.net/th/id/OIP.81YGmCDrRsgih3_rHL6qxgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    id: "5",
    uri: "https://tse3.mm.bing.net/th/id/OIP.VLA_zUUPCS-z2IemiQ43PgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
];

// 保证三列对齐
function formatData(data: any[], numColumns: number) {
  const numberOfFullRows = Math.floor(data.length / numColumns);
  let numberOfElementsLastRow = data.length - numberOfFullRows * numColumns;

  while (
    numberOfElementsLastRow !== numColumns &&
    numberOfElementsLastRow !== 0
  ) {
    data.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }
  return data;
}

export default function LikesTab() {
  return (
    <View style={{ flex: 1 }}>
      {/* Filter 区域 */}
      <View style={styles.filterRow}>
        <Text style={styles.filterBtn}>All ▼</Text>
      </View>

      {/* 图片网格 */}
      <FlatList
        data={formatData([...likedItems], 3)}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) =>
          item.empty ? (
            <View style={[styles.item, styles.itemInvisible]} />
          ) : (
            <View style={styles.item}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {/* ❤️ 喜欢标记 */}
              <View style={styles.heartIcon}>
                <Icon name="heart" size={20} color="red" />
              </View>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterBtn: {
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  item: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    position: "relative",
  },
  itemInvisible: {
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  heartIcon: {
    position: "absolute",
    right: 6,
    bottom: 6,
  },
});
