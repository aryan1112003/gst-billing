import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface InvoiceStatsProps {
  stats: {
    draft: { count: number; amount: number };
    pending: { count: number; amount: number };
    paid: { count: number; amount: number };
    overdue: { count: number; amount: number };
    partiallyPaid?: { count: number; amount: number };
  };
}

export const InvoiceStats: React.FC<InvoiceStatsProps> = ({ stats }) => {
  const totalInvoices = 
    stats.draft.count + 
    stats.pending.count + 
    stats.paid.count + 
    stats.overdue.count +
    (stats.partiallyPaid?.count || 0);

  const totalAmount = 
    stats.draft.amount + 
    stats.pending.amount + 
    stats.paid.amount + 
    stats.overdue.amount +
    (stats.partiallyPaid?.amount || 0);

  const outstanding = 
    stats.pending.amount + 
    stats.overdue.amount +
    (stats.partiallyPaid?.amount || 0);

  const collectionRate = totalAmount > 0 
    ? ((stats.paid.amount / totalAmount) * 100).toFixed(1)
    : '0.0';

  return (
    <View style={styles.container}>
      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, styles.totalCard]}>
          <View style={styles.cardContent}>
            <MaterialIcons name="receipt" size={32} color="#4A90E2" />
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>Total Invoices</Text>
              <Text style={styles.cardValue}>{totalInvoices}</Text>
              <Text style={styles.cardAmount}>₹{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.summaryCard, styles.collectedCard]}>
          <View style={styles.cardContent}>
            <MaterialIcons name="check-circle" size={32} color="#56ab2f" />
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>Collected</Text>
              <Text style={styles.cardValue}>{stats.paid.count}</Text>
              <Text style={styles.cardAmount}>₹{stats.paid.amount.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.summaryCard, styles.outstandingCard]}>
          <View style={styles.cardContent}>
            <MaterialIcons name="schedule" size={32} color="#f7971e" />
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>Outstanding</Text>
              <Text style={styles.cardValue}>
                {stats.pending.count + stats.overdue.count + (stats.partiallyPaid?.count || 0)}
              </Text>
              <Text style={styles.cardAmount}>₹{outstanding.toLocaleString()}</Text>
            </View>
          </View>
        </Card>

        <Card style={[styles.summaryCard, styles.rateCard]}>
          <View style={styles.cardContent}>
            <MaterialIcons name="trending-up" size={32} color="#9b59b6" />
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>Collection Rate</Text>
              <Text style={styles.cardValue}>{collectionRate}%</Text>
              <Text style={styles.cardSubtext}>of total billed</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Status Breakdown Cards */}
      <View style={styles.statusRow}>
        {/* Draft */}
        <Card style={[styles.statusCard, { borderLeftColor: '#6c757d' }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: '#6c757d' }]} />
              <Text style={styles.statusLabel}>DRAFT</Text>
            </View>
            <Text style={styles.statusCount}>{stats.draft.count}</Text>
            <Text style={styles.statusAmount}>₹{stats.draft.amount.toLocaleString()}</Text>
            <View style={styles.statusBar}>
              <View 
                style={[
                  styles.statusBarFill, 
                  { 
                    width: `${totalInvoices > 0 ? (stats.draft.count / totalInvoices) * 100 : 0}%`,
                    backgroundColor: '#6c757d'
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Pending */}
        <Card style={[styles.statusCard, { borderLeftColor: '#f7971e' }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: '#f7971e' }]} />
              <Text style={styles.statusLabel}>PENDING</Text>
            </View>
            <Text style={styles.statusCount}>{stats.pending.count}</Text>
            <Text style={styles.statusAmount}>₹{stats.pending.amount.toLocaleString()}</Text>
            <View style={styles.statusBar}>
              <View 
                style={[
                  styles.statusBarFill, 
                  { 
                    width: `${totalInvoices > 0 ? (stats.pending.count / totalInvoices) * 100 : 0}%`,
                    backgroundColor: '#f7971e'
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Partially Paid */}
        {stats.partiallyPaid && stats.partiallyPaid.count > 0 && (
          <Card style={[styles.statusCard, { borderLeftColor: '#e67e22' }]}>
            <View style={styles.statusContent}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusDot, { backgroundColor: '#e67e22' }]} />
                <Text style={styles.statusLabel}>PARTIAL</Text>
              </View>
              <Text style={styles.statusCount}>{stats.partiallyPaid.count}</Text>
              <Text style={styles.statusAmount}>₹{stats.partiallyPaid.amount.toLocaleString()}</Text>
              <View style={styles.statusBar}>
                <View 
                  style={[
                    styles.statusBarFill, 
                    { 
                      width: `${totalInvoices > 0 ? (stats.partiallyPaid.count / totalInvoices) * 100 : 0}%`,
                      backgroundColor: '#e67e22'
                    }
                  ]} 
                />
              </View>
            </View>
          </Card>
        )}

        {/* Paid */}
        <Card style={[styles.statusCard, { borderLeftColor: '#56ab2f' }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: '#56ab2f' }]} />
              <Text style={styles.statusLabel}>PAID</Text>
            </View>
            <Text style={styles.statusCount}>{stats.paid.count}</Text>
            <Text style={styles.statusAmount}>₹{stats.paid.amount.toLocaleString()}</Text>
            <View style={styles.statusBar}>
              <View 
                style={[
                  styles.statusBarFill, 
                  { 
                    width: `${totalInvoices > 0 ? (stats.paid.count / totalInvoices) * 100 : 0}%`,
                    backgroundColor: '#56ab2f'
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Overdue */}
        <Card style={[styles.statusCard, { borderLeftColor: '#c94b4b' }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusDot, { backgroundColor: '#c94b4b' }]} />
              <Text style={styles.statusLabel}>OVERDUE</Text>
            </View>
            <Text style={styles.statusCount}>{stats.overdue.count}</Text>
            <Text style={styles.statusAmount}>₹{stats.overdue.amount.toLocaleString()}</Text>
            <View style={styles.statusBar}>
              <View 
                style={[
                  styles.statusBarFill, 
                  { 
                    width: `${totalInvoices > 0 ? (stats.overdue.count / totalInvoices) * 100 : 0}%`,
                    backgroundColor: '#c94b4b'
                  }
                ]} 
              />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  totalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  collectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#56ab2f',
  },
  outstandingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f7971e',
  },
  rateCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cardSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statusCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
  },
  statusContent: {
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  statusCount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  statusBar: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
