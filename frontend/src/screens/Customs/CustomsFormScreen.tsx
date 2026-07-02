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

interface CustomsFormData {
    type: string;
    partyName: string;
    country: string;
    port: string;
    billOfLading: string;
    shipmentDate: string;
    clearanceDate: string;
    dutyAmount: string;
    freightAmount: string;
    totalValue: string;
    currency: string;
    status: string;
}

export const CustomsFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const customsId = (route.params as any)?.customsId;
    const isEditing = !!customsId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<CustomsFormData>({
        type: 'import',
        partyName: '',
        country: '',
        port: '',
        billOfLading: '',
        shipmentDate: '',
        clearanceDate: '',
        dutyAmount: '',
        freightAmount: '',
        totalValue: '',
        currency: 'INR',
        status: 'in-transit',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [customsId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.customs.getById(customsId.toString());
            const data = response.data;
            setFormData({
                type: data.type,
                partyName: data.partyName,
                country: data.country,
                port: data.port || '',
                billOfLading: data.billOfLading || '',
                shipmentDate: data.shipmentDate,
                clearanceDate: data.clearanceDate || '',
                dutyAmount: data.dutyAmount.toString(),
                freightAmount: data.freightAmount.toString(),
                totalValue: data.totalValue.toString(),
                currency: data.currency,
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch shipment:', error);
            showError('Failed to load shipment details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.type.trim()) {
            showAlert('Validation Error', 'Please select shipment type');
            return;
        }
        if (!formData.partyName.trim()) {
            showAlert('Validation Error', 'Please enter party name');
            return;
        }
        if (!formData.country.trim()) {
            showAlert('Validation Error', 'Please enter country');
            return;
        }
        if (!formData.shipmentDate.trim()) {
            showAlert('Validation Error', 'Please enter shipment date');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                dutyAmount: Number(formData.dutyAmount),
                freightAmount: Number(formData.freightAmount),
                totalValue: Number(formData.totalValue),
            };

            if (isEditing) {
                await api.customs.update(customsId.toString(), payload);
                showSuccess('Shipment updated successfully');
            } else {
                await api.customs.create(payload);
                showSuccess('Shipment created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save shipment:', error);
            showError(error.message || 'Failed to save shipment');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof CustomsFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="Customs" title="Customs / Shipping" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="Customs" title="Customs / Shipping" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Shipment Type
                            </Text>
                            <SegmentedButtons
                                value={formData.type}
                                onValueChange={(value) => updateField('type', value)}
                                buttons={[
                                    { value: 'import', label: 'Import' },
                                    { value: 'export', label: 'Export' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Party Details
                            </Text>

                            <TextInput
                                label="Party Name *"
                                value={formData.partyName}
                                onChangeText={(value) => updateField('partyName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Country *"
                                value={formData.country}
                                onChangeText={(value) => updateField('country', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Port"
                                value={formData.port}
                                onChangeText={(value) => updateField('port', value)}
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
                                Documents
                            </Text>

                            <TextInput
                                label="Bill of Lading"
                                value={formData.billOfLading}
                                onChangeText={(value) => updateField('billOfLading', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Shipment Date *"
                                value={formData.shipmentDate}
                                onChangeText={(value) => updateField('shipmentDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Clearance Date"
                                value={formData.clearanceDate}
                                onChangeText={(value) => updateField('clearanceDate', value)}
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
                                Financials
                            </Text>

                            <TextInput
                                label="Duty Amount"
                                value={formData.dutyAmount}
                                onChangeText={(value) => updateField('dutyAmount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Freight Amount"
                                value={formData.freightAmount}
                                onChangeText={(value) => updateField('freightAmount', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Total Value"
                                value={formData.totalValue}
                                onChangeText={(value) => updateField('totalValue', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Currency"
                                value={formData.currency}
                                onChangeText={(value) => updateField('currency', value)}
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
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'in-transit', label: 'In Transit' },
                                    { value: 'at-port', label: 'At Port' },
                                    { value: 'cleared', label: 'Cleared' },
                                    { value: 'delivered', label: 'Delivered' },
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
                        {isEditing ? 'Update Shipment' : 'Create Shipment'}
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
