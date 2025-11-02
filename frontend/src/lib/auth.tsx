import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from './api';

// Define Host interface locally to avoid circular imports
interface Host {
  id: number;
  phone: string;
  name: string;
  is_setup_complete: boolean;
  created_at: string;
}

interface AuthContextType {
  host: Host | null;
  guestPhone: string | null;
  isAuthenticated: boolean; // True if either host or guest is authenticated
  isHostAuthenticated: boolean;
  isGuestAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>; // Host login
  signup: (phone: string, password: string, name: string) => Promise<void>;
  setup: (name: string) => Promise<void>;
  guestLogin: (phone: string) => void; // Guest login (phone only, stored in localStorage)
  logout: () => void;
  refreshHost: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [host, setHost] = useState<Host | null>(null);
  const [guestPhone, setGuestPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isHostAuthenticated = !!host;
  const isGuestAuthenticated = !!guestPhone;
  const isAuthenticated = isHostAuthenticated || isGuestAuthenticated;

  const refreshHost = async () => {
    try {
      const hostData = await apiClient.getCurrentHost();
      setHost(hostData);
    } catch (error) {
      console.error('Failed to refresh host data:', error);
      setHost(null);
      apiClient.setToken(null);
    }
  };

  const login = async (token: string) => {
    try {
      apiClient.setToken(token);
      await refreshHost();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (phone: string, password: string, name: string) => {
    try {
      await apiClient.signup({ phone, password, name });
      // After signup, automatically login
      const response = await apiClient.login({ phone, password });
      await login(response.access_token);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const setup = async (name: string) => {
    try {
      const updatedHost = await apiClient.setup({ name });
      setHost(updatedHost);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  };

  const guestLogin = (phone: string) => {
    setGuestPhone(phone);
    localStorage.setItem('guest_phone', phone);
  };

  const logout = () => {
    setHost(null);
    setGuestPhone(null);
    apiClient.setToken(null);
    // Clear all guest-related data from localStorage
    localStorage.removeItem('guest_phone');
    localStorage.removeItem('guest_rsvps');
  };

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for host authentication
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            apiClient.setToken(token);
            // Add timeout to prevent hanging
            await Promise.race([
              refreshHost(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth check timeout')), 5000)
              )
            ]);
          } catch (error) {
            console.error('Auth check failed:', error);
            apiClient.setToken(null);
          }
        }

        // Check for guest authentication
        const savedGuestPhone = localStorage.getItem('guest_phone');
        if (savedGuestPhone) {
          setGuestPhone(savedGuestPhone);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    host,
    guestPhone,
    isAuthenticated,
    isHostAuthenticated,
    isGuestAuthenticated,
    isLoading,
    login,
    signup,
    setup,
    guestLogin,
    logout,
    refreshHost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
