import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../../../components/Header';
import Icon from '../../../components/Icon';
import PaymentSelector from '../../../components/PaymentSelector';
import { paymentMethodsService, type PaymentMethod } from '../../../src/services';
import type { MyTopStackParamList } from './index';

type ManagePaymentsScreenNavigationProp = NativeStackNavigationProp<
  MyTopStackParamList,
  'ManagePayments'
>;

export default function ManagePaymentsScreen() {
  const navigation = useNavigation<ManagePaymentsScreenNavigationProp>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  return (
    <View style={styles.container}>
      <Header title="Payment Methods" showBack />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Manage your saved payment methods for quick and secure checkout.
        </Text>

        <PaymentSelector
          selectedPaymentMethodId={selectedPaymentMethod?.id ?? null}
          onSelect={setSelectedPaymentMethod}
        />

        {selectedPaymentMethod && (
          <View style={styles.selectedInfo}>
            <Icon name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.selectedText}>
              {selectedPaymentMethod.label} is selected
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  selectedInfo: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
});
