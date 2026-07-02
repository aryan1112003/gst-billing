import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import {
    TextInput,
    Button,
    SegmentedButtons,
    Card,
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { MainLayout } from '../../components/Layout/MainLayout';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface FormData {
    vendorId: string;
    vendorName: string;
    orderDate: string;
    expectedDelivery: string;
    status: string;
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
    notes: string;
}

export const PurchaseOrderFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const purchaseOrderId = (route.params as any)?.purchaseOrderId;
    const isEditing = !!purchaseOrderId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        vendorId: '',
        vendorName: '',
        orderDate: '',
        expectedDelivery: '',
        status: 'draft',
        subtotal: '',
        taxAmount: '',
        totalAmount: '',
        notes: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [purchaseOrderId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.purchaseOrders.getById(purchaseOrderId.toString());
            const data = response.data;
            setFormData({
                vendorId: data.vendorId?.toString() || '',
                vendorName: data.vendorName || '',
                orderDate: data.orderDate || '',
                expectedDelivery: data.expectedDelivery || '',
                status: data.status || 'draft',
                subtotal: data.subtotal?.toString() || '',
                taxAmount: data.taxAmount?.toString() || '',
                totalAmount: data.totalAmount?.toString() || '',
                notes: data.notes || '',
            });
        } catch (error) {
            console.error('Failed to fetch purchase order:', error);
            showError('Failed to load purchase order details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.vendorName.trim()) {
            showAlert('Validation Error', 'Please enter vendor name');
            return;
        }
        if (!formData.orderDate.trim()) {
            showAlert('Validation Error', 'Please enter order date');
            return;
        }

        try {
            setSaving(true);
            const payload = { ...formData };

            if (isEditing) {
                await api.purchaseOrders.update(purchaseOrderId.toString(), payload);
                showSuccess('Purchase order updated successfully');
            } else {
                await api.purchaseOrders.create(payload);
                showSuccess('Purchase order created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save purchase order:', error);
            showError(error.message || 'Failed to save purchase order');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="PurchaseOrders" title="Purchase Orders" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="PurchaseOrders" title="Purchase Orders" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Vendor Details
                            </Text>
                            <TextInput
                                label="Vendor Name *"
                                value={formData.vendorName}
                                onChangeText={(value) => updateField('vendorName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Order Details
                            </Text>
                            <TextInput
                                label="Order Date *"
                                value={formData.orderDate}
                                onChangeText={(value) => updateField('orderDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Expected Delivery"
                                value={formData.expectedDelivery}
                                onChangeText={(value) => updateField('expectedDelivery', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary, marginBottom: 8 }}>
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'sent', label: 'Sent' },
                                    { value: 'received', label: 'Received' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Amount
                            </Text>
                            <TextInput
                                label="Subtotal"
                                value={formData.subtotal}
                                onChangeText={(value) => updateField('subtotal', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Tax Amount"
                                value={formData.taxAmount}
                                onChangeText={(value) => updateField('taxAmount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Total Amount"
                                value={formData.totalAmount}
                                onChangeText={(value) => updateField('totalAmount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Notes
                            </Text>
                            <TextInput
                                label="Notes"
                                value={formData.notes}
                                onChangeText={(value) => updateField('notes', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving}
                        style={styles.saveButton}
                        buttonColor={themeColors.primary.main}
                    >
                        {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
                    </Button>
                </ScrollView>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    card: { marginBottom: 16, elevation: 2 },
    sectionTitle: { marginBottom: 16, fontWeight: '600' },
    input: { marginBottom: 12 },
    segmentedButtons: { marginBottom: 8 },
    saveButton: { marginTop: 8, marginBottom: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
