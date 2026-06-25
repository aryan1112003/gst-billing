import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { invoicesAPI, customersAPI, itemsAPI } from '../../services/api';
import { EmailRecipientSection } from '../../components/Invoice/EmailRecipientSection';
import { RootState } from '../../store/store';
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

export const InvoiceFormScreen: React.FC = ({ navigation, route }: any) => {
  const { invoiceId } = route.params || {};
  const { isMobile, isTablet, rs } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  // Get logged-in user's email from Redux
  const currentUser = useSelector((state: RootState) => state.auth.user);


  // Form fields
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('Select Customer');
  const [customerEmail, setCustomerEmail] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');
  const [sendEmail, setSendEmail] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [customerMenuVisible, setCustomerMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [itemMenuVisible, setItemMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [taxMenuVisible, setTaxMenuVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCustomers();
    fetchItems();
    if (invoiceId) {
      fetchInvoice();
    } else {
      // Add one empty line item for new invoice
      addLineItem();
    }
  }, [invoiceId]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 100 });
      const customersData = response.data || [];
      console.log('Fetched customers:', customersData);
      setCustomers(customersData);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
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
      setItems([]);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getById(invoiceId);
      const invoice = response.data?.invoice || response.data;

      console.log('Full API response:', response);
      console.log('Fetched invoice data:', invoice);

      if (!invoice) {
        throw new Error('No invoice data received');
      }

      // Set basic fields - backend returns camelCase
      setCustomerId(String(invoice.customerId || ''));
      setSelectedCustomerName(invoice.customer?.name || 'Select Customer');
      setCustomerEmail(invoice.customer?.email || '');
      setIssueDate(invoice.issueDate || new Date().toISOString().split('T')[0]);
      setDueDate(invoice.dueDate || '');
      setDiscountAmount(String(invoice.discountAmount || 0));
      setNotes(invoice.notes || '');

      // Map status - backend might return number, convert to string
      const statusMap: { [key: number]: string } = {
        1: 'draft',
        2: 'sent',
        3: 'paid',
        4: 'overdue',
        5: 'cancelled'
      };
      const statusValue = typeof invoice.status === 'number'
        ? statusMap[invoice.status] || 'draft'
        : invoice.status || 'draft';
      setStatus(statusValue);

      // Parse line items - backend returns lineItems array
      const lineItemsArray = invoice.lineItems || [];

      console.log('Line items from backend:', lineItemsArray);

      const mappedLineItems = Array.isArray(lineItemsArray) ? lineItemsArray.map((item: any, index: number) => {
        return {
          id: String(item.id || Date.now() + index),
          itemId: String(item.itemId || ''),
          itemName: item.item?.name || item.description || '',
          description: item.description || item.item?.name || '',
          hsnSac: item.hsnSac || item.item?.sku || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discountPercent) || 0,
          taxRate: Number(item.taxRate) || 18,
          total: Number(item.total) || 0,
        };
      }) : [];

      setLineItems(mappedLineItems);
      console.log('Mapped line items:', mappedLineItems);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      Alert.alert('Error', `Failed to load invoice: ${err.message}`);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
            updated.unitPrice = selectedItem.selling_price || selectedItem.purchase_price || 0;
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

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      return sum + (subtotal - discountAmount);
    }, 0);
  };

  const calculateTax = () => {
    return lineItems.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = (afterDiscount * item.taxRate) / 100;
      return sum + taxAmount;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = parseFloat(discountAmount) || 0;
    return subtotal + tax - discount;
  };

  const handleSave = async () => {
    // Validation
    if (!customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!issueDate) {
      Alert.alert('Error', 'Please enter issue date');
      return;
    }
    if (!dueDate) {
      Alert.alert('Error', 'Please enter due date');
      return;
    }
    if (new Date(dueDate) < new Date(issueDate)) {
      Alert.alert('Error', 'Due date must be greater than or equal to issue date');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    if (lineItems.some(item => !item.itemId || item.quantity <= 0)) {
      Alert.alert('Error', 'Please fill all item details correctly');
      return;
    }
    if (lineItems.some(item => item.unitPrice <= 0)) {
      Alert.alert('Error', 'Unit price must be greater than zero');
      return;
    }
    if (lineItems.some(item => item.discount < 0 || item.discount > 100)) {
      Alert.alert('Error', 'Discount must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      const invoiceData = {
        customerId,
        issueDate,
        dueDate,
        discountAmount: parseFloat(discountAmount) || 0,
        notes,
        status: invoiceId ? status : 'draft', // Only include status for updates
        lineItems: lineItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discount,
          taxRate: item.taxRate,
          description: item.description,
          hsnSac: item.hsnSac,
        })),
      };

      if (invoiceId) {
        await invoicesAPI.update(invoiceId, invoiceData);
        Alert.alert('Success', 'Invoice updated successfully!');
      } else {
        await invoicesAPI.create(invoiceData);
        Alert.alert('Success', 'Invoice created successfully!');
      }
      // Navigate back and trigger refresh
      navigation.navigate('Invoices', { refresh: Date.now() });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const handleCustomerSelect = (customer: any) => {
    setCustomerId(String(customer.id));
    setSelectedCustomerName(customer.name);
    setCustomerEmail(customer.email || '');
    setCustomerMenuVisible(false);
  };

  if (loading && invoiceId) {
    return (
      <MainLayout currentRoute="Invoices" onNavigate={handleNavigate}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentRoute="Invoices" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {invoiceId ? 'Edit Invoice' : 'New Invoice'}
          </Text>
        </View>

        <View style={[styles.form, {
          maxWidth: rs(undefined, 900, 1100) as any,
          alignSelf: 'center' as any,
          width: '100%',
        }]}>
          {/* Customer Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Customer *</Text>
            <Menu
              visible={customerMenuVisible}
              onDismiss={() => setCustomerMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setCustomerMenuVisible(true)}
                >
                  <Text style={styles.dropdownText}>{selectedCustomerName}</Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              }
            >
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <Menu.Item
                    key={customer.id}
                    onPress={() => handleCustomerSelect(customer)}
                    title={customer.name}
                  />
                ))
              ) : (
                <Menu.Item title="No customers available" disabled />
              )}
            </Menu>
          </View>

          {/* Issue Date + Due Date row on tablet/desktop */}
          <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Issue Date *</Text>
              <TextInput
                mode="outlined"
                value={issueDate}
                onChangeText={setIssueDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Due Date *</Text>
              <TextInput
                mode="outlined"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>
          </View>

          {/* Status (only for edit mode) */}
          {invoiceId && (
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
                       status === 'sent' ? 'Sent' :
                       status === 'paid' ? 'Paid' :
                       status === 'overdue' ? 'Overdue' :
                       status === 'cancelled' ? 'Cancelled' : 'Draft'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setStatus('draft');
                    setStatusMenuVisible(false);
                  }}
                  title="Draft"
                />
                <Menu.Item
                  onPress={() => {
                    setStatus('sent');
                    setStatusMenuVisible(false);
                  }}
                  title="Sent"
                />
                <Menu.Item
                  onPress={() => {
                    setStatus('paid');
                    setStatusMenuVisible(false);
                  }}
                  title="Paid"
                />
                <Menu.Item
                  onPress={() => {
                    setStatus('overdue');
                    setStatusMenuVisible(false);
                  }}
                  title="Overdue"
                />
                <Menu.Item
                  onPress={() => {
                    setStatus('cancelled');
                    setStatusMenuVisible(false);
                  }}
                  title="Cancelled"
                />
              </Menu>
            </View>
          )}

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

          {/* Discount Amount + Customer Notes row on tablet/desktop */}
          <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
            <View style={{ flex: isMobile ? undefined : 1 }}>
              <Text style={styles.label}>Additional Discount (₹)</Text>
              <TextInput
                mode="outlined"
                value={discountAmount}
                onChangeText={setDiscountAmount}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={{ flex: isMobile ? undefined : 2 }}>
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
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>₹{calculateTax().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.summaryValue}>-₹{(parseFloat(discountAmount) || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
          </View>

          {/* Email Recipient Section */}
          <EmailRecipientSection
            customerEmail={customerEmail}
            customerName={selectedCustomerName}
            companyEmail={currentUser?.email || ''}
            sendEmail={sendEmail}
            onToggleSendEmail={setSendEmail}
          />

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
              {invoiceId ? 'Update' : 'Create'} Invoice
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
  summaryContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
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
