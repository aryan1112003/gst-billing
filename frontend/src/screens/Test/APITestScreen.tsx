import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { MainLayout } from '../../components/Layout/MainLayout';
import { customersAPI, itemsAPI, vendorsAPI, invoicesAPI, emailAPI } from '../../services/api';
import { colors } from '../../theme/colors';

export const APITestScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const addResult = (message: string) => {
    setResults(prev => prev + '\n' + message);
  };

  const testCustomersAPI = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Customers API ===');
      
      const response = await customersAPI.getAll({ page: 1, limit: 5 });
      addResult(`✅ Fetched ${response.data?.length || 0} customers`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testItemsAPI = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Items API ===');
      
      const response = await itemsAPI.getAll({ page: 1, limit: 5 });
      addResult(`✅ Fetched ${response.data?.length || 0} items`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testVendorsAPI = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Vendors API ===');
      
      const response = await vendorsAPI.getAll({ page: 1, limit: 5 });
      addResult(`✅ Fetched ${response.data?.length || 0} vendors`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testInvoicesAPI = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Invoices API ===');
      
      const response = await invoicesAPI.getAll({ page: 1, limit: 5 });
      addResult(`✅ Fetched ${response.data?.length || 0} invoices`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testEmailAPI = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Email API ===');
      
      const response = await emailAPI.testConnection();
      addResult(`✅ Email service: ${response.message}`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateCustomer = async () => {
    try {
      setLoading(true);
      addResult('=== Testing Create Customer ===');
      
      const testCustomer = {
        name: 'Test Customer ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        phone: '1234567890',
        customer_type: 'business',
        gst_treatment: 'registered_business_regular',
      };
      
      const response = await customersAPI.create(testCustomer);
      addResult(`✅ Customer created with ID: ${response.data?.id || response.id}`);
      addResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults('');
  };

  return (
    <MainLayout title="API Test">
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              API Service Test
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Test all API endpoints to verify backend connection
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={testCustomersAPI}
                disabled={loading}
                style={styles.button}
              >
                Test Customers API
              </Button>

              <Button
                mode="contained"
                onPress={testItemsAPI}
                disabled={loading}
                style={styles.button}
              >
                Test Items API
              </Button>

              <Button
                mode="contained"
                onPress={testVendorsAPI}
                disabled={loading}
                style={styles.button}
              >
                Test Vendors API
              </Button>

              <Button
                mode="contained"
                onPress={testInvoicesAPI}
                disabled={loading}
                style={styles.button}
              >
                Test Invoices API
              </Button>

              <Button
                mode="contained"
                onPress={testEmailAPI}
                disabled={loading}
                style={styles.button}
              >
                Test Email API
              </Button>

              <Button
                mode="contained"
                onPress={testCreateCustomer}
                disabled={loading}
                style={[styles.button, styles.createButton]}
              >
                Test Create Customer
              </Button>

              <Button
                mode="outlined"
                onPress={clearResults}
                disabled={loading}
                style={styles.button}
              >
                Clear Results
              </Button>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <Text style={styles.loadingText}>Testing API...</Text>
              </View>
            )}

            {results && (
              <View style={styles.resultsContainer}>
                <Text variant="titleMedium" style={styles.resultsTitle}>
                  Results:
                </Text>
                <ScrollView style={styles.resultsScroll}>
                  <Text style={styles.resultsText}>{results}</Text>
                </ScrollView>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: colors.success.main,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text.secondary,
  },
  resultsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    maxHeight: 400,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultsScroll: {
    maxHeight: 300,
  },
  resultsText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
