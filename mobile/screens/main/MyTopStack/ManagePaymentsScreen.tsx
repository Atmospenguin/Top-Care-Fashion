import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../../../components/Header';
import Icon from '../../../components/Icon';
import PaymentSelector from '../../../components/PaymentSelector';
import { 
  paymentMethodsService, 
  addressService,
  type PaymentMethod,
  type ShippingAddress,
  type CreateAddressRequest,
} from '../../../src/services';
import type { MyTopStackParamList } from './index';

type ManagePaymentsScreenNavigationProp = NativeStackNavigationProp<
  MyTopStackParamList,
  'ManagePayments'
>;

export default function ManagePaymentsScreen() {
  const navigation = useNavigation<ManagePaymentsScreenNavigationProp>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Address states
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [selectedAddressForAction, setSelectedAddressForAction] = useState<ShippingAddress | null>(null);
  
  // Address form state
  const [addressForm, setAddressForm] = useState<CreateAddressRequest>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false,
  });

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      isDefault: false,
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!addressForm.name || !addressForm.phone || !addressForm.line1 || !addressForm.city || 
        !addressForm.state || !addressForm.country || !addressForm.postalCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingAddress) {
        // Update existing address
        await addressService.updateAddress(editingAddress.id, addressForm);
      } else {
        // Create new address
        await addressService.createAddress(addressForm);
      }
      
      setShowAddressModal(false);
      loadAddresses();
      Alert.alert('Success', `Address ${editingAddress ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Failed to save address:', error);
      Alert.alert('Error', `Failed to ${editingAddress ? 'update' : 'add'} address`);
    }
  };

  const handleAddressPress = (address: ShippingAddress) => {
    setSelectedAddressForAction(address);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit address', 'Remove address'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEditAddress(address);
          } else if (buttonIndex === 2) {
            handleDeleteAddress(address);
          }
        }
      );
    } else {
      // For Android, show custom modal
      Alert.alert(
        'Manage Address',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit address', onPress: () => handleEditAddress(address) },
          { 
            text: 'Remove address', 
            onPress: () => handleDeleteAddress(address),
            style: 'destructive'
          },
        ]
      );
    }
  };

  const handleDeleteAddress = async (address: ShippingAddress) => {
    try {
      await addressService.deleteAddress(address.id);
      loadAddresses();
      Alert.alert('Success', 'Address removed successfully');
    } catch (error) {
      console.error('Failed to delete address:', error);
      Alert.alert('Error', 'Failed to remove address');
    }
  };

  const defaultAddress = addresses.find(addr => addr.isDefault);
  const otherAddresses = addresses.filter(addr => !addr.isDefault);

  const formatAddress = (address: ShippingAddress) => {
    const parts = [address.line1];
    if (address.line2) parts[0] += ` ${address.line2}`;
    parts.push(`${address.city}, ${address.postalCode}, ${address.country.toUpperCase()}`);
    return parts.join(' ');
  };

  return (
    <View style={styles.container}>
      <Header title="Payment and Address" showBack />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Payment Method Section */}
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

        {/* Address Section */}
        <View style={styles.divider} />

        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <Icon name="add-circle" size={24} color="#0066FF" />
          <Text style={styles.addButtonText}>Add shipping address</Text>
        </TouchableOpacity>

        {loadingAddresses ? (
          <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
        ) : (
          <>
            {/* Default Return Address */}
            {defaultAddress && (
              <View style={styles.addressSection}>
                <View style={styles.addressSectionHeader}>
                  <Text style={styles.addressSectionTitle}>Default Return Address</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Info', 'Your default shipping and return address')}>
                    <Icon name="information-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addressCard}
                  onPress={() => handleAddressPress(defaultAddress)}
                >
                  <Text style={styles.addressName}>{defaultAddress.name}</Text>
                  <Text style={styles.addressText}>{formatAddress(defaultAddress)}</Text>
                  <Text style={styles.addressPhone}>{defaultAddress.phone}</Text>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* All Shipping Addresses */}
            {otherAddresses.length > 0 && (
              <View style={styles.addressSection}>
                <View style={styles.addressSectionHeader}>
                  <Text style={styles.addressSectionTitle}>All Shipping Addresses</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Info', 'All your saved shipping addresses')}>
                    <Icon name="information-circle-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {otherAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressCard}
                    onPress={() => handleAddressPress(address)}
                  >
                    <Text style={styles.addressName}>{address.name}</Text>
                    <Text style={styles.addressText}>{formatAddress(address)}</Text>
                    <Text style={styles.addressPhone}>{address.phone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingAddress ? 'Edit' : 'Add'} Address</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={addressForm.name}
              onChangeText={(text) => setAddressForm({ ...addressForm, name: text })}
              placeholder="Enter your full name"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={addressForm.phone}
              onChangeText={(text) => setAddressForm({ ...addressForm, phone: text })}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.line1}
                  onChangeText={(text) => setAddressForm({ ...addressForm, line1: text })}
                  placeholder="Street Address"
                />
              </View>
              <View style={styles.smallInput}>
                <Text style={styles.inputLabel}>Apt/Suite</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.line2}
                  onChangeText={(text) => setAddressForm({ ...addressForm, line2: text })}
                  placeholder=""
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.city}
                  onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                  placeholder="City"
                />
              </View>
              <View style={styles.smallInput}>
                <Text style={styles.inputLabel}>State/Prov.</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.state}
                  onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
                  placeholder="AL"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.country}
                  onChangeText={(text) => setAddressForm({ ...addressForm, country: text })}
                  placeholder="Country"
                />
              </View>
              <View style={styles.smallInput}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={addressForm.postalCode}
                  onChangeText={(text) => setAddressForm({ ...addressForm, postalCode: text })}
                  placeholder="12345"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <Text style={styles.checkboxLabel}>
                Make this my Default Return Address for shipping
              </Text>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAddressForm({ ...addressForm, isDefault: !addressForm.isDefault })}
              >
                {addressForm.isDefault && (
                  <Icon name="checkmark" size={20} color="#0066FF" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
              <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  loader: {
    marginVertical: 20,
  },
  addressSection: {
    marginBottom: 24,
  },
  addressSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addressSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  addressCard: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  defaultBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    lineHeight: 16,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  smallInput: {
    width: 100,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    marginRight: 12,
  },
  checkbox: {
    width: 50,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#0066FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
