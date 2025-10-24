import React, { useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import { listingsService, type CategoryData } from "../../../src/services/listingsService";
import type { BuyStackParamList } from "../BuyStack";
import type { DiscoverStackParamList } from "./index";

type DiscoverNavigation = NativeStackNavigationProp<DiscoverStackParamList>;
type DiscoverCategoryRoute = RouteProp<DiscoverStackParamList, "DiscoverCategory">;

type Gender = "men" | "women" | "unisex";

export default function DiscoverCategoryScreen() {
  const navigation = useNavigation<DiscoverNavigation & any>();
  const { params } = useRoute<DiscoverCategoryRoute>();
  const { gender } = params;
  
  const [categories, setCategories] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await listingsService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = useMemo(() => {
    if (!categories || !categories[gender]) {
      return [] as string[];
    }
    return Object.keys(categories[gender]);
  }, [categories, gender]);

  const headerTitle = gender === "men" ? "Men" : gender === "women" ? "Women" : "Unisex";

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={headerTitle}
          showBack
          bgColor="#fff"
          textColor="#000"
          iconColor="#111"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header
          title={headerTitle}
          showBack
          bgColor="#fff"
          textColor="#000"
          iconColor="#111"
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={headerTitle}
        showBack
        bgColor="#fff"
        textColor="#000"
        iconColor="#111"
      />
      {mainCategories.map((category) => {
        const label = category.replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <TouchableOpacity
            key={category}
            style={styles.item}
            onPress={() =>
              navigation
                .getParent()
                ?.getParent()
                ?.navigate('Buy', {
                  screen: 'SearchResult',
                  params: { query: category },
                })
            }
          >
            <Text style={styles.text}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  text: { fontSize: 17, color: "#111" },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B21B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
