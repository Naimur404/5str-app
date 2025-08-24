import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig({
      ...options,
      visible: true,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Convenience methods for different alert types
  const showSuccess = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'success', buttons });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'error', buttons });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'warning', buttons });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, type: 'info', buttons });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', style: 'destructive', onPress: onConfirm },
      ],
    });
  }, [showAlert]);

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};
