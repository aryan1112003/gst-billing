import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { invoicesAPI, customersAPI, itemsAPI } from '../../services/api';
import { EmailRecipientSection } from '../../components/Invoice/EmailRecipientSection';
import { useTheme } from '../../contexts/ThemeContext';
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

export const QuotationFormScreen: React.FC = ({ navigation, route }: any) => {
    const { quotationId } = route.params || {};
    const { isMobile, isTablet, rs } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    const currentUser = useSelector((state: RootState) => state.auth.user);

    // Form fields
    const [customerId, setCustomerId] = useState('');
    const [selectedCustomerName, setSelectedCustomerName] = useState('Select Customer');
    const [customerEmail, setCustomerEmail] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(''); // Valid until
    const [discountAmount, setDiscountAmount] = useState('0');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Draft');
    const [sendEmail, setSendEmail] = useState(true);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [customerMenuVisible, setCustomerMenuVisible] = useState(false);
    const [statusMenuVisible, setStatusMenuVisible] = useState(false);
    const [itemMenuVisible, setItemMenuVisible] = useState<{ [key: string]: boolean }>({});
    const [taxMenuVisible, setTaxMenuVisible] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        fetchCustomers();
        fetchItems();
        if (quotationId) {
            fetchQuotation();
        } else {
            addLineItem();
        }
    }, [quotationId]);

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getAll({ limit: 100 });
            const customersData = response.data || [];
            setCustomers(customersData);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await itemsAPI.getAll({ limit: 100 });
            const itemsData = response.data || response.items || [];
            setItems(itemsData);
        } catch (err) {
            console.error('Failed to fetch items:', err);
        }
    };

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const response = await invoicesAPI.getById(quotationId);
            const quotation = response.data?.invoice || response.data;

            if (!quotation) {
                throw new Error('No quotation data received');
            }

            setCustomerId(String(quotation.customerId || ''));
            setSelectedCustomerName(quotation.customer?.name || 'Select Customer');
            setCustomerEmail(quotation.customer?.email || '');
            setIssueDate(quotation.issueDate || new Date().toISOString().split('T')[0]);
            setDueDate(quotation.dueDate || '');
            setDiscountAmount(String(quotation.discountAmount || 0));
            setNotes(quotation.notes || '');
            setStatus(quotation.status || 'Draft');

            const lineItemsArray = quotation.lineItems || [];
            const mappedLineItems = Array.isArray(lineItemsArray) ? lineItemsArray.map((item: any, index: number) => {
                return {
                    id: String(item.id || Date.now() + index),
                    itemId: String(item.itemId || ''),
                    itemName: item.item?.name || item.description || '',
                    description: item.description || item.item?.name || '',
                    hsnSac: item.hsnSac || item.item?.sku || '',
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                    discount: Number(item.discount) || 0,
                    taxRate: Number(item.taxRate) || 18,
                    total: Number(item.total) || 0,
                };
            }) : [];

            setLineItems(mappedLineItems);
        } catch (err: any) {
            Alert.alert('Error', `Failed to load quotation: ${err.message}`);
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
        if (!customerId) { Alert.alert('Error', 'Please select a customer'); return; }
        if (!issueDate) { Alert.alert('Error', 'Please enter issue date'); return; }
        if (lineItems.length === 0) { Alert.alert('Error', 'Please add at least one item'); return; }

        try {
            setLoading(true);
            const quotationData = {
                customerId,
                issueDate,
                dueDate,
                discountAmount: parseFloat(discountAmount) || 0,
                notes,
                status: quotationId ? status : 'Draft',
                type: 'quotation', // IMPORTANT: Specify type
                lineItems: lineItems.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    taxRate: item.taxRate,
                    description: item.description,
                    hsnSac: item.hsnSac,
                })),
            };

            if (quotationId) {
                await invoicesAPI.update(quotationId, quotationData);
                Alert.alert('Success', 'Quotation updated successfully!');
            } else {
                await invoicesAPI.create(quotationData);
                Alert.alert('Success', 'Quotation created successfully!');
            }
            navigation.navigate('Quotation', { refresh: Date.now() });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save quotation');
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

    const { colors: themeColors, isDarkMode } = useTheme();

    return (
        <MainLayout currentRoute="Quotation" onNavigate={handleNavigate}>
            <ScrollView style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <View style={[styles.header, {
                    backgroundColor: themeColors.surface.card,
                    borderBottomColor: themeColors.neutral[200]
                }]}>
                    <Text style={[styles.title, { color: themeColors.text.primary }]}>
                        {quotationId ? 'Edit Quotation' : 'New Quotation'}
                    </Text>
                </View>

                <View style={[styles.form, {
                    maxWidth: rs(undefined, 900, 1100) as any,
                    alignSelf: 'center' as any,
                    width: '100%',
                }]}>
                    {/* Customer Selection */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: themeColors.text.primary }]}>Customer *</Text>
                        <Menu
                            visible={customerMenuVisible}
                            onDismiss={() => setCustomerMenuVisible(false)}
                            anchor={
                                <TouchableOpacity
                                    style={[styles.dropdown, {
                                        backgroundColor: themeColors.surface.card,
                                        borderColor: themeColors.neutral[300]
                                    }]}
                                    onPress={() => setCustomerMenuVisible(true)}
                                >
                                    <Text style={[styles.dropdownText, { color: themeColors.text.primary }]}>{selectedCustomerName}</Text>
                                    <MaterialIcons name="arrow-drop-down" size={24} color={themeColors.text.secondary} />
                                </TouchableOpacity>
                            }
                        >
                            {customers.map((c) => (
                                <Menu.Item key={c.id} onPress={() => handleCustomerSelect(c)} title={c.name} />
                            ))}
                        </Menu>
                    </View>

                    {/* Dates */}
                    <View style={[styles.row, { flexDirection: rs('column', 'row', 'row') as any }]}>
                        <View style={styles.halfField}>
                            <Text style={[styles.label, { color: themeColors.text.primary }]}>Date *</Text>
                            <TextInput
                                mode="outlined"
                                value={issueDate}
                                onChangeText={setIssueDate}
                                placeholder="YYYY-MM-DD"
                                style={[styles.input, { backgroundColor: themeColors.surface.card }]}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                                textColor={themeColors.text.primary}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={[styles.label, { color: themeColors.text.primary }]}>Valid Until</Text>
                            <TextInput
                                mode="outlined"
                                value={dueDate}
                                onChangeText={setDueDate}
                                placeholder="YYYY-MM-DD"
                                style={[styles.input, { backgroundColor: themeColors.surface.card }]}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                                textColor={themeColors.text.primary}
                            />
                        </View>
                    </View>

                    {/* Status */}
                    {quotationId && (
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: themeColors.text.primary }]}>Status</Text>
                            <Menu
                                visible={statusMenuVisible}
                                onDismiss={() => setStatusMenuVisible(false)}
                                anchor={
                                    <TouchableOpacity
                                        style={[styles.dropdown, {
                                            backgroundColor: themeColors.surface.card,
                                            borderColor: themeColors.neutral[300]
                                        }]}
                                        onPress={() => setStatusMenuVisible(true)}
                                    >
                                        <Text style={[styles.dropdownText, { color: themeColors.text.primary }]}>{status}</Text>
                                        <MaterialIcons name="arrow-drop-down" size={24} color={themeColors.text.secondary} />
                                    </TouchableOpacity>
                                }
                            >
                                {['Draft', 'Pending', 'Accepted', 'Rejected', 'Expired'].map(s => (
                                    <Menu.Item key={s} onPress={() => { setStatus(s); setStatusMenuVisible(false); }} title={s} />
                                ))}
                            </Menu>
                        </View>
                    )}

                    {/* Line Items */}
                    <View style={[styles.section, {
                        backgroundColor: themeColors.surface.card,
                        borderColor: themeColors.neutral[200]
                    }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Items</Text>
                            <TouchableOpacity onPress={addLineItem} style={styles.addButton}>
                                <MaterialIcons name="add" size={20} color={themeColors.primary.main} />
                                <Text style={[styles.addButtonText, { color: themeColors.primary.main }]}>Add Item</Text>
                            </TouchableOpacity>
                        </View>

                        {lineItems.map((item, index) => (
                            <View key={item.id} style={[styles.lineItem, { backgroundColor: themeColors.background.main }]}>
                                <View style={styles.lineItemHeader}>
                                    <Text style={[styles.lineItemTitle, { color: themeColors.text.primary }]}>Item {index + 1}</Text>
                                    <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                                        <MaterialIcons name="delete" size={20} color={themeColors.error.main} />
                                    </TouchableOpacity>
                                </View>

                                {/* Item Select */}
                                <View style={styles.field}>
                                    <Text style={[styles.smallLabel, { color: themeColors.text.secondary }]}>Select Item *</Text>
                                    <Menu
                                        visible={itemMenuVisible[item.id] || false}
                                        onDismiss={() => setItemMenuVisible({ ...itemMenuVisible, [item.id]: false })}
                                        anchor={
                                            <TouchableOpacity
                                                style={[styles.dropdown, {
                                                    backgroundColor: themeColors.surface.card,
                                                    borderColor: themeColors.neutral[300]
                                                }]}
                                                onPress={() => setItemMenuVisible({ ...itemMenuVisible, [item.id]: true })}
                                            >
                                                <Text style={[styles.dropdownText, { color: themeColors.text.primary }]}>{item.itemName || 'Select Item'}</Text>
                                                <MaterialIcons name="arrow-drop-down" size={24} color={themeColors.text.secondary} />
                                            </TouchableOpacity>
                                        }
                                    >
                                        {items.map(i => (
                                            <Menu.Item
                                                key={i.id}
                                                onPress={() => {
                                                    updateLineItem(item.id, 'itemId', String(i.id));
                                                    setItemMenuVisible({ ...itemMenuVisible, [item.id]: false });
                                                }}
                                                title={i.name}
                                            />
                                        ))}
                                    </Menu>
                                </View>

                                {/* Description */}
                                <View style={styles.field}>
                                    <Text style={[styles.smallLabel, { color: themeColors.text.secondary }]}>Description</Text>
                                    <TextInput
                                        mode="outlined"
                                        value={item.description}
                                        onChangeText={v => updateLineItem(item.id, 'description', v)}
                                        style={[styles.smallInput, { backgroundColor: themeColors.surface.card }]}
                                        outlineColor={themeColors.neutral[300]}
                                        activeOutlineColor={themeColors.primary.main}
                                        textColor={themeColors.text.primary}
                                    />
                                </View>

                                {/* Qty, Price */}
                                <View style={styles.row}>
                                    <View style={styles.halfField}>
                                        <Text style={[styles.smallLabel, { color: themeColors.text.secondary }]}>Quantity</Text>
                                        <TextInput
                                            mode="outlined"
                                            keyboardType="numeric"
                                            value={String(item.quantity)}
                                            onChangeText={v => updateLineItem(item.id, 'quantity', parseFloat(v) || 0)}
                                            style={[styles.smallInput, { backgroundColor: themeColors.surface.card }]}
                                            outlineColor={themeColors.neutral[300]}
                                            activeOutlineColor={themeColors.primary.main}
                                            textColor={themeColors.text.primary}
                                        />
                                    </View>
                                    <View style={styles.halfField}>
                                        <Text style={[styles.smallLabel, { color: themeColors.text.secondary }]}>Price</Text>
                                        <TextInput
                                            mode="outlined"
                                            keyboardType="numeric"
                                            value={String(item.unitPrice)}
                                            onChangeText={v => updateLineItem(item.id, 'unitPrice', parseFloat(v) || 0)}
                                            style={[styles.smallInput, { backgroundColor: themeColors.surface.card }]}
                                            outlineColor={themeColors.neutral[300]}
                                            activeOutlineColor={themeColors.primary.main}
                                            textColor={themeColors.text.primary}
                                        />
                                    </View>
                                </View>

                                {/* Tax */}
                                <View style={styles.row}>
                                    <View style={styles.halfField}>
                                        <Text style={[styles.smallLabel, { color: themeColors.text.secondary }]}>Tax Rate (%)</Text>
                                        <Menu
                                            visible={taxMenuVisible[item.id] || false}
                                            onDismiss={() => setTaxMenuVisible({ ...taxMenuVisible, [item.id]: false })}
                                            anchor={
                                                <TouchableOpacity
                                                    style={[styles.smallDropdown, {
                                                        backgroundColor: themeColors.surface.card,
                                                        borderColor: themeColors.neutral[300]
                                                    }]}
                                                    onPress={() => setTaxMenuVisible({ ...taxMenuVisible, [item.id]: true })}
                                                >
                                                    <Text style={[styles.dropdownText, { color: themeColors.text.primary }]}>{item.taxRate}%</Text>
                                                    <MaterialIcons name="arrow-drop-down" size={20} color={themeColors.text.secondary} />
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

                                <Text style={[styles.totalText, { color: themeColors.primary.main }]}>Total: ₹{item.total.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calculations */}
                    <View style={[styles.summaryContainer, {
                        backgroundColor: themeColors.surface.card,
                        borderColor: themeColors.neutral[200]
                    }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Subtotal:</Text>
                            <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>₹{calculateSubtotal().toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Tax:</Text>
                            <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>₹{calculateTax().toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalRow, { borderTopColor: themeColors.neutral[200] }]}>
                            <Text style={[styles.grandTotalLabel, { color: themeColors.text.primary }]}>Grand Total:</Text>
                            <Text style={[styles.grandTotalValue, { color: themeColors.primary.main }]}>₹{calculateTotal().toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: themeColors.text.primary }]}>Notes</Text>
                        <TextInput
                            mode="outlined"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Subject / Terms..."
                            multiline
                            numberOfLines={3}
                            style={[styles.input, { backgroundColor: themeColors.surface.card }]}
                            outlineColor={themeColors.neutral[300]}
                            activeOutlineColor={themeColors.primary.main}
                            placeholderTextColor={themeColors.text.muted}
                            textColor={themeColors.text.primary}
                        />
                    </View>

                    <EmailRecipientSection
                        customerEmail={customerEmail}
                        customerName={selectedCustomerName}
                        companyEmail={currentUser?.email || ''}
                        sendEmail={sendEmail}
                        onToggleSendEmail={setSendEmail}
                    />

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            onPress={() => navigation.goBack()}
                            style={[styles.cancelButton, { borderColor: themeColors.neutral[300] }]}
                            disabled={loading}
                            textColor={themeColors.text.primary}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            style={styles.saveButton}
                            loading={loading}
                            disabled={loading}
                            buttonColor={themeColors.primary.main}
                        >
                            {quotationId ? 'Update' : 'Create'} Quotation
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: '700' },
    form: { padding: 24 },
    field: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {},
    section: { marginBottom: 24, padding: 16, borderRadius: 8, borderWidth: 1 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addButtonText: { fontWeight: '600' },
    lineItem: { padding: 12, borderRadius: 8, marginBottom: 12 },
    lineItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    lineItemTitle: { fontSize: 14, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1, marginBottom: 20 },
    smallLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    smallInput: { fontSize: 14 },
    totalText: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: 8 },
    summaryContainer: { padding: 16, borderRadius: 8, marginBottom: 24, borderWidth: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14, fontWeight: '600' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
    grandTotalLabel: { fontSize: 16, fontWeight: '700' },
    grandTotalValue: { fontSize: 16, fontWeight: '700' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelButton: {},
    saveButton: {},
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 4 },
    dropdownText: { fontSize: 16 },
    smallDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 4 },
});
