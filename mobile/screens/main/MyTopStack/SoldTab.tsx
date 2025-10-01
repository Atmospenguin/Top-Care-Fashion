import React from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";

const soldItems = [
  {
    id: "1",
    uri: "https://th.bing.com/th/id/R.d54043fa984e94c86b926d96ed3eb6a1?rik=l0s2kAsoEoM6Og&pid=ImgRaw&r=0",
  },
  {
    id: "2",
    uri: "https://i5.walmartimages.com/asr/7aed82da-69af-46b8-854e-5c22d45a4df3.e7011d0ebdea1d9fabb68417c789ae16.jpeg",
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

export default function SoldTab() {
  return (
    <View style={{ flex: 1 }}>
      {/* Filter 区域 */}
      <View style={styles.filterRow}>
        <Text style={styles.filterBtn}>All ▼</Text>
      </View>

      {/* 商品网格 */}
      <FlatList
        data={formatData([...soldItems], 3)}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) =>
          item.empty ? (
            <View style={[styles.item, styles.itemInvisible]} />
          ) : (
            <View style={styles.item}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>SOLD</Text>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  overlayText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
