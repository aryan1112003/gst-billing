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

interface GatePassFormData {
    type: 'inward' | 'outward';
    partyName: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    purpose: string;
    itemsDescription: string;
    quantity: string;
    unit: string;
    remarks: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export const GatePassFormScreen: React.FC = () => {
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const gatePassId = (route.params as any)?.gatePassId;
    const isEditing = !!gatePassId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<GatePassFormData>({
        type: 'inward',
        partyName: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        purpose: '',
        itemsDescription: '',
        quantity: '',
        unit: 'pcs',
        remarks: '',
        status: 'pending',
    });

    useEffect(() => {
        if (isEditing) {
            fetchGatePass();
        }
    }, [gatePassId]);

    const fetchGatePass = async () => {
        try {
            setLoading(true);
            const response = await api.gatePasses.getById(gatePassId.toString());
            const data = response.data;
            setFormData({
                type: data.type,
                partyName: data.partyName,
                vehicleNumber: data.vehicleNumber,
                driverName: data.driverName,
                driverPhone: data.driverPhone,
                purpose: data.purpose || '',
                itemsDescription: data.itemsDescription,
                quantity: data.quantity.toString(),
                unit: data.unit,
                remarks: data.remarks || '',
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch gate pass:', error);
            showError('Failed to load gate pass details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!formData.partyName.trim()) {
            showAlert('Validation Error', 'Please enter party name');
            return;
        }
        if (!formData.vehicleNumber.trim()) {
            showAlert('Validation Error', 'Please enter vehicle number');
            return;
        }
        if (!formData.driverName.trim()) {
            showAlert('Validation Error', 'Please enter driver name');
            return;
        }
        if (!formData.driverPhone.trim()) {
            showAlert('Validation Error', 'Please enter driver phone');
            return;
        }
        if (!formData.itemsDescription.trim()) {
            showAlert('Validation Error', 'Please enter items description');
            return;
        }
        if (!formData.quantity.trim() || isNaN(Number(formData.quantity))) {
            showAlert('Validation Error', 'Please enter valid quantity');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                quantity: Number(formData.quantity),
            };

            if (isEditing) {
                await api.gatePasses.update(gatePassId.toString(), payload);
                showSuccess('Gate pass updated successfully');
            } else {
                await api.gatePasses.create(payload);
                showSuccess('Gate pass created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save gate pass:', error);
            showError(error.message || 'Failed to save gate pass');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof GatePassFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="GatePass" title="Gate Pass" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="GatePass" title="Gate Pass" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Gate Pass Type
                            </Text>
                            <SegmentedButtons
                                value={formData.type}
                                onValueChange={(value) => updateField('type', value as any)}
                                buttons={[
                                    { value: 'inward', label: 'Inward' },
                                    { value: 'outward', label: 'Outward' },
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
                                label="Purpose"
                                value={formData.purpose}
                                onChangeText={(value) => updateField('purpose', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Vehicle & Driver Details
                            </Text>

                            <TextInput
                                label="Vehicle Number *"
                                value={formData.vehicleNumber}
                                onChangeText={(value) => updateField('vehicleNumber', value.toUpperCase())}
                                mode="outlined"
                                autoCapitalize="characters"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Driver Name *"
                                value={formData.driverName}
                                onChangeText={(value) => updateField('driverName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Driver Phone *"
                                value={formData.driverPhone}
                                onChangeText={(value) => updateField('driverPhone', value)}
                                mode="outlined"
                                keyboardType="phone-pad"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Items Details
                            </Text>

                            <TextInput
                                label="Items Description *"
                                value={formData.itemsDescription}
                                onChangeText={(value) => updateField('itemsDescription', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
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

                    {isEditing && (
                        <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                            <Card.Content>
                                <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                    Status
                                </Text>
                                <SegmentedButtons
                                    value={formData.status}
                                    onValueChange={(value) => updateField('status', value as any)}
                                    buttons={[
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                        { value: 'completed', label: 'Completed' },
                                    ]}
                                    style={styles.segmentedButtons}
                                />
                            </Card.Content>
                        </Card>
                    )}

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Additional Information
                            </Text>

                            <TextInput
                                label="Remarks"
                                value={formData.remarks}
                                onChangeText={(value) => updateField('remarks', value)}
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
                        {isEditing ? 'Update Gate Pass' : 'Create Gate Pass'}
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
