import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../config';
import { clearToken, setToken } from '../utils/api';

interface User {
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUserFromStorage(): User | null {
  try {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      return JSON.parse(savedUser);
    }
  } catch (e) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize user from localStorage immediately (synchronous)
  const [user, setUser] = useState<User | null>(loadUserFromStorage);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        const user: User = {
          email: userData.email,
          name: userData.name,
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        if (userData.token) {
          setToken(userData.token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    clearToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
