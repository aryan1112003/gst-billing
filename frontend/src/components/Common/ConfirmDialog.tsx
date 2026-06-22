import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}) => {
  // Determine icon based on title or type
  const getIconName = () => {
    if (title === 'Success') return 'check-circle';
    if (title === 'Error') return 'error';
    return type === 'danger' ? 'warning' : type === 'warning' ? 'error-outline' : 'info';
  };
  
  const getIconColor = () => {
    if (title === 'Success') return colors.success.main;
    if (title === 'Error') return colors.error.main;
    return type === 'danger' ? colors.error.main : type === 'warning' ? colors.warning.main : colors.primary.main;
  };

  const iconName = getIconName();
  const iconColor = getIconColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View style={styles.dialogWrapper}>
          <View style={styles.dialog}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>

              <MaterialIcons name={iconName} size={48} color={iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {title !== 'Success' && title !== 'Error' && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton, 
                  { backgroundColor: iconColor },
                  (title === 'Success' || title === 'Error') && styles.singleButton
                ]}
                onPress={title === 'Success' || title === 'Error' ? onCancel : onConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  {title === 'Success' || title === 'Error' ? 'OK' : confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.neutral[100],
  },
  confirmButton: {
    backgroundColor: colors.error.main,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  singleButton: {
    flex: 1,
    minWidth: 120,
  },
});
