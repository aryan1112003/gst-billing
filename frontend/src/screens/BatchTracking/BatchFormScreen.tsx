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

interface BatchFormData {
    batchNumber: string;
    itemName: string;
    manufacturingDate: string;
    expiryDate: string;
    quantity: string;
    unit: string;
    supplierName: string;
    purchaseRate: string;
    status: string;
}

export const BatchFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const batchId = (route.params as any)?.batchId;
    const isEditing = !!batchId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<BatchFormData>({
        batchNumber: '',
        itemName: '',
        manufacturingDate: '',
        expiryDate: '',
        quantity: '',
        unit: 'pcs',
        supplierName: '',
        purchaseRate: '',
        status: 'active',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [batchId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.batchTracking.getById(batchId.toString());
            const data = response.data;
            setFormData({
                batchNumber: data.batchNumber,
                itemName: data.itemName,
                manufacturingDate: data.manufacturingDate || '',
                expiryDate: data.expiryDate,
                quantity: data.quantity.toString(),
                unit: data.unit,
                supplierName: data.supplierName || '',
                purchaseRate: data.purchaseRate.toString(),
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch batch:', error);
            showError('Failed to load batch details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.batchNumber.trim()) {
            showAlert('Validation Error', 'Please enter batch number');
            return;
        }
        if (!formData.itemName.trim()) {
            showAlert('Validation Error', 'Please enter item name');
            return;
        }
        if (!formData.expiryDate.trim()) {
            showAlert('Validation Error', 'Please enter expiry date');
            return;
        }
        if (!formData.quantity.trim()) {
            showAlert('Validation Error', 'Please enter quantity');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                quantity: Number(formData.quantity),
                purchaseRate: Number(formData.purchaseRate),
            };

            if (isEditing) {
                await api.batchTracking.update(batchId.toString(), payload);
                showSuccess('Batch updated successfully');
            } else {
                await api.batchTracking.create(payload);
                showSuccess('Batch created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save batch:', error);
            showError(error.message || 'Failed to save batch');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof BatchFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="BatchTracking" title="Batch Tracking" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="BatchTracking" title="Batch Tracking" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Batch Details
                            </Text>

                            <TextInput
                                label="Batch Number *"
                                value={formData.batchNumber}
                                onChangeText={(value) => updateField('batchNumber', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Item Name *"
                                value={formData.itemName}
                                onChangeText={(value) => updateField('itemName', value)}
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
                                Dates
                            </Text>

                            <TextInput
                                label="Manufacturing Date"
                                value={formData.manufacturingDate}
                                onChangeText={(value) => updateField('manufacturingDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Expiry Date *"
                                value={formData.expiryDate}
                                onChangeText={(value) => updateField('expiryDate', value)}
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
                                Quantity
                            </Text>

                            <TextInput
                                label="Quantity *"
                                value={formData.quantity}
                                onChangeText={(value) => updateField('quantity', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Unit"
                                value={formData.unit}
                                onChangeText={(value) => updateField('unit', value)}
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
                                Supplier
                            </Text>

                            <TextInput
                                label="Supplier Name"
                                value={formData.supplierName}
                                onChangeText={(value) => updateField('supplierName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Purchase Rate"
                                value={formData.purchaseRate}
                                onChangeText={(value) => updateField('purchaseRate', value)}
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
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'expired', label: 'Expired' },
                                    { value: 'recalled', label: 'Recalled' },
                                    { value: 'consumed', label: 'Consumed' },
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
                        {isEditing ? 'Update Batch' : 'Create Batch'}
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
