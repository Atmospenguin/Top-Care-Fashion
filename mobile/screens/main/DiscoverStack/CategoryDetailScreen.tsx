import React, { useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import Header from "../../../components/Header";
import { listingsService, type CategoryData } from "../../../src/services/listingsService";
import type { DiscoverStackParamList } from "./index";

type CategoryDetailRoute = RouteProp<DiscoverStackParamList, "CategoryDetail">;

type GenderKey = "men" | "women" | "unisex";

export default function CategoryDetailScreen() {
  const { params } = useRoute<CategoryDetailRoute>();
  const { gender, mainCategory } = params;
  
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

  const subcategories = useMemo(() => {
    if (!categories || !categories[gender] || !categories[gender][mainCategory]) {
      return [];
    }
    return categories[gender][mainCategory];
  }, [categories, gender, mainCategory]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={mainCategory}
          showBack
          bgColor="#fff"
          textColor="#000"
          iconColor="#111"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B21B6" />
          <Text style={styles.loadingText}>Loading subcategories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header
          title={mainCategory}
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
        title={mainCategory}
        showBack
        bgColor="#fff"
        textColor="#000"
        iconColor="#111"
      />
      {subcategories.map((item) => (
        <TouchableOpacity key={item} style={styles.item}>
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      ))}
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
