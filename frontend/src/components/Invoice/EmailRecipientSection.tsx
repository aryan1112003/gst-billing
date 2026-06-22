import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Checkbox, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface EmailRecipientSectionProps {
  customerEmail: string;
  customerName: string;
  companyEmail?: string;
  sendEmail: boolean;
  onToggleSendEmail: (value: boolean) => void;
}

export const EmailRecipientSection: React.FC<EmailRecipientSectionProps> = ({
  customerEmail,
  customerName,
  companyEmail,
  sendEmail,
  onToggleSendEmail,
}) => {
  // Don't show if no customer email or if it's empty/whitespace
  if (!customerEmail || customerEmail.trim() === '') {
    return null;
  }

  return (
    <Card style={styles.container} elevation={2}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="email" size={24} color={colors.primary.main} />
        <Text style={styles.headerText}>Send Invoice To</Text>
      </View>

      {/* Checkbox */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          status={sendEmail ? 'checked' : 'unchecked'}
          onPress={() => onToggleSendEmail(!sendEmail)}
          color={colors.primary.main}
        />
        <Text style={styles.checkboxLabel}>Send invoice to customer email</Text>
      </View>

      {/* Email Details */}
      <View style={styles.detailsContainer}>
        {/* TO: Customer Email */}
        <View style={styles.emailSection}>
          <Text style={styles.emailLabel}>TO:</Text>
          <View style={styles.emailRow}>
            <MaterialIcons name="alternate-email" size={20} color={colors.primary.main} />
            <Text style={styles.emailText}>{customerEmail}</Text>
          </View>
          <View style={styles.customerRow}>
            <MaterialIcons name="person" size={18} color={colors.text.secondary} />
            <Text style={styles.customerText}>{customerName}</Text>
          </View>
        </View>

        {/* CC: Company Email */}
        {!!companyEmail && (
          <View style={styles.emailSection}>
            <Text style={styles.emailLabel}>CC:</Text>
            <View style={styles.emailRow}>
              <MaterialIcons name="business" size={20} color={colors.secondary.main} />
              <Text style={styles.ccEmailText}>{companyEmail}</Text>
            </View>
            <View style={styles.customerRow}>
              <MaterialIcons name="info-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.customerText}>Copy for your records</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Note */}
      {sendEmail && (
        <View style={styles.infoNote}>
          <MaterialIcons name="info" size={16} color="#856404" />
          <Text style={styles.infoText}>
            {companyEmail 
              ? 'Invoice will be sent to customer (TO) and copied to your company email (CC)'
              : 'Invoice will be sent to customer email'}
          </Text>
        </View>
      )}

      {/* Recipient Information Footer */}
      <View style={styles.recipientFooter}>
        <View style={styles.footerIconContainer}>
          <MaterialIcons name="mail-outline" size={18} color={colors.text.secondary} />
        </View>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerLabel}>Invoice will be sent to:</Text>
          <Text style={styles.footerEmail}>{customerEmail}</Text>
          {!!companyEmail && (
            <Text style={styles.footerCc}>CC: {companyEmail}</Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  emailSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    flex: 1,
  },
  ccEmailText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary.main,
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 32,
  },
  customerText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    flex: 1,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#856404',
    flex: 1,
    lineHeight: 18,
  },
  recipientFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 8,
  },
  footerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerTextContainer: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
    letterSpacing: 0.3,
  },
  footerCc: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary.main,
    marginTop: 4,
  },
});
