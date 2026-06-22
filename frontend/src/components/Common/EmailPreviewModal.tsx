import React from 'react';
import { View, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Modal, Portal, Button, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface EmailPreviewModalProps {
  visible: boolean;
  onDismiss: () => void;
  html: string | null;
  loading?: boolean;
  error?: string | null;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  visible,
  onDismiss,
  html,
  loading = false,
  error = null,
}) => {
  const { width, height } = useWindowDimensions();

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={40} color={colors.error?.main || '#e53e3e'} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!html) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No preview available</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: height * 0.65,
            border: 'none',
            borderRadius: 8,
          }}
          title="Email Preview"
          sandbox="allow-same-origin"
        />
      );
    }

    // Native fallback: simplified text representation
    // Strip HTML tags for plain-text display
    const plainText = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, '\n')
      .trim();

    return (
      <ScrollView style={styles.nativeScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.nativePreviewBox}>
          <View style={styles.nativeBanner}>
            <MaterialIcons name="email" size={20} color="#fff" />
            <Text style={styles.nativeBannerText}>Email Preview (plain text)</Text>
          </View>
          <Text style={styles.nativePlainText}>{plainText}</Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          Platform.OS === 'web' && { maxWidth: 680, width: '95%', alignSelf: 'center' },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="visibility" size={22} color={colors.primary.main} />
            <Text style={styles.title}>Email Preview</Text>
          </View>
          <Button onPress={onDismiss} compact>
            Close
          </Button>
        </View>

        <View style={styles.body}>{renderContent()}</View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 0,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: 8,
  },
  body: {
    minHeight: 200,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: 8,
  },
  errorText: {
    color: colors.error?.main || '#e53e3e',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: colors.text.secondary,
  },
  nativeScroll: {
    maxHeight: 400,
  },
  nativePreviewBox: {
    margin: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nativeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nativeBannerText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  nativePlainText: {
    padding: 16,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.primary,
    backgroundColor: '#f9fafb',
  },
});
