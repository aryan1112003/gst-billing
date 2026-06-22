import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Card, Title, Paragraph, Button, Divider, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { Customer } from '../../types';

export const CustomerDetailScreen: React.FC = ({ route, navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { customerId } = route.params;

  const s = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
    },
    businessItem: {
      width: isDesktop ? '30%' : isMobile ? '100%' : '48%',
      marginBottom: 16,
    },
    transactionItem: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    actionButton: {
      width: isDesktop ? '30%' : isMobile ? '100%' : '48%',
      marginBottom: 8,
    },
    mainLayout: {
      flexDirection: rs('column', 'row', 'row') as any,
    },
    infoPanelFlex: {
      flex: rs(undefined, 2, 2) as any,
    },
  }), [isMobile, isTablet, isDesktop]);
  
  // Mock data - replace with actual data from Redux store
  const mockCustomer: Customer = {
    id: customerId,
    name: 'ABC Corporation',
    email: 'contact@abc.com',
    phone: '+91 9876543210',
    address: {
      street: '123 Business Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
    },
    gstin: '27ABCDE1234F1Z5',
    creditLimit: 100000,
    paymentTerms: 30,
    isActive: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-11-01'),
  };

  const mockTransactions = [
    { id: '1', type: 'Invoice', number: 'INV-001', amount: 25000, date: '2023-11-01', status: 'Paid' },
    { id: '2', type: 'Invoice', number: 'INV-002', amount: 15000, date: '2023-10-28', status: 'Pending' },
    { id: '3', type: 'Payment', number: 'PAY-001', amount: 25000, date: '2023-11-02', status: 'Received' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={s.mainLayout}>
        <View style={s.infoPanelFlex}>
      <Card style={styles.section}>
        <Card.Content>
          <View style={s.header}>
            <View style={styles.headerInfo}>
              <Title>{mockCustomer.name}</Title>
              {isMobile ? (
                <Text style={{
                  color: mockCustomer.isActive ? '#4CAF50' : '#F44336',
                  fontWeight: '700',
                  fontSize: 12,
                }}>
                  {mockCustomer.isActive ? 'Active' : 'Inactive'}
                </Text>
              ) : (
                <Chip mode="outlined" compact style={styles.statusChip}>
                  {mockCustomer.isActive ? 'Active' : 'Inactive'}
                </Chip>
              )}
            </View>
            <Button
              mode="outlined"
              icon="edit"
              onPress={() => navigation.navigate('CustomerForm', { customerId })}
            >
              Edit
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Title>Contact Information</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#666" />
            <Paragraph style={styles.infoText}>{mockCustomer.email}</Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#666" />
            <Paragraph style={styles.infoText}>{mockCustomer.phone}</Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Paragraph style={styles.infoText}>
              {mockCustomer.address.street}, {mockCustomer.address.city}, {mockCustomer.address.state} - {mockCustomer.address.zipCode}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Title>Business Information</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.businessInfo}>
            <View style={s.businessItem}>
              <Paragraph style={styles.label}>GSTIN</Paragraph>
              <Paragraph style={styles.value}>{mockCustomer.gstin || 'N/A'}</Paragraph>
            </View>

            <View style={s.businessItem}>
              <Paragraph style={styles.label}>Credit Limit</Paragraph>
              <Paragraph style={styles.value}>₹{mockCustomer.creditLimit?.toLocaleString() || 'N/A'}</Paragraph>
            </View>

            <View style={s.businessItem}>
              <Paragraph style={styles.label}>Payment Terms</Paragraph>
              <Paragraph style={styles.value}>{mockCustomer.paymentTerms} days</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Title>Recent Transactions</Title>
          <Divider style={styles.divider} />
          
          {mockTransactions.map((transaction) => (
            <View key={transaction.id} style={s.transactionItem}>
              <View style={styles.transactionInfo}>
                <Paragraph style={styles.transactionType}>{transaction.type} {transaction.number}</Paragraph>
                <Paragraph style={styles.transactionDate}>{transaction.date}</Paragraph>
              </View>
              <View style={styles.transactionAmount}>
                <Paragraph style={styles.amount}>₹{transaction.amount.toLocaleString()}</Paragraph>
                {isMobile ? (
                  <Text style={{
                    color: transaction.status === 'Paid' ? '#4CAF50' : transaction.status === 'Pending' ? '#FF9800' : '#F44336',
                    fontWeight: '700',
                    fontSize: 12,
                  }}>
                    {transaction.status}
                  </Text>
                ) : (
                  <Chip mode="outlined" compact textStyle={styles.statusText}>
                    {transaction.status}
                  </Chip>
                )}
              </View>
            </View>
          ))}
          
          <Button
            mode="outlined"
            style={styles.viewAllButton}
            onPress={() => {
              // Navigate to full transaction history
            }}
          >
            View All Transactions
          </Button>
        </Card.Content>
      </Card>

        </View>

        {/* Summary / Quick Actions card — side by side on tablet+ */}
        <View style={{ flex: 1, marginLeft: isMobile ? 0 : 16, marginTop: isMobile ? 0 : 0 }}>
          <Card style={styles.section}>
            <Card.Content>
              <Title>Quick Actions</Title>
              <Divider style={styles.divider} />
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  icon="receipt"
                  style={s.actionButton}
                  onPress={() => navigation.navigate('InvoiceForm', { customerId })}
                >
                  Create Invoice
                </Button>
                <Button
                  mode="outlined"
                  icon="payment"
                  style={s.actionButton}
                  onPress={() => navigation.navigate('PaymentForm', { customerId })}
                >
                  Record Payment
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    margin: 8,
  },
  headerInfo: {
    flex: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  businessInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '500',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
  },
  viewAllButton: {
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});