import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Icon from "./Icon";

type HeaderProps = {
  title: string;
  showBack?: boolean; // 默认 false
  onBackPress?: () => void;
  rightAction?: React.ReactNode; // 右侧自定义按钮
};

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightAction,
}) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
      <View style={styles.header}>
        {/* 左侧返回按钮 */}
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBackPress || (() => navigation.goBack())}
          >
            <Icon name="arrow-back" size={26} color="black" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        {/* 标题 */}
        <Text style={styles.title}>{title}</Text>

        {/* 右侧按钮 */}
        <View style={styles.right}>{rightAction}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  backBtn: {
    padding: 6,
  },
  backBtnPlaceholder: {
    width: 26, // 占位，保持标题居中
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  right: {
    minWidth: 26,
    alignItems: "flex-end",
  },
});

export default Header;
