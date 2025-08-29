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
    console.log('🔥🔥🔥 ALERT BEING SHOWN 🔥🔥🔥');
    console.log('🔥 useCustomAlert: showAlert called with:', {
      title: options.title,
      message: options.message,
      type: options.type,
      buttons: options.buttons?.map(b => ({ text: b.text, hasHandler: !!b.onPress }))
    });
    console.log('🔥 Stack trace:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
    
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
    console.log('🔥 showConfirm called with:');
    console.log('🔥 - title:', title);
    console.log('🔥 - message:', message);
    console.log('🔥 - onConfirm handler:', typeof onConfirm);
    console.log('🔥 - onCancel handler:', typeof onCancel);
    
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const, onPress: onCancel },
      { text: 'Confirm', style: 'destructive' as const, onPress: onConfirm },
    ];
    
    console.log('🔥 - buttons created:', buttons.map(b => ({ text: b.text, hasHandler: !!b.onPress })));
    
    showAlert({
      title,
      message,
      type: 'warning',
      buttons,
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
