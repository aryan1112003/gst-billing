import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { itemsAPI } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export const ItemFormScreen: React.FC = ({ navigation, route }: any) => {
  const itemId = route?.params?.itemId;
  const isEditMode = !!itemId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'pcs',
    purchase_price: '',
    selling_price: '',
    current_stock: '0',
    min_stock_level: '0',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getById(itemId);
      const item = response.data || response;
      
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || 'pcs',
        purchase_price: String(item.purchase_price || ''),
        selling_price: String(item.selling_price || ''),
        current_stock: String(item.current_stock || '0'),
        min_stock_level: String(item.min_stock_level || '0'),
      });
    } catch (err: any) {
      console.error('Failed to fetch item:', err);
      Alert.alert('Error', err.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.sku.trim() || !formData.name.trim()) {
      Alert.alert('Validation Error', 'SKU and name are required');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
      };

      if (isEditMode) {
        await itemsAPI.update(itemId, submitData);
        setLoading(false);
        navigation.goBack();
      } else {
        await itemsAPI.create(submitData);
        setLoading(false);
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Failed to save item:', err);
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to save item');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <MainLayout currentRoute="Inventory" onNavigate={handleNavigate}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditMode ? 'Edit Item' : 'Add New Item'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKU *</Text>
              <TextInput
                mode="outlined"
                value={formData.sku}
                onChangeText={(text) => setFormData({ ...formData, sku: text.toUpperCase() })}
                placeholder="ITEM001"
                autoCapitalize="characters"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
                disabled={isEditMode}
              />
              <Text style={styles.helperText}>Unique product code</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter item name"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                mode="outlined"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter item description"
                multiline
                numberOfLines={2}
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                mode="outlined"
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="pcs, kg, ltr, etc."
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Purchase Price</Text>
                <TextInput
                  mode="outlined"
                  value={formData.purchase_price}
                  onChangeText={(text) => setFormData({ ...formData, purchase_price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  outlineColor={colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Selling Price</Text>
                <TextInput
                  mode="outlined"
                  value={formData.selling_price}
                  onChangeText={(text) => setFormData({ ...formData, selling_price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  outlineColor={colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Current Stock</Text>
                <TextInput
                  mode="outlined"
                  value={formData.current_stock}
                  onChangeText={(text) => setFormData({ ...formData, current_stock: text })}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.input}
                  outlineColor={colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Min Stock Level</Text>
                <TextInput
                  mode="outlined"
                  value={formData.min_stock_level}
                  onChangeText={(text) => setFormData({ ...formData, min_stock_level: text })}
                  placeholder="0"
                  keyboardType="number-pad"
                  style={styles.input}
                  outlineColor={colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonText}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              loading={loading}
              disabled={loading}
            >
              {isEditMode ? 'Update Item' : 'Create Item'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: screenWidth < 768 ? 16 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: screenWidth < 768 ? 20 : 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: screenWidth < 768 ? 16 : 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderColor: colors.neutral[300],
  },
  cancelButtonText: {
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
});
