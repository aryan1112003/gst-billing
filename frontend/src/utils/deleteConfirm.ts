import { Platform, Alert } from 'react-native';
import { showAlert, showSuccess, showError } from '../utils/toast';

// Global state for custom dialog (web only)
let showDialogCallback: ((props: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => void) | null = null;

export const setShowDialogCallback = (callback: typeof showDialogCallback) => {
  showDialogCallback = callback;
};

/**
 * Cross-platform delete confirmation dialog
 * Uses custom modal for web, Alert.alert for mobile
 */
export const confirmDelete = (
  itemName: string,
  onConfirm: () => void | Promise<void>,
  itemType: string = 'item'
): void => {
  if (Platform.OS === 'web') {
    // Web - use custom centered dialog if available, fallback to window.confirm
    if (showDialogCallback) {
      showDialogCallback({
        title: `Delete ${itemType}`,
        message: `Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`,
        onConfirm: () => onConfirm(),
        onCancel: () => {},
      });
    } else {
      // Fallback to native confirm
      const confirmed = window.confirm(
        `Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`
      );
      
      if (confirmed) {
        onConfirm();
      }
    }
  } else {
    // Mobile - use React Native Alert
    showAlert(
      `Delete ${itemType}`,
      `Are you sure you want to delete "${itemName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onConfirm(),
        },
      ]
    );
  }
};

/**
 * Show success message after deletion
 */
export const showDeleteSuccess = (itemType: string = 'Item'): void => {
  if (Platform.OS === 'web') {
    if (showDialogCallback) {
      showDialogCallback({
        title: 'Success',
        message: `${itemType} deleted successfully!`,
        onConfirm: () => {},
        onCancel: () => {},
      });
    } else {
      window.alert(`${itemType} deleted successfully!`);
    }
  } else {
    showSuccess(`${itemType} deleted successfully!`);
  }
};

/**
 * Show error message if deletion fails
 */
export const showDeleteError = (error: string, itemType: string = 'item'): void => {
  if (Platform.OS === 'web') {
    if (showDialogCallback) {
      showDialogCallback({
        title: 'Error',
        message: `Failed to delete ${itemType}: ${error}`,
        onConfirm: () => {},
        onCancel: () => {},
      });
    } else {
      window.alert(`Failed to delete ${itemType}: ${error}`);
    }
  } else {
    showError(`Failed to delete ${itemType}: ${error}`);
  }
};
