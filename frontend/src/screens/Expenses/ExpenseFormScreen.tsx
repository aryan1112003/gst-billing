import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, TextInput, Button, RadioButton, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MainLayout } from '../../components/Layout/MainLayout';
import { SearchableDropdown } from '../../components/Common/SearchableDropdown';
import { colors } from '../../theme/colors';
import { expensesAPI, customersAPI } from '../../services/api';
import { showAlert, showSuccess, showError } from '../../utils/toast';

export const ExpenseFormScreen: React.FC = ({ route, navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { expenseId } = route.params || {};
  const isEditing = !!expenseId;
  const [loading, setLoading] = useState(false);

  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [expenseType, setExpenseType] = useState('goods'); // goods or service
  const [hsnCode, setHsnCode] = useState('');
  const [amount, setAmount] = useState('');
  const [gstTreatment, setGstTreatment] = useState('registered_business');
  const [vendorGstin, setVendorGstin] = useState('');
  const [destinationOfSupply, setDestinationOfSupply] = useState('');
  const [reverseCharge, setReverseCharge] = useState(false);
  const [taxRate, setTaxRate] = useState('');
  const [amountIs, setAmountIs] = useState('tax_inclusive'); // tax_inclusive or tax_exclusive
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
    if (expenseId) {
      fetchExpenseDetails();
    }
  }, [expenseId]);

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getById(expenseId);
      const expense = response.data || response;
      console.log('Loaded expense:', expense);
      
      // Populate form with expense data
      setDate(expense.expense_date || expense.date || '');
      setCategory(expense.category || '');
      setExpenseType(expense.expense_type || 'goods');
      setHsnCode(expense.hsn_code || '');
      setAmount(expense.amount?.toString() || '');
      setGstTreatment(expense.gst_treatment || 'registered_business');
      setVendorGstin(expense.vendor_gstin || '');
      setDestinationOfSupply(expense.destination_of_supply || '');
      setReverseCharge(expense.reverse_charge || false);
      setTaxRate(expense.tax_rate?.toString() || '');
      setAmountIs(expense.amount_is || 'tax_inclusive');
      setInvoiceNo(expense.invoice_no || '');
      setNotes(expense.description || expense.notes || '');
      setCustomerName(expense.customer_name || '');
    } catch (err: any) {
      console.error('Failed to load expense:', err);
      showError(err.message || 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const handleSave = async () => {
    if (!date || !category || !amount) {
      showError('Please fill in all required fields');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('Amount must be a positive number');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        date,
        category,
        expense_type: expenseType,
        hsn_code: hsnCode,
        amount: parseFloat(amount),
        gst_treatment: gstTreatment,
        vendor_gstin: vendorGstin,
        destination_of_supply: destinationOfSupply,
        reverse_charge: reverseCharge,
        tax_rate: taxRate ? parseFloat(taxRate) : 0,
        amount_is: amountIs,
        invoice_no: invoiceNo,
        notes,
        customer_name: customerName
      };

      if (isEditing) {
        await expensesAPI.update(expenseId, expenseData);
        showSuccess('Expense updated successfully');
      } else {
        await expensesAPI.create(expenseData);
        showSuccess('Expense created successfully');
      }
      navigation.goBack();
    } catch (err: any) {
      showError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { label: 'Job Costing', value: 'job_costing' },
    { label: 'Advertising', value: 'advertising' },
    { label: 'Office Supplies', value: 'office_supplies' },
    { label: 'Travel', value: 'travel' },
    { label: 'Utilities', value: 'utilities' },
    { label: 'Rent', value: 'rent' },
    { label: 'Salaries', value: 'salaries' },
    { label: 'Other', value: 'other' },
  ];

  const stateOptions = [
    { label: 'Select State', value: '' },
    { label: 'Maharashtra', value: 'maharashtra' },
    { label: 'Gujarat', value: 'gujarat' },
    { label: 'Karnataka', value: 'karnataka' },
    { label: 'Tamil Nadu', value: 'tamil_nadu' },
    { label: 'Delhi', value: 'delhi' },
  ];

  const taxOptions = [
    { label: 'Select Tax', value: '' },
    { label: 'GST 0%', value: '0' },
    { label: 'GST 5%', value: '5' },
    { label: 'GST 12%', value: '12' },
    { label: 'GST 18%', value: '18' },
    { label: 'GST 28%', value: '28' },
  ];

  const customerOptions = customers.map(c => ({
    label: c.name,
    value: c.id.toString()
  }));

  return (
    <MainLayout currentRoute="Expenses" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.formCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.formContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
            <Text style={styles.title}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>

            {/* Date + Category */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Date *"
                  mode="outlined"
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SearchableDropdown
                  options={categoryOptions}
                  value={category}
                  onSelect={setCategory}
                  placeholder="Category *"
                  searchable={false}
                />
              </View>
            </View>

            {/* Expense Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Expense Type</Text>
              <RadioButton.Group onValueChange={setExpenseType} value={expenseType}>
                <View style={styles.radioRow}>
                  <View style={styles.radioItem}>
                    <RadioButton value="goods" />
                    <Text>Goods</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="service" />
                    <Text>Service</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {/* HSN Code + Amount */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="HSN Code"
                  mode="outlined"
                  style={styles.input}
                  value={hsnCode}
                  onChangeText={setHsnCode}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Amount *"
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  left={<TextInput.Affix text="₹" />}
                />
              </View>
            </View>

            {/* GST Treatment */}
            <SearchableDropdown
              options={[
                { label: 'Registered Business', value: 'registered_business' },
                { label: 'Unregistered Business', value: 'unregistered_business' },
                { label: 'Consumer', value: 'consumer' },
              ]}
              value={gstTreatment}
              onSelect={setGstTreatment}
              placeholder="GST Treatment *"
              searchable={false}
            />

            {/* Vendor GSTIN + Destination Of Supply */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Vendor GSTIN"
                  mode="outlined"
                  style={styles.input}
                  value={vendorGstin}
                  onChangeText={setVendorGstin}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SearchableDropdown
                  options={stateOptions}
                  value={destinationOfSupply}
                  onSelect={setDestinationOfSupply}
                  placeholder="Destination Of Supply *"
                  searchable={false}
                />
              </View>
            </View>

            {/* Reverse Charge */}
            <View style={styles.checkboxRow}>
              <Checkbox
                status={reverseCharge ? 'checked' : 'unchecked'}
                onPress={() => setReverseCharge(!reverseCharge)}
              />
              <Text style={styles.checkboxLabel}>This transaction is applicable for reverse charge</Text>
            </View>

            {/* Tax Rate */}
            <SearchableDropdown
              options={taxOptions}
              value={taxRate}
              onSelect={setTaxRate}
              placeholder="Tax Rate *"
              searchable={false}
            />

            {/* Amount Is */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount Is *</Text>
              <RadioButton.Group onValueChange={setAmountIs} value={amountIs}>
                <View style={styles.radioRow}>
                  <View style={styles.radioItem}>
                    <RadioButton value="tax_inclusive" />
                    <Text>Tax Inclusive</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="tax_exclusive" />
                    <Text>Tax Exclusive</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {/* Invoice No */}
            <TextInput
              label="Invoice No #"
              mode="outlined"
              style={styles.input}
              value={invoiceNo}
              onChangeText={setInvoiceNo}
            />

            {/* Notes */}
            <TextInput
              label="Notes"
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Customer Name */}
            <SearchableDropdown
              options={customerOptions}
              value={customerName}
              onSelect={setCustomerName}
              placeholder="Customer Name"
              searchable
            />

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
                Save
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
  radioRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text.secondary,
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
