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
import { SOLD_GRID_ITEMS } from "../../../mocks/shop";

// Ensure three-column grid alignment
function formatData(data: any[], numColumns: number) {
  const newData = [...data];
  const numberOfFullRows = Math.floor(newData.length / numColumns);
  let numberOfElementsLastRow = newData.length - numberOfFullRows * numColumns;
  while (
    numberOfElementsLastRow !== numColumns &&
    numberOfElementsLastRow !== 0
  ) {
    newData.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
    numberOfElementsLastRow++;
  }
  return newData;
}

export default function SoldTab() {
  const [filter, setFilter] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  const filterLabels: Record<string, string> = {
    All: "All",
    ToShip: "To Ship",
    InTransit: "In Transit",
    Cancelled: "Cancelled",
    Completed: "Completed",
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<MyTopStackParamList>>();

  // Filter data based on status
  const filtered = SOLD_GRID_ITEMS.filter((item) =>
    filter === "All" ? true : item.status === filter
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Filter button */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ fontSize: 16, fontWeight: '500' }}>{filterLabels[filter] ?? filter} ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
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
              <Picker.Item label="To Ship" value="ToShip" />
              <Picker.Item label="In Transit" value="InTransit" />
              <Picker.Item label="Cancelled" value="Cancelled" />
              <Picker.Item label="Completed" value="Completed" />
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Item grid */}
      <FlatList
        data={formatData(filtered, 3)}
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
                navigation.navigate("OrderDetail", { id: item.id, source: "sold" });
              }}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
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

