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
    projectName: string;
    customerName: string;
    startDate: string;
    endDate: string;
    budget: string;
    billedAmount: string;
    status: string;
    description: string;
}

export const ProjectFormScreen: React.FC = () => {
    const { rs } = useResponsive();
    const navigation = useNavigation() as any;
    const route = useRoute() as any;
    const { colors: themeColors } = useTheme();
    const projectId = (route.params as any)?.projectId;
    const isEditing = !!projectId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        projectName: '',
        customerName: '',
        startDate: '',
        endDate: '',
        budget: '',
        billedAmount: '',
        status: 'planning',
        description: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchRecord();
        }
    }, [projectId]);

    const fetchRecord = async () => {
        try {
            setLoading(true);
            const response = await api.projects.getById(projectId.toString());
            const data = response.data;
            setFormData({
                projectName: data.projectName || '',
                customerName: data.customerName || '',
                startDate: data.startDate || '',
                endDate: data.endDate || '',
                budget: data.budget?.toString() || '',
                billedAmount: data.billedAmount?.toString() || '',
                status: data.status || 'planning',
                description: data.description || '',
            });
        } catch (error) {
            console.error('Failed to fetch project:', error);
            Alert.alert('Error', 'Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.projectName.trim()) {
            Alert.alert('Validation Error', 'Please enter project name');
            return;
        }
        if (!formData.customerName.trim()) {
            Alert.alert('Validation Error', 'Please enter customer name');
            return;
        }
        if (!formData.startDate.trim()) {
            Alert.alert('Validation Error', 'Please enter start date');
            return;
        }

        try {
            setSaving(true);
            const payload = { ...formData };

            if (isEditing) {
                await api.projects.update(projectId.toString(), payload);
                Alert.alert('Success', 'Project updated successfully');
            } else {
                await api.projects.create(payload);
                Alert.alert('Success', 'Project created successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            console.error('Failed to save project:', error);
            Alert.alert('Error', error.message || 'Failed to save project');
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
            <MainLayout currentRoute="Projects" title="Projects" onNavigate={handleNavigate}>
                <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.primary.main} />
                    </View>
                </View>
            </MainLayout>
        );
    }

    return (
        <MainLayout currentRoute="Projects" title="Projects" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }]}>

                    <Card style={[styles.card, { backgroundColor: themeColors.surface.card }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text.primary }]}>
                                Project Details
                            </Text>
                            <TextInput
                                label="Project Name *"
                                value={formData.projectName}
                                onChangeText={(value) => updateField('projectName', value)}
                                mode="outlined"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
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
                                Timeline
                            </Text>
                            <TextInput
                                label="Start Date *"
                                value={formData.startDate}
                                onChangeText={(value) => updateField('startDate', value)}
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
                                Budget
                            </Text>
                            <TextInput
                                label="Budget (₹)"
                                value={formData.budget}
                                onChangeText={(value) => updateField('budget', value)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineColor={themeColors.neutral[300]}
                                activeOutlineColor={themeColors.primary.main}
                            />
                            <TextInput
                                label="Billed Amount (₹)"
                                value={formData.billedAmount}
                                onChangeText={(value) => updateField('billedAmount', value)}
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
                                    { value: 'planning', label: 'Planning' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'on-hold', label: 'On Hold' },
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
                                Description
                            </Text>
                            <TextInput
                                label="Description"
                                value={formData.description}
                                onChangeText={(value) => updateField('description', value)}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
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
                        {isEditing ? 'Update Project' : 'Create Project'}
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
