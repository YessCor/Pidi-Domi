import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Profile, Role } from '../types';

export const USE_MOCK_AUTH = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  isMock: boolean;
  // Reales (Supabase)
  login: (email: string, password: string) => Promise<void>;
  /** Devuelve needsEmailConfirmation=true si el proyecto exige confirmar el correo */
  register: (input: RegisterInput) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Mock (sin backend)
  mockLogin: (role: Role) => void;
  mockRegister: (fullName: string, role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mockUser, setMockUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Sesión persistida + listener
  useEffect(() => {
    if (USE_MOCK_AUTH) {
      setLoading(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next); // sin await de llamadas a Supabase aquí (evita deadlocks)
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.warn('[auth] no se pudo cargar el perfil:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }, []);

  // 2) Perfil (rol) cada vez que cambia el usuario real
  useEffect(() => {
    if (USE_MOCK_AUTH) return;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    loadProfile(session.user.id);
  }, [session?.user?.id, loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const register = useCallback(async ({ email, password, fullName, role }: RegisterInput) => {
    // El trigger handle_new_user (supabase/schema.sql) crea la fila en profiles con estos metadatos
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    setMockUser(null);
    setProfile(null);
    if (!USE_MOCK_AUTH) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  }, []);

  const mockLogin = useCallback((role: Role) => {
    const id = `00000000-0000-0000-0000-00000000000${role === 'CLIENTE' ? 1 : role === 'COMERCIO' ? 2 : 3}`;
    setMockUser({ id, email: `${role.toLowerCase()}@mock.dev` });
    setProfile({ id, email: `${role.toLowerCase()}@mock.dev`, full_name: `Demo ${role}`, role });
  }, []);

  const mockRegister = useCallback(
    (fullName: string, role: Role) => {
      mockLogin(role);
      setProfile((p) => (p ? { ...p, full_name: fullName || p.full_name } : p));
    },
    [mockLogin]
  );

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session?.user, loadProfile]);

  const user: AuthUser | null = USE_MOCK_AUTH
    ? mockUser
    : session?.user
    ? { id: session.user.id, email: session.user.email ?? null }
    : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role: profile?.role ?? null,
      loading,
      isMock: USE_MOCK_AUTH,
      login,
      register,
      logout,
      refreshProfile,
      mockLogin,
      mockRegister,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, profile, loading, login, register, logout, refreshProfile, mockLogin, mockRegister]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
