import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (formData: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agribridge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('agribridge_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('agribridge_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res: any = await api.get('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('agribridge_user', JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
      setUser(null);
      localStorage.removeItem('agribridge_token');
      localStorage.removeItem('agribridge_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const res: any = await api.post('/auth/login', credentials);
    if (!res.success) {
      throw new Error(res.message || 'Login failed');
    }

    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('agribridge_token', receivedToken);
    localStorage.setItem('agribridge_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (formData: any): Promise<User> => {
    const res: any = await api.post('/auth/register', formData);
    if (!res.success) {
      throw new Error(res.message || 'Registration failed');
    }

    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('agribridge_token', receivedToken);
    localStorage.setItem('agribridge_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('agribridge_token');
    localStorage.removeItem('agribridge_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
