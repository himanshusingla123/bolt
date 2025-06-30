import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, LoginData, RegisterData } from '../services/auth';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        const savedUser = authService.getCurrentUser();
        
        if (token && savedUser) {
          apiService.setToken(token);
          setUser(savedUser);
          
          // Verify backend connection
          const isHealthy = await apiService.healthCheck();
          if (!isHealthy) {
            toast.error('Backend service is unavailable');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth data
        authService.logout();
        apiService.clearToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      const response = await authService.login(data);
      
      const token = response.access_token;
      const userData = response.user;
      
      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update services
      apiService.setToken(token);
      setUser(userData);
      
      toast.success('Login successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      
      // Handle registration response - might not include session immediately
      if (response.access_token) {
        const token = response.access_token;
        const userData = response.user;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        apiService.setToken(token);
        setUser(userData);
        
        toast.success('Registration successful!');
      } else {
        toast.success('Registration successful! Please check your email to verify your account.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    apiService.clearToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};