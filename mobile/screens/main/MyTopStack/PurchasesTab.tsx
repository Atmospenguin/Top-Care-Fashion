import React from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";

const purchasesItems = [
  {
    id: "1",
    uri: "https://cdn.shopify.com/s/files/1/0281/2071/1254/products/191219hm74370_1800x1800.jpg?v=1607871412",
  },
  {
    id: "2",
    uri: "https://tse4.mm.bing.net/th/id/OIP.TC_mOkLd6sQzsLiE_uSloQHaJ3?w=600&h=799&rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    id: "3",
    uri: "https://assets.atmos-tokyo.com/items/L/pnef21ke11-ppl-1.jpg",
  },
];

// 保证三列对齐（不足补空位）
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

export default function PurchasesTab() {
  return (
    <View style={{ flex: 1 }}>
      {/* Filter 区域 */}
      <View style={styles.filterRow}>
        <Text style={styles.filterBtn}>All ▼</Text>
      </View>

      {/* 商品网格 */}
      <FlatList
        data={formatData([...purchasesItems], 3)}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) =>
          item.empty ? (
            <View style={[styles.item, styles.itemInvisible]} />
          ) : (
            <View style={styles.item}>
              <Image source={{ uri: item.uri }} style={styles.image} />
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
});
