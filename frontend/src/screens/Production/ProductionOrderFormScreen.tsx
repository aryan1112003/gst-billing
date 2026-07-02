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
    productName: string;
    quantity: string;
    unit: string;
    plannedDate: string;
    completionDate: string;
    status: string;
    notes: string;
}

export const ProductionOrderFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const productionOrderId = (route.params as any)?.productionOrderId;
    const isEditing = !!productionOrderId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        productName: '',
        quantity: '',
        unit: 'pcs',
        plannedDate: '',
        completionDate: '',
        status: 'planned',
        notes: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [productionOrderId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.productionOrders.getById(productionOrderId.toString());
            const data = response.data;
            setFormData({
                productName: data.productName || '',
                quantity: data.quantity?.toString() || '',
                unit: data.unit || 'pcs',
                plannedDate: data.plannedDate || '',
                completionDate: data.completionDate || '',
                status: data.status || 'planned',
                notes: data.notes || '',
            });
        } catch (error) {
            console.error('Failed to fetch production order:', error);
            showError('Failed to load production order details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.productName.trim()) {
            showAlert('Validation Error', 'Please enter product name');
            return;
        }
        if (!formData.quantity.trim()) {
            showAlert('Validation Error', 'Please enter quantity');
            return;
        }
        if (!formData.plannedDate.trim()) {
            showAlert('Validation Error', 'Please enter planned date');
            return;
        }

        try {
            setSaving(true);
            const payload = { ...formData };

            if (isEditing) {
                await api.productionOrders.update(productionOrderId.toString(), payload);
                showSuccess('Production order updated successfully');
            } else {
                await api.productionOrders.create(payload);
                showSuccess('Production order created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save production order:', error);
            showError(error.message || 'Failed to save production order');
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
            <MainLayout currentRoute="ProductionOrders" title="Production Orders" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="ProductionOrders" title="Production Orders" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Product Details
                            </Text>
                            <TextInput
                                label="Product Name *"
                                value={formData.productName}
                                onChangeText={(value) => updateField('productName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    label="Quantity *"
                                    value={formData.quantity}
                                    onChangeText={(value) => updateField('quantity', value)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    outlineColor={themeColors.neutral[300]}
                                    activeOutlineColor={themeColors.primary.main}
                                />
                                <TextInput
                                    label="Unit"
                                    value={formData.unit}
                                    onChangeText={(value) => updateField('unit', value)}
                                    mode="outlined"
                                    style={[styles.input, styles.halfInput]}
                                    outlineColor={themeColors.neutral[300]}
                                    activeOutlineColor={themeColors.primary.main}
                                />
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Schedule
                            </Text>
                            <TextInput
                                label="Planned Date *"
                                value={formData.plannedDate}
                                onChangeText={(value) => updateField('plannedDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Completion Date"
                                value={formData.completionDate}
                                onChangeText={(value) => updateField('completionDate', value)}
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
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'planned', label: 'Planned' },
                                    { value: 'in-progress', label: 'In Progress' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                ]}
                                style={styles.segmentedButtons}
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
                        {isEditing ? 'Update Production Order' : 'Create Production Order'}
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
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    segmentedButtons: { marginBottom: 8 },
    saveButton: { marginTop: 8, marginBottom: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
