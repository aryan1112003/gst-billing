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

interface TripSheetFormData {
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    returnDate: string;
    purpose: string;
    distanceKm: string;
    fuelCost: string;
    status: string;
}

export const TripSheetFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const tripSheetId = (route.params as any)?.tripSheetId;
    const isEditing = !!tripSheetId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<TripSheetFormData>({
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        fromLocation: '',
        toLocation: '',
        departureDate: '',
        returnDate: '',
        purpose: '',
        distanceKm: '',
        fuelCost: '',
        status: 'planned',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [tripSheetId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.tripSheets.getById(tripSheetId.toString());
            const data = response.data;
            setFormData({
                vehicleNumber: data.vehicleNumber,
                driverName: data.driverName,
                driverPhone: data.driverPhone,
                fromLocation: data.fromLocation,
                toLocation: data.toLocation,
                departureDate: data.departureDate,
                returnDate: data.returnDate || '',
                purpose: data.purpose || '',
                distanceKm: data.distanceKm.toString(),
                fuelCost: data.fuelCost.toString(),
                status: data.status,
            });
        } catch (error) {
            console.error('Failed to fetch trip sheet:', error);
            showError('Failed to load trip sheet details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
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
        if (!formData.fromLocation.trim()) {
            showAlert('Validation Error', 'Please enter from location');
            return;
        }
        if (!formData.toLocation.trim()) {
            showAlert('Validation Error', 'Please enter to location');
            return;
        }
        if (!formData.departureDate.trim()) {
            showAlert('Validation Error', 'Please enter departure date');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                distanceKm: Number(formData.distanceKm),
                fuelCost: Number(formData.fuelCost),
            };

            if (isEditing) {
                await api.tripSheets.update(tripSheetId.toString(), payload);
                showSuccess('Trip sheet updated successfully');
            } else {
                await api.tripSheets.create(payload);
                showSuccess('Trip sheet created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save trip sheet:', error);
            showError(error.message || 'Failed to save trip sheet');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof TripSheetFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    if (loading) {
        return (
            <MainLayout currentRoute="TripSheets" title="Trip Sheets" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="TripSheets" title="Trip Sheets" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>
                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Vehicle & Driver
                            </Text>

                            <TextInput
                                label="Vehicle Number *"
                                value={formData.vehicleNumber}
                                onChangeText={(value) => updateField('vehicleNumber', value)}
                                mode="outlined"
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
                                Route
                            </Text>

                            <TextInput
                                label="From Location *"
                                value={formData.fromLocation}
                                onChangeText={(value) => updateField('fromLocation', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="To Location *"
                                value={formData.toLocation}
                                onChangeText={(value) => updateField('toLocation', value)}
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

                            <TextInput
                                label="Departure Date *"
                                value={formData.departureDate}
                                onChangeText={(value) => updateField('departureDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Return Date"
                                value={formData.returnDate}
                                onChangeText={(value) => updateField('returnDate', value)}
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
                                Details
                            </Text>

                            <TextInput
                                label="Purpose"
                                value={formData.purpose}
                                onChangeText={(value) => updateField('purpose', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Distance (km)"
                                value={formData.distanceKm}
                                onChangeText={(value) => updateField('distanceKm', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />

                            <TextInput
                                label="Fuel Cost"
                                value={formData.fuelCost}
                                onChangeText={(value) => updateField('fuelCost', value)}
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
                                    { value: 'planned', label: 'Planned' },
                                    { value: 'in-transit', label: 'In Transit' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' },
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
                        {isEditing ? 'Update Trip Sheet' : 'Create Trip Sheet'}
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
