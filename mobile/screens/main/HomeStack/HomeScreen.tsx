// mobile/screens/main/HomeStack/HomeScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabView } from "react-native-tab-view";

import Icon from "../../../components/Icon";
import type { HomeStackParamList } from "./index";
import FeedList, { type FeedListRef } from "./FeedList";

type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Sell: undefined;
  Inbox: undefined;
  "My TOP": any;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, "HomeMain">>();
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "foryou", title: "For You" },
    { key: "trending", title: "Trending" },
  ]);

  // Refs for both feed lists
  const forYouRef = useRef<FeedListRef>(null);
  const trendingRef = useRef<FeedListRef>(null);

  // Animation for hiding/showing top bar
  const scrollY = useRef(new Animated.Value(0)).current;
  const prevScrollY = useRef(0);
  const [topBarVisible, setTopBarVisible] = useState(true);

  // Handle scroll position changes
  const handleScroll = (offset: number) => {
    const diff = offset - prevScrollY.current;

    // Scrolling down - hide top bar
    if (diff > 0 && offset > 100 && topBarVisible) {
      setTopBarVisible(false);
      Animated.timing(scrollY, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // Scrolling up - show top bar
    else if (diff < 0 && !topBarVisible) {
      setTopBarVisible(true);
      Animated.timing(scrollY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // At top - always show
    else if (offset < 50 && !topBarVisible) {
      setTopBarVisible(true);
      Animated.timing(scrollY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    prevScrollY.current = offset;
  };

  // Calculate exact top bar height: paddingVertical(8*2) + text(~20) + border(1) + tabIndicator(3+6) + some margin
  const TOP_BAR_HEIGHT = 63;
  const TOTAL_HIDE_DISTANCE = TOP_BAR_HEIGHT + insets.top; // Hide completely above notch

  const topBarTranslateY = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -TOTAL_HIDE_DISTANCE],
  });

  // Handle tab press: refresh if at top, scroll to top if not
  useEffect(() => {
    const tabPressTS = (route.params as any)?.tabPressTS;
    if (!tabPressTS) return;

    const currentRef = index === 0 ? forYouRef : trendingRef;
    const scrollOffset = currentRef.current?.getScrollOffset() ?? 0;
    const isAtTop = scrollOffset < 50;

    if (isAtTop) {
      // At top, refresh data
      currentRef.current?.refresh();
    } else {
      // Not at top, scroll to top
      currentRef.current?.scrollToTop();
    }
  }, [(route.params as any)?.tabPressTS]);

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case "foryou":
        return <FeedList ref={forYouRef} mode="foryou" onScroll={handleScroll} />;
      case "trending":
        return <FeedList ref={trendingRef} mode="trending" onScroll={handleScroll} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        {/* Animated white background for notch area - moves with top bar */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: "#fff",
            zIndex: 9,
            transform: [{ translateY: topBarTranslateY }],
          }}
        />

        {/* Custom Tab Bar - Animated and absolute positioned */}
        <Animated.View
          style={[
            styles.topNav,
            {
              top: insets.top,
              transform: [{ translateY: topBarTranslateY }],
            },
          ]}
        >
          <View style={styles.tabsContainer}>
            {routes.map((route, i) => {
              const isActive = index === i;
              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.tabButton}
                  onPress={() => setIndex(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {route.title}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
              parent?.navigate("Discover");
            }}
            activeOpacity={0.7}
          >
            <Icon name="search" size={24} color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Content - No default tab bar */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          swipeEnabled={true}
          lazy={true}
          lazyPreloadDistance={0}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "center",
    gap: 32,
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  tabIndicator: {
    marginTop: 6,
    width: 32,
    height: 3,
    backgroundColor: "#000",
    borderRadius: 1.5,
  },
  searchButton: {
    padding: 8,
    position: "absolute",
    right: 12,
  },
});
