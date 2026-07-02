import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Card, Title, TextInput, Button, Text, Checkbox, RadioButton, DataTable } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MainLayout } from '../../components/Layout/MainLayout';
import { SearchableDropdown } from '../../components/Common/SearchableDropdown';
import { colors } from '../../theme/colors';
import { paymentsAPI, customersAPI, invoicesAPI } from '../../services/api';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface UnpaidInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  amount_due: number;
  payment_amount?: number;
}

export const PaymentFormScreen: React.FC = ({ route, navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { paymentId } = route.params || {};
  const isEditing = !!paymentId;
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [bankCharges, setBankCharges] = useState('');
  const [payFullAmount, setPayFullAmount] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [taxDeducted, setTaxDeducted] = useState('no');
  const [tdsAmount, setTdsAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchCustomers();
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  // Wire up "Pay Full Amount" checkbox — sums all outstanding invoice amounts
  useEffect(() => {
    if (payFullAmount && unpaidInvoices.length > 0) {
      const total = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount_due ?? 0), 0);
      setAmount(total.toFixed(2));
      const allSelected: { [key: string]: number } = {};
      unpaidInvoices.forEach(inv => { allSelected[inv.id] = inv.amount_due ?? 0; });
      setSelectedInvoices(allSelected);
    }
  }, [payFullAmount, unpaidInvoices]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchUnpaidInvoices(selectedCustomer);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchUnpaidInvoices = async (customerId: string) => {
    try {
      const response = await invoicesAPI.getAll({
        customerId,
        status: 'unpaid',
        limit: 100
      });
      const invoices = response?.data?.invoices || response?.data || response?.invoices || [];
      setUnpaidInvoices(invoices);
    } catch (err) {
      console.error('Failed to fetch unpaid invoices:', err);
      setUnpaidInvoices([]);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getById(paymentId);
      // Unwrap API response envelope
      const payment = response?.data?.payment || response?.data || response;
      setSelectedCustomer(String(payment.customer_id || ''));
      setAmount(String(payment.amount ?? ''));
      setPaymentMethod(payment.payment_mode || payment.payment_method || 'cash');
      setReferenceNumber(payment.reference || payment.reference_number || '');
      setNotes(payment.notes || '');
    } catch (err: any) {
      showError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const calculateTotal = () => {
    const totalInvoices = Object.values(selectedInvoices).reduce((sum, amt) => sum + amt, 0);
    return totalInvoices;
  };

  const handlePayInFull = (invoice: UnpaidInvoice) => {
    setSelectedInvoices(prev => ({
      ...prev,
      [invoice.id]: invoice.amount_due
    }));
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      showError('Please select a customer');
      return;
    }
    if (!amount && Object.keys(selectedInvoices).length === 0) {
      showError('Please enter an amount or select invoices to pay');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        customer_id: selectedCustomer,
        amount: amount ? parseFloat(amount) : calculateTotal(),
        bank_charges: bankCharges ? parseFloat(bankCharges) : 0,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        tax_deducted: taxDeducted === 'yes',
        tds_amount: tdsAmount ? parseFloat(tdsAmount) : 0,
        notes,
        invoice_payments: Object.entries(selectedInvoices).map(([invoice_id, amount]) => ({
          invoice_id,
          amount
        }))
      };

      if (isEditing) {
        await paymentsAPI.update(paymentId, paymentData);
        showSuccess('Payment updated successfully');
      } else {
        await paymentsAPI.create(paymentData);
        showSuccess('Payment recorded successfully');
      }
      navigation.goBack();
    } catch (err: any) {
      showError(err.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map(c => ({
    label: c.name,
    value: c.id.toString()
  }));

  const paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Check', value: 'check' },
    { label: 'UPI', value: 'upi' },
    { label: 'Credit Card', value: 'credit_card' },
  ];

  return (
    <MainLayout currentRoute="Payments" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.formCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.formContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
            <Text style={styles.title}>{isEditing ? 'Edit Payment' : 'Record Payment'}</Text>
            
            {/* Customer Selection */}
            <View style={styles.section}>
              <SearchableDropdown
                options={customerOptions}
                value={selectedCustomer}
                onSelect={setSelectedCustomer}
                placeholder="Select Customer *"
                searchable
              />
            </View>

            {/* Amount and Bank Charges */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextInput
                  label="Amount *"
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  left={<TextInput.Affix text="₹" />}
                />
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={payFullAmount ? 'checked' : 'unchecked'}
                    onPress={() => setPayFullAmount(!payFullAmount)}
                  />
                  <Text style={styles.checkboxLabel}>Pay Full Amount</Text>
                </View>
              </View>
              <View style={styles.flex1}>
                <TextInput
                  label="Bank Charges (if any)"
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  value={bankCharges}
                  onChangeText={setBankCharges}
                  left={<TextInput.Affix text="₹" />}
                />
              </View>
            </View>

            {/* Payment Date */}
            <TextInput
              label="Payment Date"
              mode="outlined"
              style={styles.input}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="YYYY-MM-DD"
            />

            {/* Payment Method */}
            <SearchableDropdown
              options={paymentMethodOptions}
              value={paymentMethod}
              onSelect={setPaymentMethod}
              placeholder="Payment Method *"
              searchable={false}
            />

            {/* Reference Number */}
            <TextInput
              label="Reference#"
              mode="outlined"
              style={styles.input}
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="Transaction ID or Check Number"
            />

            {/* Tax Deducted */}
            <View style={styles.section}>
              <Text style={styles.label}>Tax deducted?</Text>
              <RadioButton.Group onValueChange={setTaxDeducted} value={taxDeducted}>
                <View style={styles.radioRow}>
                  <View style={styles.radioItem}>
                    <RadioButton value="no" />
                    <Text>No, Tax deducted</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="yes" />
                    <Text>Yes, TDS (Income Tax)</Text>
                  </View>
                </View>
              </RadioButton.Group>
              {taxDeducted === 'yes' && (
                <TextInput
                  label="TDS Amount"
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  value={tdsAmount}
                  onChangeText={setTdsAmount}
                  left={<TextInput.Affix text="₹" />}
                />
              )}
            </View>

            {/* Unpaid Invoices */}
            {unpaidInvoices.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Unpaid Invoices</Text>
                  <Button mode="text" onPress={() => setSelectedInvoices({})}>
                    Clear amount
                  </Button>
                </View>
                <DataTable style={styles.table}>
                  <DataTable.Header>
                    <DataTable.Title>Date</DataTable.Title>
                    <DataTable.Title>Invoice Number</DataTable.Title>
                    <DataTable.Title numeric>Invoice Amount</DataTable.Title>
                    <DataTable.Title numeric>Amount Due</DataTable.Title>
                    <DataTable.Title>Payment</DataTable.Title>
                  </DataTable.Header>

                  {unpaidInvoices.map((invoice) => (
                    <DataTable.Row key={invoice.id}>
                      <DataTable.Cell>{invoice.invoice_date}</DataTable.Cell>
                      <DataTable.Cell>{invoice.invoice_number}</DataTable.Cell>
                      <DataTable.Cell numeric>₹{(invoice.total_amount ?? 0).toFixed(2)}</DataTable.Cell>
                      <DataTable.Cell numeric>₹{(invoice.amount_due ?? 0).toFixed(2)}</DataTable.Cell>
                      <DataTable.Cell>
                        <View style={styles.paymentCell}>
                          <TextInput
                            mode="outlined"
                            style={styles.smallInput}
                            keyboardType="numeric"
                            value={selectedInvoices[invoice.id]?.toString() || ''}
                            onChangeText={(val) => {
                              const amount = parseFloat(val) || 0;
                              setSelectedInvoices(prev => ({
                                ...prev,
                                [invoice.id]: amount
                              }));
                            }}
                            dense
                          />
                          <Button 
                            mode="text" 
                            compact
                            onPress={() => handlePayInFull(invoice)}
                          >
                            Pay in Full
                          </Button>
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>

                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                </View>

                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text>Amount Received:</Text>
                    <Text style={styles.summaryValue}>₹{amount || '0.00'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text>Amount used for payments:</Text>
                    <Text style={styles.summaryValue}>₹{calculateTotal().toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text>Amount Refunded:</Text>
                    <Text style={styles.summaryValue}>₹0.00</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text>Amount in excess:</Text>
                    <Text style={styles.summaryValue}>₹0.00</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
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
                {isEditing ? 'Update' : 'Save'}
              </Button>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  formCard: {
    margin: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallInput: {
    width: 100,
    height: 36,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
  },
  summaryBox: {
    backgroundColor: colors.neutral[50],
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.neutral[400],
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
  },
});