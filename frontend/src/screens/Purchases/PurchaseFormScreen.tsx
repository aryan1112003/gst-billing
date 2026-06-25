import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { purchasesAPI, vendorsAPI, itemsAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export const PurchaseFormScreen: React.FC = ({ navigation, route }: any) => {
  const { purchaseId } = route.params || {};
  const { isMobile, isTablet, rs } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  // Form fields
  const [vendorId, setVendorId] = useState('');
  const [selectedVendorName, setSelectedVendorName] = useState('Select Vendor');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [eWayBillNumber, setEWayBillNumber] = useState('');
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState('');
  const [purchaseInvoiceDate, setPurchaseInvoiceDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [status, setStatus] = useState('pending');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [vendorMenuVisible, setVendorMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [placeMenuVisible, setPlaceMenuVisible] = useState(false);
  const [itemMenuVisible, setItemMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [taxMenuVisible, setTaxMenuVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchVendors();
    fetchItems();
    if (purchaseId) {
      fetchPurchase();
    }
  }, [purchaseId]);

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll({ limit: 100 });
      const vendorsData = response.data || [];
      console.log('Fetched vendors:', vendorsData);
      setVendors(vendorsData);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      // Set empty array on error so form still works
      setVendors([]);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll({ limit: 100 });
      const itemsData = response.data || response.items || [];
      console.log('Fetched items:', itemsData);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      // Set empty array on error so form still works
      setItems([]);
    }
  };

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await purchasesAPI.getById(purchaseId);
      const purchase = response.data?.purchase || response.data || response;

      console.log('Fetched purchase data:', purchase);

      if (!purchase || !purchase.purchase_date && !purchase.purchaseDate && !purchase.id) {
        throw new Error('No purchase data received');
      }
      
      // Set basic fields with safe fallbacks
      setVendorId(String(purchase.vendor_id || purchase.vendorId || ''));
      setSelectedVendorName(purchase.vendor_name || 'Select Vendor');
      setPurchaseDate(purchase.purchase_date || purchase.purchaseDate || new Date().toISOString().split('T')[0]);
      setExpectedDate(purchase.expected_date || purchase.expectedDate || '');
      setStatus(purchase.status || 'pending');
      setNotes(purchase.notes || '');
      
      // Set new fields with safe fallbacks
      setPlaceOfSupply(purchase.place_of_supply || purchase.placeOfSupply || '');
      setEWayBillNumber(purchase.eway_bill_number || purchase.eWayBillNumber || '');
      setPurchaseInvoiceNumber(purchase.purchase_invoice_number || purchase.purchaseInvoiceNumber || '');
      setPurchaseInvoiceDate(purchase.purchase_invoice_date || purchase.purchaseInvoiceDate || '');
      setTermsConditions(purchase.terms_conditions || purchase.termsConditions || '');
      
      // Map line items with safe fallbacks
      const lineItemsArray = purchase.line_items || purchase.lineItems || [];
      const mappedLineItems = Array.isArray(lineItemsArray) ? lineItemsArray.map((item: any) => ({
        id: String(item.id || Date.now()),
        itemId: String(item.item_id || item.itemId || ''),
        itemName: item.item_name || item.itemName || '',
        description: item.description || '',
        hsnSac: item.hsn_sac || item.hsnSac || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unit_price || item.unitPrice || item.unit_cost || item.unitCost) || 0,
        discount: Number(item.discount_rate || item.discount) || 0,
        taxRate: Number(item.tax_rate || item.taxRate) || 18,
        total: Number(item.total_amount || item.total) || 0,
      })) : [];
      
      setLineItems(mappedLineItems);
      console.log('Mapped line items:', mappedLineItems);
    } catch (err: any) {
      console.error('Error fetching purchase:', err);
      Alert.alert('Error', `Failed to load purchase order: ${err.message}`);
      // Don't leave the screen blank - navigate back
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
  ];

  const taxRates = [0, 5, 12, 18, 28];

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      description: '',
      hsnSac: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate total when quantity, price, discount, or tax changes
        if (['quantity', 'unitPrice', 'discount', 'taxRate'].includes(field)) {
          const subtotal = updated.quantity * updated.unitPrice;
          const discountAmount = (subtotal * updated.discount) / 100;
          const afterDiscount = subtotal - discountAmount;
          const taxAmount = (afterDiscount * updated.taxRate) / 100;
          updated.total = afterDiscount + taxAmount;
        }
        
        if (field === 'itemId') {
          const selectedItem = items.find(i => String(i.id) === value);
          if (selectedItem) {
            updated.itemName = selectedItem.name;
            updated.description = selectedItem.description || '';
            updated.hsnSac = selectedItem.sku || '';
            updated.unitPrice = selectedItem.purchase_price || selectedItem.selling_price || 0;
            const subtotal = updated.quantity * updated.unitPrice;
            const discountAmount = (subtotal * updated.discount) / 100;
            const afterDiscount = subtotal - discountAmount;
            const taxAmount = (afterDiscount * updated.taxRate) / 100;
            updated.total = afterDiscount + taxAmount;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSave = async () => {
    // Validation
    if (!vendorId) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    if (lineItems.some(item => !item.itemId || item.quantity <= 0)) {
      Alert.alert('Error', 'Please fill all item details');
      return;
    }
    if (!purchaseInvoiceNumber) {
      Alert.alert('Error', 'Purchase Invoice Number is required');
      return;
    }
    if (!purchaseDate) {
      Alert.alert('Error', 'Purchase Invoice Date is required');
      return;
    }

    try {
      setLoading(true);
      const total = calculateTotal();
      const subtotalBeforeTax = lineItems.reduce((sum, item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const discountAmt = (lineSubtotal * item.discount) / 100;
        return sum + (lineSubtotal - discountAmt);
      }, 0);
      const taxAmountTotal = total - subtotalBeforeTax;
      const purchaseData = {
        vendorId,
        purchaseDate,
        expectedDate,
        status,
        notes,
        placeOfSupply,
        eWayBillNumber,
        purchaseInvoiceNumber,
        purchaseInvoiceDate,
        termsConditions,
        lineItems: lineItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitCost: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          total: item.total,
          description: item.description,
          hsnSac: item.hsnSac,
        })),
        subtotal: parseFloat(subtotalBeforeTax.toFixed(2)),
        taxAmount: parseFloat(taxAmountTotal.toFixed(2)),
        totalAmount: parseFloat(total.toFixed(2)),
      };

      if (purchaseId) {
        await purchasesAPI.update(purchaseId, purchaseData);
        Alert.alert('Success', 'Purchase order updated successfully!');
      } else {
        await purchasesAPI.create(purchaseData);
        Alert.alert('Success', 'Purchase order created successfully!');
      }
      // Navigate back and trigger refresh
      navigation.navigate('Purchases', { refresh: Date.now() });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  if (loading && purchaseId) {
    return (
      <MainLayout currentRoute="Purchases" onNavigate={handleNavigate}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentRoute="Purchases" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {purchaseId ? 'Edit Purchase Order' : 'New Purchase Order'}
          </Text>
        </View>

        <View style={[styles.form, {
          maxWidth: rs(undefined, 900, 1100) as any,
          alignSelf: 'center' as any,
          width: '100%',
        }]}>
          {/* Vendor Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Vendor *</Text>
            <Menu
              visible={vendorMenuVisible}
              onDismiss={() => setVendorMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setVendorMenuVisible(true)}
                >
                  <Text style={styles.dropdownText}>{selectedVendorName}</Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              }
            >
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <Menu.Item
                    key={vendor.id}
                    onPress={() => {
                      setVendorId(String(vendor.id));
                      setSelectedVendorName(vendor.name);
                      setVendorMenuVisible(false);
                    }}
                    title={vendor.name}
                  />
                ))
              ) : (
                <Menu.Item title="No vendors available" disabled />
              )}
            </Menu>
          </View>

          {/* Place of Supply */}
          <View style={styles.field}>
            <Text style={styles.label}>Place of Supply *</Text>
            <Menu
              visible={placeMenuVisible}
              onDismiss={() => setPlaceMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setPlaceMenuVisible(true)}
                >
                  <Text style={styles.dropdownText}>{placeOfSupply || 'Select State'}</Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              }
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {indianStates.map((state) => (
                  <Menu.Item
                    key={state}
                    onPress={() => {
                      setPlaceOfSupply(state);
                      setPlaceMenuVisible(false);
                    }}
                    title={state}
                  />
                ))}
              </ScrollView>
            </Menu>
          </View>

          {/* E-Way Bill Number */}
          <View style={styles.field}>
            <Text style={styles.label}>E-Way Bill Number</Text>
            <TextInput
              mode="outlined"
              value={eWayBillNumber}
              onChangeText={setEWayBillNumber}
              placeholder="Enter E-Way Bill Number"
              style={styles.input}
            />
          </View>

          {/* Purchase Invoice Number + Invoice Date row on tablet/desktop */}
          <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Purchase Invoice Number *</Text>
              <TextInput
                mode="outlined"
                value={purchaseInvoiceNumber}
                onChangeText={setPurchaseInvoiceNumber}
                placeholder="Enter Invoice Number"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Purchase Invoice Date *</Text>
              <TextInput
                mode="outlined"
                value={purchaseInvoiceDate}
                onChangeText={setPurchaseInvoiceDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>
          </View>

          {/* Purchase Date + Expected Delivery Date row on tablet/desktop */}
          <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12, marginTop: isMobile ? 0 : 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Purchase Date *</Text>
              <TextInput
                mode="outlined"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Expected Delivery Date</Text>
              <TextInput
                mode="outlined"
                value={expectedDate}
                onChangeText={setExpectedDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>
          </View>

          {/* Status */}
          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setStatusMenuVisible(true)}
                >
                  <Text style={styles.dropdownText}>
                    {status === 'draft' ? 'Draft' :
                     status === 'pending' ? 'Pending' :
                     status === 'received' ? 'Received' :
                     status === 'billed' ? 'Billed' :
                     status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => { setStatus('draft'); setStatusMenuVisible(false); }}
                title="Draft"
              />
              <Menu.Item
                onPress={() => { setStatus('pending'); setStatusMenuVisible(false); }}
                title="Pending"
              />
              <Menu.Item
                onPress={() => { setStatus('received'); setStatusMenuVisible(false); }}
                title="Received"
              />
              <Menu.Item
                onPress={() => { setStatus('billed'); setStatusMenuVisible(false); }}
                title="Billed"
              />
              <Menu.Item
                onPress={() => { setStatus('cancelled'); setStatusMenuVisible(false); }}
                title="Cancelled"
              />
            </Menu>
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity onPress={addLineItem} style={styles.addButton}>
                <MaterialIcons name="add" size={20} color={colors.primary.main} />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={styles.lineItemHeader}>
                  <Text style={styles.lineItemTitle}>Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                    <MaterialIcons name="delete" size={20} color={colors.error.main} />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Text style={styles.smallLabel}>Select Item *</Text>
                  <Menu
                    visible={itemMenuVisible[item.id] || false}
                    onDismiss={() => setItemMenuVisible({ ...itemMenuVisible, [item.id]: false })}
                    anchor={
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setItemMenuVisible({ ...itemMenuVisible, [item.id]: true })}
                      >
                        <Text style={styles.dropdownText}>
                          {item.itemName || 'Select Item'}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                      </TouchableOpacity>
                    }
                  >
                    {items.length > 0 ? (
                      items.map((i) => (
                        <Menu.Item
                          key={i.id}
                          onPress={() => {
                            updateLineItem(item.id, 'itemId', String(i.id));
                            setItemMenuVisible({ ...itemMenuVisible, [item.id]: false });
                          }}
                          title={i.name}
                        />
                      ))
                    ) : (
                      <Menu.Item title="No items available" disabled />
                    )}
                  </Menu>
                </View>

                {/* Description */}
                <View style={styles.field}>
                  <Text style={styles.smallLabel}>Description</Text>
                  <TextInput
                    mode="outlined"
                    value={item.description}
                    onChangeText={(value) => updateLineItem(item.id, 'description', value)}
                    placeholder="Item description"
                    style={styles.smallInput}
                  />
                </View>

                {/* HSN/SAC Code */}
                <View style={styles.field}>
                  <Text style={styles.smallLabel}>HSN/SAC Code</Text>
                  <TextInput
                    mode="outlined"
                    value={item.hsnSac}
                    onChangeText={(value) => updateLineItem(item.id, 'hsnSac', value)}
                    placeholder="HSN/SAC Code"
                    style={styles.smallInput}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.smallLabel}>Quantity *</Text>
                    <TextInput
                      mode="outlined"
                      value={String(item.quantity)}
                      onChangeText={(value) => updateLineItem(item.id, 'quantity', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.smallLabel}>Unit Price *</Text>
                    <TextInput
                      mode="outlined"
                      value={String(item.unitPrice)}
                      onChangeText={(value) => updateLineItem(item.id, 'unitPrice', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.smallLabel}>Discount (%)</Text>
                    <TextInput
                      mode="outlined"
                      value={String(item.discount)}
                      onChangeText={(value) => updateLineItem(item.id, 'discount', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      style={styles.smallInput}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.smallLabel}>Tax Rate (%)</Text>
                    <Menu
                      visible={taxMenuVisible[item.id] || false}
                      onDismiss={() => setTaxMenuVisible({ ...taxMenuVisible, [item.id]: false })}
                      anchor={
                        <TouchableOpacity
                          style={styles.smallDropdown}
                          onPress={() => setTaxMenuVisible({ ...taxMenuVisible, [item.id]: true })}
                        >
                          <Text style={styles.dropdownText}>{item.taxRate}%</Text>
                          <MaterialIcons name="arrow-drop-down" size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                      }
                    >
                      {taxRates.map((rate) => (
                        <Menu.Item
                          key={rate}
                          onPress={() => {
                            updateLineItem(item.id, 'taxRate', rate);
                            setTaxMenuVisible({ ...taxMenuVisible, [item.id]: false });
                          }}
                          title={`${rate}%`}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

                <Text style={styles.totalText}>Total: ₹{item.total.toFixed(2)}</Text>
              </View>
            ))}

            {lineItems.length === 0 && (
              <Text style={styles.emptyText}>No items added. Click "Add Item" to start.</Text>
            )}
          </View>

          {/* Customer Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Customer Notes</Text>
            <TextInput
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              placeholder="Thanks for your business..."
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </View>

          {/* Terms & Conditions */}
          <View style={styles.field}>
            <Text style={styles.label}>Terms & Conditions</Text>
            <TextInput
              mode="outlined"
              value={termsConditions}
              onChangeText={setTermsConditions}
              placeholder="Enter terms and conditions..."
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </View>

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.grandTotalLabel}>Grand Total:</Text>
            <Text style={styles.grandTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
            >
              {purchaseId ? 'Update' : 'Create'} PO
            </Button>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  form: {
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  lineItem: {
    padding: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    marginBottom: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  halfField: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
    textAlign: 'right',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontStyle: 'italic',
    padding: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary.light,
    borderRadius: 8,
    marginBottom: 24,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 4,
    padding: 12,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  smallDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 4,
    padding: 8,
    minHeight: 40,
  },
});
