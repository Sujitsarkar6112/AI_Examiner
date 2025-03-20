import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { postData } from '../utils/api';
import api from '../utils/api';
import { AUTH_TOKEN_KEY } from '../config';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

// Helper to extract error message from unknown error
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as Record<string, unknown>;
      if ('data' in response && response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if ('message' in data && typeof data.message === 'string') return data.message;
        if ('error' in data && typeof data.error === 'string') return data.error;
      }
    }
    if ('message' in error && typeof error.message === 'string') return error.message;
  }
  return 'An unknown error occurred';
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem(AUTH_TOKEN_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          if (userData.token) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // No token found, clear user data
            localStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please provide email and password');
      }
      
      // Make an API call to authenticate
      const response = await postData<{token: string, user: User}>('/login', {
        email,
        password
      });
      
      if (response && response.token) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          token: response.token
        };
        
        // Store the user data in localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(userData));
        
        // Set the user in state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Successfully logged in');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Login failed');
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (!name || !email || !password) {
        throw new Error('Please provide all required fields');
      }
      
      // Make an API call to register
      const response = await postData<{token: string, user: User}>('/register', {
        username: name,
        email,
        password
      });
      
      if (response && response.token) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          token: response.token
        };
        
        // Store the user data in localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(userData));
        
        // Set the user in state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Account created successfully');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Registration failed');
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const demoLogin = async () => {
    setIsLoading(true);
    
    try {
      // Make an API call to demo login endpoint
      const response = await postData<{token: string, user: User}>('/demo-login', {});
      
      if (response && response.token) {
        const userData: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
          token: response.token
        };
        
        // Store the user data in localStorage
        localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(userData));
        
        // Set the user in state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Logged in as Demo User');
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'Failed to access demo account');
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear user data from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    
    // Clear user from state
    setUser(null);
    setIsAuthenticated(false);
    
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, signup, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
