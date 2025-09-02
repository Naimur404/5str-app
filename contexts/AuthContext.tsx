import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastGlobal } from './ToastContext';
import { removeAuthToken, getAuthToken } from '@/services/api';
import { globalEventEmitter } from '@/services/globalEventEmitter';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profile_image: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  trust_level: number;
  total_points: number;
  total_favorites: number;
  total_reviews: number;
  user_level: any;
  is_active: boolean;
  role: string;
  email_verified_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: (showMessage?: boolean) => Promise<void>;
  forceLogout: (reason?: string) => Promise<void>;
  updateUser: (user: User) => void;
  clearUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showWarning, showError, showSuccess } = useToastGlobal();

  // Check for existing auth token on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  // Listen for global force logout events
  useEffect(() => {
    const unsubscribe = globalEventEmitter.onForceLogout(({ reason }) => {
      console.log('🔐 AuthContext: Received force logout event:', reason);
      forceLogout(reason);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await getAuthToken();
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (token && storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('🔐 Auth restored from storage:', userData.name);
        
        // Emit auth state change
        globalEventEmitter.emitAuthStateChange(true, userData);
      } else {
        console.log('🔐 No existing auth found');
        setUser(null);
        setIsAuthenticated(false);
        
        // Emit auth state change
        globalEventEmitter.emitAuthStateChange(false);
      }
    } catch (error) {
      console.error('🔐 Error checking auth state:', error);
      setUser(null);
      setIsAuthenticated(false);
      globalEventEmitter.emitAuthStateChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      console.log('🔐 User logged in:', userData.name);
      
      // Emit auth state change
      globalEventEmitter.emitAuthStateChange(true, userData);
    } catch (error) {
      console.error('🔐 Error during login:', error);
      throw error;
    }
  };

  const clearUserData = async () => {
    try {
      await removeAuthToken();
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('user_profile_cache');
      await AsyncStorage.removeItem('home_data_cache');
      await AsyncStorage.removeItem('location_cache');
      setUser(null);
      setIsAuthenticated(false);
      console.log('🔐 User data cleared');
      
      // Emit auth state change
      globalEventEmitter.emitAuthStateChange(false);
    } catch (error) {
      console.error('🔐 Error clearing user data:', error);
    }
  };

  const logout = async (showMessage: boolean = true) => {
    try {
      console.log('🔐 User logout initiated');
      await clearUserData();
      
      if (showMessage) {
        showSuccess('You have been logged out successfully');
      }
    } catch (error) {
      console.error('🔐 Error during logout:', error);
      if (showMessage) {
        showError('Logout failed, but local data was cleared');
      }
    }
  };

  const forceLogout = async (reason?: string) => {
    try {
      console.log('🔐 Force logout triggered:', reason || 'Authentication expired');
      await clearUserData();
      
      const message = reason || 'Your session has expired. You are now browsing as a guest.';
      showWarning(message);
      
      console.log('🔐 User switched to guest mode');
    } catch (error) {
      console.error('🔐 Error during force logout:', error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('user_data', JSON.stringify(userData));
    console.log('🔐 User data updated:', userData.name);
    
    // Emit auth state change
    globalEventEmitter.emitAuthStateChange(true, userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    forceLogout,
    updateUser,
    clearUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
