import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MyTopStackParamList } from "./index";

const soldItems = [
  {
    id: "1",
    uri: "https://th.bing.com/th/id/R.d54043fa984e94c86b926d96ed3eb6a1?rik=l0s2kAsoEoM6Og&pid=ImgRaw&r=0",
    status: "To Ship",
  },
  {
    id: "2",
    uri: "https://i5.walmartimages.com/asr/7aed82da-69af-46b8-854e-5c22d45a4df3.e7011d0ebdea1d9fabb68417c789ae16.jpeg",
    status: "Completed",
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

export default function SoldTab() {
  const [filter, setFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  // 根据 filter 筛选
  const filtered = soldItems.filter((item) =>
    filter === "All" ? true : item.status === filter
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Filter 按钮 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ fontSize: 16 }}>{filter} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Modal 下拉框 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Picker
              selectedValue={filter}
              onValueChange={(val) => {
                setFilter(val);
                setModalVisible(false);
              }}
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="To Ship" value="To Ship" />
              <Picker.Item label="In Transit" value="In Transit" />
              <Picker.Item label="Cancelled" value="Cancelled" />
              <Picker.Item label="Completed" value="Completed" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* 商品网格 */}
      <FlatList
        data={formatData([...filtered], 3)}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) =>
          item.empty ? (
            <View style={[styles.item, styles.itemInvisible]} />
          ) : (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
            >
              <Image source={{ uri: item.uri }} style={styles.image} />
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>SOLD</Text>
              </View>
            </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalBox: {
    backgroundColor: "#fff",
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

