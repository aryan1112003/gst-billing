import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Dialog, Button, Text, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { EmailPreviewModal } from '../Common/EmailPreviewModal';

interface EmailPurchaseDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSend: (data: { to: string[]; cc?: string[]; subject: string; message: string }) => void;
  poNumber: string;
  vendorEmail?: string;
  vendorName?: string;
  totalAmount?: string;
  senderEmail?: string; // Email of the logged-in user sending the purchase order
  loading?: boolean;
}

export const EmailPurchaseDialog: React.FC<EmailPurchaseDialogProps> = ({
  visible,
  onDismiss,
  onSend,
  poNumber,
  vendorEmail,
  vendorName,
  totalAmount,
  senderEmail,
  loading = false
}) => {
  const [to, setTo] = useState(vendorEmail || '');
  const [cc, setCc] = useState(senderEmail || ''); // Auto-fill CC with sender's email
  const [subject, setSubject] = useState(`Purchase Order ${poNumber}`);
  const [message, setMessage] = useState(`Please find attached purchase order ${poNumber}.`);

  // Preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Update state when props change (when a new purchase order is selected)
  useEffect(() => {
    setTo(vendorEmail || '');
    setCc(senderEmail || '');
    setSubject(`Purchase Order ${poNumber}`);
    setMessage(`Please find attached purchase order ${poNumber}.`);
  }, [vendorEmail, senderEmail, poNumber]);

  const handlePreview = async () => {
    setPreviewHtml(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewVisible(true);
    try {
      const response = await api.email.preview({
        type: 'purchase',
        invoiceNumber: poNumber,
        customerName: vendorName || 'Vendor',
        amount: totalAmount || '0.00',
      });
      const html = response?.data?.html || response?.html || null;
      setPreviewHtml(html);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = () => {
    const toEmails = to.split(',').map(e => e.trim()).filter(e => e);
    const ccEmails = cc ? cc.split(',').map(e => e.trim()).filter(e => e) : undefined;

    onSend({
      to: toEmails,
      cc: ccEmails,
      subject,
      message
    });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title>Send Purchase Order via Email</Dialog.Title>
      <Dialog.ScrollArea>
        <ScrollView>
          <View style={styles.content}>
            {/* Email Recipients Display Section */}
            <View style={styles.recipientsDisplay}>
              <View style={styles.recipientHeader}>
                <MaterialIcons name="email" size={20} color={colors.primary.main} />
                <Text style={styles.recipientHeaderText}>Email Recipients</Text>
              </View>

              {/* TO Section */}
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>TO:</Text>
                <View style={styles.recipientInfo}>
                  <MaterialIcons name="business" size={18} color={colors.primary.main} />
                  <Text style={styles.recipientEmail}>{to || 'vendor@example.com'}</Text>
                </View>
              </View>

              {/* CC Section */}
              {!!cc && (
                <View style={styles.recipientRow}>
                  <Text style={styles.recipientLabel}>CC:</Text>
                  <View style={styles.recipientInfo}>
                    <MaterialIcons name="person" size={18} color={colors.secondary.main} />
                    <Text style={styles.recipientEmailCc}>{cc}</Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.label}>To: *</Text>
            <TextInput
              style={styles.input}
              value={to}
              onChangeText={setTo}
              placeholder="vendor@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>CC:</Text>
            <TextInput
              style={styles.input}
              value={cc}
              onChangeText={setCc}
              placeholder="cc@example.com (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Subject: *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject"
            />

            <Text style={styles.label}>Message:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Email message"
              multiline
              numberOfLines={4}
            />

            <View style={styles.info}>
              <Chip icon="attachment" style={styles.chip}>PDF will be attached</Chip>
            </View>
          </View>
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss} disabled={loading}>Cancel</Button>
        <Button
          onPress={handlePreview}
          disabled={loading}
          icon="eye"
        >
          Preview
        </Button>
        <Button onPress={handleSend} mode="contained" loading={loading} disabled={!to || loading}>
          Send
        </Button>
      </Dialog.Actions>

      <EmailPreviewModal
        visible={previewVisible}
        onDismiss={() => setPreviewVisible(false)}
        html={previewHtml}
        loading={previewLoading}
        error={previewError}
      />
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  content: {
    paddingHorizontal: 24,
  },
  recipientsDisplay: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.main + '40',
  },
  recipientHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  recipientRow: {
    marginBottom: 8,
  },
  recipientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
  },
  recipientEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.main,
    flex: 1,
  },
  recipientEmailCc: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary.main,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    backgroundColor: colors.surface.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  info: {
    marginTop: 16,
  },
  chip: {
    alignSelf: 'flex-start',
  },
});
