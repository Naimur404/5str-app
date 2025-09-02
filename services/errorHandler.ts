import React from 'react';
import { useCustomAlert } from '@/hooks/useCustomAlert';

interface ApiError {
  message?: string;
  status?: number;
  errors?: any; // For validation errors
  type?: 'validation' | 'network' | 'server' | 'auth' | 'unknown';
}

class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private showAlert: ((title: string, message?: string) => void) | null = null;

  private constructor() {}

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  // Initialize with the alert function from useCustomAlert
  initialize(showAlert: (title: string, message?: string) => void) {
    console.log('🚨 ErrorHandler: Initializing with showAlert function');
    this.showAlert = showAlert;
  }

  // Handle API errors globally
  handleApiError(error: any, customMessage?: string) {
    console.log('🚨 ErrorHandler: handleApiError called with:', error);
    
    if (!this.showAlert) {
      console.warn('ErrorHandler not initialized with alert function - using console.error fallback');
      console.error('API Error:', customMessage || error?.message || 'Something went wrong');
      return;
    }

    // Don't show popup for validation errors - let the form handle them
    if (this.isValidationError(error)) {
      console.log('🚨 Validation error detected, not showing popup');
      return;
    }

    // Don't show popup for auth errors - these should be handled by auth flow
    if (this.isAuthError(error)) {
      console.log('🚨 Auth error detected, not showing popup');
      return;
    }

    // Show custom message or generic error message
    const title = "Oops!";
    const message = customMessage || this.getErrorMessage(error);
    
    console.log('🚨 Showing error popup:', { title, message });
    this.showAlert(title, message);
  }

  private isValidationError(error: any): boolean {
    // Check if error has validation error structure
    if (error && error.status === 422) return true;
    if (error && error.errors && typeof error.errors === 'object') return true;
    if (error && error.message && error.message.includes('validation')) return true;
    if (error && error.type === 'validation') return true;
    return false;
  }

  private isAuthError(error: any): boolean {
    // Check if error is authentication related
    if (error && (error.status === 401 || error.status === 403)) return true;
    if (error && error.message && error.message.includes('Authentication required')) return true;
    if (error && error.type === 'auth') return true;
    return false;
  }

  private getErrorMessage(error: any): string {
    // Network errors
    if (error && error.message && error.message.includes('Network error')) {
      return "Please check your internet connection and try again.";
    }

    // Server errors
    if (error && error.status >= 500) {
      return "Our servers are having trouble. Please try again in a few moments.";
    }

    // Rate limiting
    if (error && error.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // Generic server errors
    if (error && error.status >= 400 && error.status < 500) {
      return "Something went wrong with your request. Please try again.";
    }

    // Fallback for any other errors
    return "Something went wrong. Please try again.";
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlerService.getInstance();

// Simple function to handle API errors globally
export const handleApiError = (error: any, customMessage?: string) => {
  try {
    errorHandler.handleApiError(error, customMessage);
  } catch (handlerError) {
    console.warn('Error handler failed:', handlerError);
    console.error('Original API Error:', customMessage || error?.message || 'Something went wrong');
  }
};

// Hook to initialize error handler
export const useErrorHandler = () => {
  const { showError } = useCustomAlert();
  
  // Initialize the error handler with alert function
  React.useEffect(() => {
    console.log('🚨 useErrorHandler: Initializing error handler with showError');
    errorHandler.initialize(showError);
  }, [showError]);

  return {
    handleError: (error: any, customMessage?: string) => {
      errorHandler.handleApiError(error, customMessage);
    }
  };
};
