'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from '../lib/api';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lgu_officer' | 'responder' | 'citizen';
  barangay?: string;
  token?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    barangay: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cebu_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem('cebu_auth_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enforce Protected Routes
  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.some((r) => pathname?.startsWith(r));
      if (!user && !isPublic) {
        router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetchApi<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res && res.success && res.user) {
        const session: UserSession = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          barangay: res.user.barangay,
          token: res.token,
        };
        setUser(session);
        localStorage.setItem('cebu_auth_user', JSON.stringify(session));
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: res?.error || 'Authentication failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    barangay: string;
    phone?: string;
  }) => {
    try {
      const res = await fetchApi<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          barangay: data.barangay,
          phone_number: data.phone,
        }),
      });

      if (res && res.success && res.user) {
        const session: UserSession = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          barangay: res.user.barangay,
          token: res.token,
        };
        setUser(session);
        localStorage.setItem('cebu_auth_user', JSON.stringify(session));
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: res?.error || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error registering account.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cebu_auth_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
