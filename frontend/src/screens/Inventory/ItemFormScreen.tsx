import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Card, Title, TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { MainLayout } from '../../components/Layout/MainLayout';
import { FormErrors } from '../../types';
import { itemsAPI } from '../../services/api';

export const ItemFormScreen: React.FC = ({ route, navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { colors: themeColors, isDarkMode } = useTheme();
  const { itemId } = route.params || {};
  const isEditing = !!itemId;

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'PCS',
    purchase_price: '',
    selling_price: '',
    current_stock: '',
    min_stock_level: '',
  });

  useEffect(() => {
    if (isEditing) {
      fetchItemData();
    }
  }, [itemId, isEditing]);

  const fetchItemData = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getById(itemId);
      const item = response.data || response;
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || 'PCS',
        purchase_price: String(item.purchase_price || ''),
        selling_price: String(item.selling_price || ''),
        current_stock: String(item.current_stock || ''),
        min_stock_level: String(item.min_stock_level || ''),
      });
    } catch (error: any) {
      console.error('Failed to fetch item:', error);
      Alert.alert('Error', 'Failed to load item data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.sku || !formData.name) {
      Alert.alert('Validation Error', 'SKU and Name are required');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
      };

      if (isEditing) {
        await itemsAPI.update(itemId, submitData);
        Alert.alert('Success', 'Item updated successfully!');
      } else {
        await itemsAPI.create(submitData);
        Alert.alert('Success', 'Item created successfully!');
      }

      navigation.goBack();

    } catch (error: any) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <MainLayout currentRoute="Items" onNavigate={handleNavigate}>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background.main }]}>
        <Card style={[styles.formCard, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
          <Card.Content style={{ maxWidth: rs(undefined, 800, 1100) as any, alignSelf: 'center', width: '100%' }}>
            <Title style={[styles.title, { color: themeColors.text.primary }]}>{isEditing ? 'Edit Item' : 'Add New Item'}</Title>

            {/* SKU */}
            <TextInput
              label="SKU *"
              value={formData.sku}
              onChangeText={(value) => updateField('sku', value)}
              mode="outlined"
              style={styles.input}
              disabled={isEditing}
              placeholder="e.g., LAPTOP001"
            />
            {isEditing && (
              <Text style={styles.helperText}>SKU cannot be changed</Text>
            )}

            {/* Item Name */}
            <TextInput
              label="Name *"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Dell Latitude 5520"
            />

            {/* Description */}
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Item description"
            />

            {/* Unit */}
            <TextInput
              label="Unit *"
              value={formData.unit}
              onChangeText={(value) => updateField('unit', value)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., PCS, KG, LTR"
            />

            {/* Purchase Price + Selling Price */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Purchase Price"
                  value={formData.purchase_price}
                  onChangeText={(value) => updateField('purchase_price', value)}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholder="0.00"
                  left={<TextInput.Affix text="₹" />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Selling Price *"
                  value={formData.selling_price}
                  onChangeText={(value) => updateField('selling_price', value)}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholder="0.00"
                  left={<TextInput.Affix text="₹" />}
                />
              </View>
            </View>

            {/* Current Stock + Min Stock Level */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Current Stock"
                  value={formData.current_stock}
                  onChangeText={(value) => updateField('current_stock', value)}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholder="0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Minimum Stock Level"
                  value={formData.min_stock_level}
                  onChangeText={(value) => updateField('min_stock_level', value)}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholder="0"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                {isEditing ? 'Update Item' : 'Create Item'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={3000}
        >
          <Text style={{ color: '#FFFFFF' }}>{snackbar.message}</Text>
        </Snackbar>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  formCard: {
    margin: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },
});