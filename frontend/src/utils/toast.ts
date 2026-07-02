import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility.
 * On web, showAlert() is blocked by browsers in async callbacks.
 * This uses window.alert for errors and console + no-op for success on web.
 * A banner/snackbar component should replace this in the future.
 */
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    // window.alert works for errors; for success just log
    // eslint-disable-next-line no-console
    console.info(`[${title}] ${message}`);
    try {
      // Use a non-blocking approach — create a temporary DOM notification
      const div = (window as any).document.createElement('div');
      const isError = title.toLowerCase().includes('error') || title.toLowerCase().includes('fail');
      div.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 99999;
        background: ${isError ? '#d32f2f' : '#2e7d32'};
        color: #fff; padding: 12px 20px; border-radius: 8px;
        font-family: sans-serif; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 320px;
        animation: slideIn 0.3s ease;
      `;
      div.textContent = message ? `${title}: ${message}` : title;
      (window as any).document.body.appendChild(div);
      setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s';
        setTimeout(() => div.remove(), 500);
      }, 3000);
    } catch {
      // fallback — do nothing
    }
  } else {
    Alert.alert(title, message);
  }
}

export function showSuccess(message: string) {
  showAlert('Success', message);
}

export function showError(message: string) {
  showAlert('Error', message);
}
