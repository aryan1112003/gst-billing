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

interface FormData {
    customerName: string;
    frequency: string;
    nextDate: string;
    endDate: string;
    amount: string;
    taxRate: string;
    description: string;
    status: string;
}

export const RecurringInvoiceFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const recurringInvoiceId = (route.params as any)?.recurringInvoiceId;
    const isEditing = !!recurringInvoiceId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        customerName: '',
        frequency: 'monthly',
        nextDate: '',
        endDate: '',
        amount: '',
        taxRate: '',
        description: '',
        status: 'active',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [recurringInvoiceId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.recurringInvoices.getById(recurringInvoiceId.toString());
            const data = response.data;
            setFormData({
                customerName: data.customerName || '',
                frequency: data.frequency || 'monthly',
                nextDate: data.nextDate || '',
                endDate: data.endDate || '',
                amount: data.amount?.toString() || '',
                taxRate: data.taxRate?.toString() || '',
                description: data.description || '',
                status: data.status || 'active',
            });
        } catch (error) {
            console.error('Failed to fetch recurring invoice:', error);
            Alert.alert('Error', 'Failed to load recurring invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.customerName.trim()) {
            Alert.alert('Validation Error', 'Please enter customer name');
            return;
        }
        if (!formData.nextDate.trim()) {
            Alert.alert('Validation Error', 'Please enter next date');
            return;
        }
        if (!formData.amount.trim()) {
            Alert.alert('Validation Error', 'Please enter amount');
            return;
        }

        try {
            setSaving(true);
            const payload = { ...formData };

            if (isEditing) {
                await api.recurringInvoices.update(recurringInvoiceId.toString(), payload);
                Alert.alert('Success', 'Recurring invoice updated successfully');
            } else {
                await api.recurringInvoices.create(payload);
                Alert.alert('Success', 'Recurring invoice created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save recurring invoice:', error);
            Alert.alert('Error', error.message || 'Failed to save recurring invoice');
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
            <MainLayout currentRoute="RecurringInvoices" title="Recurring Invoices" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="RecurringInvoices" title="Recurring Invoices" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Customer
                            </Text>
                            <TextInput
                                label="Customer Name *"
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
                                Schedule
                            </Text>
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary, marginBottom: 8 }}>
                                Frequency
                            </Text>
                            <SegmentedButtons
                                value={formData.frequency}
                                onValueChange={(value) => updateField('frequency', value)}
                                buttons={[
                                    { value: 'weekly', label: 'Weekly' },
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'quarterly', label: 'Quarterly' },
                                    { value: 'yearly', label: 'Yearly' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                            <TextInput
                                label="Next Date *"
                                value={formData.nextDate}
                                onChangeText={(value) => updateField('nextDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="End Date"
                                value={formData.endDate}
                                onChangeText={(value) => updateField('endDate', value)}
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
                                Amount
                            </Text>
                            <TextInput
                                label="Amount *"
                                value={formData.amount}
                                onChangeText={(value) => updateField('amount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Tax Rate (%)"
                                value={formData.taxRate}
                                onChangeText={(value) => updateField('taxRate', value)}
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
                                Details
                            </Text>
                            <TextInput
                                label="Description"
                                value={formData.description}
                                onChangeText={(value) => updateField('description', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
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
                                    { value: 'paused', label: 'Paused' },
                                    { value: 'completed', label: 'Completed' },
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
                        {isEditing ? 'Update Recurring Invoice' : 'Create Recurring Invoice'}
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
