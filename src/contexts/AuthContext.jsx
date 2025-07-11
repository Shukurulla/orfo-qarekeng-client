// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Local storage keys
  const TOKEN_KEY = 'auth_token';
  const USER_KEY = 'user_data';

  // API base URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://ofro-qarekeng-server.vercel.app/api';

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem(USER_KEY);
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        
        // Verify token with server
        const response = await fetch(`${API_BASE}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const verificationData = await response.data;
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user: newUser } = data.data;
        
        // Save to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        message.success('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!');
        return { success: true, user: newUser };
      } else {
        message.error(data.error || 'Ro\'yxatdan o\'tishda xato');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error('Tarmoq xatosi');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user: loginUser } = data.data;
        
        // Save to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(loginUser));
        
        setUser(loginUser);
        setIsAuthenticated(true);
        
        message.success('Muvaffaqiyatli kiritdingiz!');
        return { success: true, user: loginUser };
      } else {
        message.error(data.error || 'Login da xato');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Tarmoq xatosi');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    message.info('Tizimdan chiqdingiz');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const getAuthToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  // Check daily usage limits
  const checkUsageLimit = (feature) => {
    if (!user || user.plan === 'pro') return true;
    
    const today = new Date().toDateString();
    const usage = user.dailyUsage || {};
    const todayUsage = usage[today] || {};
    
    const limit = 3; // Start plan limit
    const used = todayUsage[feature] || 0;
    
    return used < limit;
  };

  const incrementUsage = async (feature) => {
    if (!user || user.plan === 'pro') return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/auth/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feature })
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.data.user);
      }
    } catch (error) {
      console.error('Usage increment error:', error);
    }
  };

  const getUsageInfo = () => {
    if (!user || user.plan === 'pro') {
      return { unlimited: true };
    }
    
    const today = new Date().toDateString();
    const usage = user.dailyUsage || {};
    const todayUsage = usage[today] || {};
    
    const limit = 3;
    
    return {
      unlimited: false,
      limit,
      usage: {
        spellCheck: todayUsage.spellCheck || 0,
        textImprovement: todayUsage.textImprovement || 0,
        transliteration: todayUsage.transliteration || 0
      },
      remaining: {
        spellCheck: Math.max(0, limit - (todayUsage.spellCheck || 0)),
        textImprovement: Math.max(0, limit - (todayUsage.textImprovement || 0)),
        transliteration: Math.max(0, limit - (todayUsage.transliteration || 0))
      }
    };
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    getAuthToken,
    checkUsageLimit,
    incrementUsage,
    getUsageInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;