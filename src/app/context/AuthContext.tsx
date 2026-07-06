import { createContext, useContext, useState, ReactNode } from 'react';
import api from '../services/api';

export type Role = 'recruiter' | 'tl' | 'manager' | 'admin' | 'spoc' | 'walkin' | 'demo_walkin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isWFH: boolean;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('ats_user');
    return stored ? JSON.parse(stored) : null;
  });
  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('ats_user', JSON.stringify(u));
  };

  const logout = async () => {
    if (user) {
      const d = new Date().toISOString().split('T')[0];
      localStorage.removeItem(`att_marked_${user.id}_${d}`);
      localStorage.removeItem(`att_reminder_${user.id}_${d}`);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('att_marked_') || key.startsWith('att_reminder_'))) {
          localStorage.removeItem(key);
        }
      }
    }
    try { await api.logout(); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('ats_user');
    localStorage.removeItem('ats_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const ROLE_DASHBOARD: Record<Role, string> = {
  recruiter: '/recruiter',
  tl: '/tl',
  manager: '/manager',
  admin: '/admin',
  spoc: '/recruiter',
  walkin: '/walkin/dashboard',
  demo_walkin: '/walkin/demo-registration',
};
