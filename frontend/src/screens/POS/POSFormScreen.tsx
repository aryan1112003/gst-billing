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

interface POSFormData {
    customerName: string;
    saleDate: string;
    subtotal: string;
    taxAmount: string;
    discount: string;
    total: string;
    paymentMethod: string;
    status: string;
}

export const POSFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const posId = (route.params as any)?.posId;
    const isEditing = !!posId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<POSFormData>({
        customerName: 'Walk-in Customer',
        saleDate: '',
        subtotal: '',
        taxAmount: '',
        discount: '0',
        total: '',
        paymentMethod: 'cash',
        status: 'completed',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [posId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.pos.getById(posId.toString());
            const data = response.data;
            setFormData({
                customerName: data.customerName,
                saleDate: data.saleDate,
                subtotal: data.subtotal.toString(),
                taxAmount: data.taxAmount.toString(),
                discount: data.discount.toString(),
                total: data.total.toString(),
                paymentMethod: data.paymentMethod,
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch POS sale:', error);
            showError('Failed to load sale details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.saleDate.trim()) {
            showAlert('Validation Error', 'Please enter sale date');
            return;
        }
        if (!formData.subtotal.trim()) {
            showAlert('Validation Error', 'Please enter subtotal');
            return;
        }
        if (!formData.total.trim()) {
            showAlert('Validation Error', 'Please enter total');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                subtotal: Number(formData.subtotal),
                taxAmount: Number(formData.taxAmount),
                discount: Number(formData.discount),
                total: Number(formData.total),
            };

            if (isEditing) {
                await api.pos.update(posId.toString(), payload);
                showSuccess('Sale updated successfully');
            } else {
                await api.pos.create(payload);
                showSuccess('Sale created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save sale:', error);
            showError(error.message || 'Failed to save sale');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof POSFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="POS" title="POS / Counter Sale" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="POS" title="POS / Counter Sale" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Customer
                            </Text>

                            <TextInput
                                label="Customer Name"
                                value={formData.customerName}
                                onChangeText={(value) => updateField('customerName', value)}
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
                                Sale Details
                            </Text>

                            <TextInput
                                label="Sale Date *"
                                value={formData.saleDate}
                                onChangeText={(value) => updateField('saleDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Items & Amount
                            </Text>

                            <TextInput
                                label="Subtotal *"
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
                                label="Discount"
                                value={formData.discount}
                                onChangeText={(value) => updateField('discount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Total *"
                                value={formData.total}
                                onChangeText={(value) => updateField('total', value)}
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
                                Payment
                            </Text>
                            <SegmentedButtons
                                value={formData.paymentMethod}
                                onValueChange={(value) => updateField('paymentMethod', value)}
                                buttons={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'card', label: 'Card' },
                                    { value: 'upi', label: 'UPI' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'refunded', label: 'Refunded' },
                                ]}
                                style={styles.segmentedButtons}
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
                        {isEditing ? 'Update Sale' : 'Create Sale'}
                    </Button>
                </ScrollView>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: '600',
    },
    input: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    segmentedButtons: {
        marginBottom: 8,
    },
    saveButton: {
        marginTop: 8,
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
