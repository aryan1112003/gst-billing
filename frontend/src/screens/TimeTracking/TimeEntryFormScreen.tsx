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
    projectName: string;
    workDate: string;
    hours: string;
    description: string;
    billable: string;
    billed: string;
    hourlyRate: string;
}

export const TimeEntryFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const timeEntryId = (route.params as any)?.timeEntryId;
    const isEditing = !!timeEntryId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        customerName: '',
        projectName: '',
        workDate: '',
        hours: '',
        description: '',
        billable: '1',
        billed: '0',
        hourlyRate: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [timeEntryId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.timeTracking.getById(timeEntryId.toString());
            const data = response.data;
            setFormData({
                customerName: data.customerName || '',
                projectName: data.projectName || '',
                workDate: data.workDate || '',
                hours: data.hours?.toString() || '',
                description: data.description || '',
                billable: data.billable ? '1' : '0',
                billed: data.billed ? '1' : '0',
                hourlyRate: data.hourlyRate?.toString() || '',
            });
        } catch (error) {
            console.error('Failed to fetch time entry:', error);
            Alert.alert('Error', 'Failed to load time entry details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.customerName.trim()) {
            Alert.alert('Validation Error', 'Please enter customer name');
            return;
        }
        if (!formData.projectName.trim()) {
            Alert.alert('Validation Error', 'Please enter project name');
            return;
        }
        if (!formData.workDate.trim()) {
            Alert.alert('Validation Error', 'Please enter work date');
            return;
        }
        if (!formData.hours.trim()) {
            Alert.alert('Validation Error', 'Please enter hours');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                hours: Number(formData.hours),
                hourlyRate: Number(formData.hourlyRate),
                billable: formData.billable === '1',
                billed: formData.billed === '1',
            };

            if (isEditing) {
                await api.timeTracking.update(timeEntryId.toString(), payload);
                Alert.alert('Success', 'Time entry updated successfully');
            } else {
                await api.timeTracking.create(payload);
                Alert.alert('Success', 'Time entry created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save time entry:', error);
            Alert.alert('Error', error.message || 'Failed to save time entry');
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
            <MainLayout currentRoute="TimeTracking" title="Time Tracking" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="TimeTracking" title="Time Tracking" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Project
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
                            <TextInput
                                label="Project Name *"
                                value={formData.projectName}
                                onChangeText={(value) => updateField('projectName', value)}
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
                                Time
                            </Text>
                            <TextInput
                                label="Work Date *"
                                value={formData.workDate}
                                onChangeText={(value) => updateField('workDate', value)}
                                mode="outlined"
                                placeholder="YYYY-MM-DD"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    label="Hours *"
                                    value={formData.hours}
                                    onChangeText={(value) => updateField('hours', value)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    outlineColor={themeColors.neutral[300]}
                                    activeOutlineColor={themeColors.primary.main}
                                />
                                <TextInput
                                    label="Hourly Rate (₹)"
                                    value={formData.hourlyRate}
                                    onChangeText={(value) => updateField('hourlyRate', value)}
                                    mode="outlined"
                                    keyboardType="numeric"
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
                                Billing
                            </Text>
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary, marginBottom: 8 }}>
                                Billable
                            </Text>
                            <SegmentedButtons
                                value={formData.billable}
                                onValueChange={(value) => updateField('billable', value)}
                                buttons={[
                                    { value: '1', label: 'Yes' },
                                    { value: '0', label: 'No' },
                                ]}
                                style={styles.segmentedButtons}
                            />
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary, marginBottom: 8, marginTop: 8 }}>
                                Billed
                            </Text>
                            <SegmentedButtons
                                value={formData.billed}
                                onValueChange={(value) => updateField('billed', value)}
                                buttons={[
                                    { value: '1', label: 'Yes' },
                                    { value: '0', label: 'No' },
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
                        {isEditing ? 'Update Time Entry' : 'Create Time Entry'}
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
