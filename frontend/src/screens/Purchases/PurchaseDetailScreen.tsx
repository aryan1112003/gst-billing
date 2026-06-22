import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

export const PurchaseDetailScreen: React.FC = ({ route, navigation }: any) => {
  const { purchaseId } = route.params;
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Content>
          <Title>Purchase Details</Title>
          <Paragraph>Purchase ID: {purchaseId}</Paragraph>
          <Button mode="outlined" onPress={() => navigation.navigate('PurchaseForm', { purchaseId })}>Edit</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f5f5' }, section: { margin: 8 } });