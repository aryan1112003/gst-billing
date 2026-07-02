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
import { showAlert, showSuccess, showError } from '../../utils/toast';

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

export const DeliveryChallanFormScreen: React.FC = ({ navigation, route }: any) => {
    const { challanId } = route.params || {};
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
    const [vehicleNumber, setVehicleNumber] = useState('');
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
        if (challanId) {
            fetchChallan();
        } else {
            addLineItem();
        }
    }, [challanId]);

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

    const fetchChallan = async () => {
        try {
            setLoading(true);
            const response = await invoicesAPI.getById(challanId);
            const challan = response.data?.invoice || response.data;

            if (!challan) {
                throw new Error('No challan data received');
            }

            setCustomerId(String(challan.customerId || ''));
            setSelectedCustomerName(challan.customer?.name || 'Select Customer');
            setCustomerEmail(challan.customer?.email || '');
            setIssueDate(challan.issueDate || new Date().toISOString().split('T')[0]);
            setVehicleNumber(challan.vehicleNumber || '');
            setDiscountAmount(String(challan.discountAmount || 0));
            setNotes(challan.notes || '');
            setStatus(challan.status || 'Draft');

            const lineItemsArray = challan.lineItems || [];
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
            showError(`Failed to load challan: ${err.message}`);
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
        if (!customerId) { showError('Please select a customer'); return; }
        if (!issueDate) { showError('Please enter issue date'); return; }
        if (lineItems.length === 0) { showError('Please add at least one item'); return; }

        try {
            setLoading(true);
            const challanData = {
                customerId,
                issueDate,
                dueDate: issueDate, // Challans usually don't have due date like invoices, but field is required by DB schema probably
                discountAmount: parseFloat(discountAmount) || 0,
                notes,
                status: challanId ? status : 'Draft',
                type: 'challan',
                vehicleNumber,
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

            if (challanId) {
                await invoicesAPI.update(challanId, challanData);
                showSuccess('Challan updated successfully!');
            } else {
                await invoicesAPI.create(challanData);
                showSuccess('Challan created successfully!');
            }
            navigation.navigate('DeliveryChallan', { refresh: Date.now() });
        } catch (err: any) {
            showError(err.message || 'Failed to save challan');
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

    return (
        <MainLayout currentRoute="DeliveryChallan" title="Delivery Challan" onNavigate={handleNavigate}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{challanId ? 'Edit Delivery Challan' : 'New Delivery Challan'}</Text>
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
                                <TouchableOpacity style={styles.dropdown} onPress={() => setCustomerMenuVisible(true)}>
                                    <Text style={styles.dropdownText}>{selectedCustomerName}</Text>
                                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                                </TouchableOpacity>
                            }
                        >
                            {customers.map((c) => (
                                <Menu.Item key={c.id} onPress={() => handleCustomerSelect(c)} title={c.name} />
                            ))}
                        </Menu>
                    </View>

                    {/* Date + Vehicle Number row on tablet/desktop */}
                    <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Date *</Text>
                            <TextInput mode="outlined" value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" style={styles.input} />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Vehicle Number</Text>
                            <TextInput
                                mode="outlined"
                                value={vehicleNumber}
                                onChangeText={setVehicleNumber}
                                placeholder="e.g. MH-12-AB-1234"
                                style={styles.input}
                            />
                        </View>
                    </View>

                    {/* Status */}
                    {challanId && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Status</Text>
                            <Menu
                                visible={statusMenuVisible}
                                onDismiss={() => setStatusMenuVisible(false)}
                                anchor={
                                    <TouchableOpacity style={styles.dropdown} onPress={() => setStatusMenuVisible(true)}>
                                        <Text style={styles.dropdownText}>{status}</Text>
                                        <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
                                    </TouchableOpacity>
                                }
                            >
                                {['Draft', 'Pending', 'Delivered', 'Returned'].map(s => (
                                    <Menu.Item key={s} onPress={() => { setStatus(s); setStatusMenuVisible(false); }} title={s} />
                                ))}
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

                                {/* Item Select */}
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
                                                <Text style={styles.dropdownText}>{item.itemName || 'Select Item'}</Text>
                                                <MaterialIcons name="arrow-drop-down" size={24} color={colors.text.secondary} />
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
                                    <Text style={styles.smallLabel}>Description</Text>
                                    <TextInput mode="outlined" value={item.description} onChangeText={v => updateLineItem(item.id, 'description', v)} style={styles.smallInput} />
                                </View>

                                {/* Qty, Price */}
                                <View style={styles.row}>
                                    <View style={styles.halfField}>
                                        <Text style={styles.smallLabel}>Quantity</Text>
                                        <TextInput mode="outlined" keyboardType="numeric" value={String(item.quantity)} onChangeText={v => updateLineItem(item.id, 'quantity', parseFloat(v) || 0)} style={styles.smallInput} />
                                    </View>
                                    <View style={styles.halfField}>
                                        <Text style={styles.smallLabel}>Price</Text>
                                        <TextInput mode="outlined" keyboardType="numeric" value={String(item.unitPrice)} onChangeText={v => updateLineItem(item.id, 'unitPrice', parseFloat(v) || 0)} style={styles.smallInput} />
                                    </View>
                                </View>

                                {/* Tax */}
                                <View style={styles.row}>
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
                    </View>

                    {/* Calculations */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax:</Text>
                            <Text style={styles.summaryValue}>₹{calculateTax().toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                            <Text style={styles.grandTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput mode="outlined" value={notes} onChangeText={setNotes} placeholder="Notes..." multiline numberOfLines={3} style={styles.input} />
                    </View>

                    <EmailRecipientSection
                        customerEmail={customerEmail}
                        customerName={selectedCustomerName}
                        companyEmail={currentUser?.email || ''}
                        sendEmail={sendEmail}
                        onToggleSendEmail={setSendEmail}
                    />

                    <View style={styles.actions}>
                        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.cancelButton} disabled={loading}>Cancel</Button>
                        <Button mode="contained" onPress={handleSave} style={styles.saveButton} loading={loading} disabled={loading}>
                            {challanId ? 'Update' : 'Create'} Challan
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.neutral[50] },
    header: { padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
    title: { fontSize: 24, fontWeight: '700', color: colors.text.primary },
    form: { padding: 24 },
    field: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF' },
    section: { marginBottom: 24, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: colors.neutral[200] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addButtonText: { color: colors.primary.main, fontWeight: '600' },
    lineItem: { padding: 12, backgroundColor: colors.neutral[50], borderRadius: 8, marginBottom: 12 },
    lineItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    lineItemTitle: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
    row: { flexDirection: 'row', gap: 12, marginTop: 12 },
    halfField: { flex: 1 },
    smallLabel: { fontSize: 12, fontWeight: '600', color: colors.text.secondary, marginBottom: 4 },
    smallInput: { backgroundColor: '#FFFFFF', fontSize: 14 },
    totalText: { fontSize: 14, fontWeight: '700', color: colors.primary.main, textAlign: 'right', marginTop: 8 },
    summaryContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: colors.neutral[200] },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: colors.text.secondary },
    summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.neutral[200] },
    grandTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
    grandTotalValue: { fontSize: 16, fontWeight: '700', color: colors.primary.main },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelButton: { borderColor: colors.neutral[300] },
    saveButton: { backgroundColor: colors.primary.main },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.neutral[300], borderRadius: 4, backgroundColor: '#FFFFFF' },
    dropdownText: { fontSize: 16, color: colors.text.primary },
    smallDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.neutral[300], borderRadius: 4, backgroundColor: '#FFFFFF' },
});
