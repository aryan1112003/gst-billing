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

interface VehicleFormData {
    vehicleNumber: string;
    vehicleType: string;
    make: string;
    model: string;
    year: string;
    color: string;
    registrationDate: string;
    insuranceExpiry: string;
    fitnessExpiry: string;
    rcNumber: string;
    status: string;
}

export const VehicleFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const vehicleId = (route.params as any)?.vehicleId;
    const isEditing = !!vehicleId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<VehicleFormData>({
        vehicleNumber: '',
        vehicleType: '',
        make: '',
        model: '',
        year: '',
        color: '',
        registrationDate: '',
        insuranceExpiry: '',
        fitnessExpiry: '',
        rcNumber: '',
        status: 'active',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [vehicleId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.fleet.getById(vehicleId.toString());
            const data = response.data;
            setFormData({
                vehicleNumber: data.vehicleNumber,
                vehicleType: data.vehicleType,
                make: data.make,
                model: data.model,
                year: data.year ? data.year.toString() : '',
                color: data.color || '',
                registrationDate: data.registrationDate || '',
                insuranceExpiry: data.insuranceExpiry || '',
                fitnessExpiry: data.fitnessExpiry || '',
                rcNumber: data.rcNumber || '',
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch vehicle:', error);
            showError('Failed to load vehicle details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.vehicleNumber.trim()) {
            showAlert('Validation Error', 'Please enter vehicle number');
            return;
        }
        if (!formData.vehicleType.trim()) {
            showAlert('Validation Error', 'Please enter vehicle type');
            return;
        }
        if (!formData.make.trim()) {
            showAlert('Validation Error', 'Please enter make');
            return;
        }
        if (!formData.model.trim()) {
            showAlert('Validation Error', 'Please enter model');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                year: formData.year ? Number(formData.year) : null,
            };

            if (isEditing) {
                await api.fleet.update(vehicleId.toString(), payload);
                showSuccess('Vehicle updated successfully');
            } else {
                await api.fleet.create(payload);
                showSuccess('Vehicle created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save vehicle:', error);
            showError(error.message || 'Failed to save vehicle');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof VehicleFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="Fleet" title="Fleet" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="Fleet" title="Fleet" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Vehicle Details
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
                                label="Vehicle Type *"
                                value={formData.vehicleType}
                                onChangeText={(value) => updateField('vehicleType', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Make *"
                                value={formData.make}
                                onChangeText={(value) => updateField('make', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Model *"
                                value={formData.model}
                                onChangeText={(value) => updateField('model', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Year"
                                value={formData.year}
                                onChangeText={(value) => updateField('year', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Color"
                                value={formData.color}
                                onChangeText={(value) => updateField('color', value)}
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
                                Registration
                            </Text>

                            <TextInput
                                label="Registration Date"
                                value={formData.registrationDate}
                                onChangeText={(value) => updateField('registrationDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Insurance Expiry"
                                value={formData.insuranceExpiry}
                                onChangeText={(value) => updateField('insuranceExpiry', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Fitness Expiry"
                                value={formData.fitnessExpiry}
                                onChangeText={(value) => updateField('fitnessExpiry', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="RC Number"
                                value={formData.rcNumber}
                                onChangeText={(value) => updateField('rcNumber', value)}
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
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                    { value: 'under-maintenance', label: 'Maintenance' },
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
                        {isEditing ? 'Update Vehicle' : 'Create Vehicle'}
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
