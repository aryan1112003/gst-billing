import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useResponsive } from '../../utils/responsive';

export const ExpenseDetailScreen: React.FC = ({ route, navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { expenseId } = route.params;
  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: rs('column', 'row', 'row') as any }}>
        <View style={{ flex: rs(undefined, 2, 2) as any }}>
          <Card style={styles.section}>
            <Card.Content>
              <Title>Expense Details</Title>
              <Paragraph>Expense ID: {expenseId}</Paragraph>
            </Card.Content>
          </Card>
        </View>
        <View style={{ flex: 1, marginLeft: isMobile ? 0 : 16, marginTop: isMobile ? 16 : 0 }}>
          <Card style={styles.section}>
            <Card.Content>
              <Button mode="outlined" onPress={() => navigation.navigate('ExpenseForm', { expenseId })}>Edit</Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f5f5' }, section: { margin: 8 } });