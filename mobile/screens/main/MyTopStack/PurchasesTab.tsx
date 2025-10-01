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
import type { MyTopStackParamList } from "./index"; // 确保路径正确

const purchasesItems = [
  {
    id: "1",
    uri: "https://cdn.shopify.com/s/files/1/0281/2071/1254/products/191219hm74370_1800x1800.jpg?v=1607871412",
    status: "InProgress",
  },
  {
    id: "2",
    uri: "https://tse4.mm.bing.net/th/id/OIP.TC_mOkLd6sQzsLiE_uSloQHaJ3?w=600&h=799&rs=1&pid=ImgDetMain&o=7&rm=3",
    status: "Completed",
  },
  {
    id: "3",
    uri: "https://assets.atmos-tokyo.com/items/L/pnef21ke11-ppl-1.jpg",
    status: "Cancelled",
  },
];

export default function PurchasesTab() {
  const [filter, setFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  // 根据 filter 筛选
  const filtered = purchasesItems.filter((p) =>
    filter === "All" ? true : p.status === filter
  );

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
              <Picker.Item label="In Progress" value="InProgress" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Cancelled" value="Cancelled" />
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
              onPress={() => {
                if (!item.id) return;
                navigation.navigate("OrderDetail", { id: item.id, source: "purchase" });
              }}
            >
              <Image source={{ uri: item.uri }} style={styles.image} />
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
});
