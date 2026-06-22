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
    IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { MainLayout } from '../../components/Layout/MainLayout';

interface ComponentRow {
    componentName: string;
    quantity: string;
    unit: string;
}

interface FormData {
    productName: string;
    quantity: string;
    unit: string;
    status: string;
}

export const BOMFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const bomId = (route.params as any)?.bomId;
    const isEditing = !!bomId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        productName: '',
        quantity: '',
        unit: 'pcs',
        status: 'active',
    });
    const [components, setComponents] = useState<ComponentRow[]>([
        { componentName: '', quantity: '', unit: 'pcs' },
    ]);

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [bomId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.billOfMaterials.getById(bomId.toString());
            const data = response.data;
            setFormData({
                productName: data.productName || '',
                quantity: data.quantity?.toString() || '',
                unit: data.unit || 'pcs',
                status: data.status || 'active',
            });
            if (data.components && data.components.length > 0) {
                setComponents(data.components.map((c: any) => ({
                    componentName: c.componentName || '',
                    quantity: c.quantity?.toString() || '',
                    unit: c.unit || 'pcs',
                })));
            }
        } catch (error) {
            console.error('Failed to fetch BOM:', error);
            Alert.alert('Error', 'Failed to load BOM details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = () => {
        setComponents(prev => [...prev, { componentName: '', quantity: '', unit: 'pcs' }]);
    };

    const handleRemoveComponent = (index: number) => {
        setComponents(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateComponent = (index: number, field: keyof ComponentRow, value: string) => {
        setComponents(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    const handleSave = async () => {
        if (!formData.productName.trim()) {
            Alert.alert('Validation Error', 'Please enter product name');
            return;
        }
        if (!formData.quantity.trim()) {
            Alert.alert('Validation Error', 'Please enter quantity');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                components,
            };

            if (isEditing) {
                await api.billOfMaterials.update(bomId.toString(), payload);
                Alert.alert('Success', 'BOM updated successfully');
            } else {
                await api.billOfMaterials.create(payload);
                Alert.alert('Success', 'BOM created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save BOM:', error);
            Alert.alert('Error', error.message || 'Failed to save BOM');
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
            <MainLayout currentRoute="BillOfMaterials" title="Bill of Materials" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="BillOfMaterials" title="Bill of Materials" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Product
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
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary, marginBottom: 8 }}>
                                Status
                            </Text>
                            <SegmentedButtons
                                value={formData.status}
                                onValueChange={(value) => updateField('status', value)}
                                buttons={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Components
                            </Text>

                            {components.map((component, index) => (
                                <View key={index} style={styles.componentRow}>
                                    <View style={styles.componentFields}>
                                        <TextInput
                                            label="Component Name"
                                            value={component.componentName}
                                            onChangeText={(value) => handleUpdateComponent(index, 'componentName', value)}
                                            mode="outlined"
                                            style={styles.componentInput}
                                            outlineColor={themeColors.neutral[300]}
                                            activeOutlineColor={themeColors.primary.main}
                                        />
                                        <View style={styles.row}>
                                            <TextInput
                                                label="Qty"
                                                value={component.quantity}
                                                onChangeText={(value) => handleUpdateComponent(index, 'quantity', value)}
                                                mode="outlined"
                                                keyboardType="numeric"
                                                style={[styles.componentInput, styles.halfInput]}
                                                outlineColor={themeColors.neutral[300]}
                                                activeOutlineColor={themeColors.primary.main}
                                            />
                                            <TextInput
                                                label="Unit"
                                                value={component.unit}
                                                onChangeText={(value) => handleUpdateComponent(index, 'unit', value)}
                                                mode="outlined"
                                                style={[styles.componentInput, styles.halfInput]}
                                                outlineColor={themeColors.neutral[300]}
                                                activeOutlineColor={themeColors.primary.main}
                                            />
                                        </View>
                                    </View>
                                    {components.length > 1 && (
                                        <IconButton
                                            icon="delete"
                                            iconColor={themeColors.error.main}
                                            size={20}
                                            onPress={() => handleRemoveComponent(index)}
                                            style={styles.deleteButton}
                                        />
                                    )}
                                </View>
                            ))}

                            <Button
                                mode="outlined"
                                icon="plus"
                                onPress={handleAddComponent}
                                style={styles.addButton}
                                textColor={themeColors.primary.main}
                            >
                                Add Component
                            </Button>
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
                        {isEditing ? 'Update BOM' : 'Create BOM'}
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
    componentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    componentFields: { flex: 1 },
    componentInput: { marginBottom: 8 },
    deleteButton: { marginTop: 8 },
    addButton: { marginTop: 8 },
});
