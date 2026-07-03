'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '../utils/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'MANAGER' | 'SUPPORT';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Hydrate state from localStorage
    const savedToken = localStorage.getItem('subhag_token');
    const savedUser = localStorage.getItem('subhag_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Protect pages
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname.includes('/login');
    const isAdminPage = pathname.startsWith('/admin');
    const isPortalPage = pathname.startsWith('/portal');

    if (!token) {
      // Redirect to login if trying to access protected page
      if ((isAdminPage || isPortalPage) && !isAuthPage) {
        router.push('/portal/login');
      }
    } else {
      // Redirect to correct dashboard if trying to access login page while authenticated
      if (isAuthPage) {
        if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
          router.push('/admin');
        } else {
          router.push('/portal');
        }
      }
    }
  }, [token, loading, pathname, user, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('subhag_token', data.token);
      localStorage.setItem('subhag_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        router.push('/admin');
      } else {
        router.push('/portal');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('subhag_token');
    localStorage.removeItem('subhag_user');
    setToken(null);
    setUser(null);
    router.push('/portal/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
