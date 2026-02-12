'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@/types';
import { post, get } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user to backend database
  const syncUserToBackend = async (supabaseUser: SupabaseUser) => {
    try {
      // Extract name from Supabase user metadata (Google OAuth provides this)
      const firstName = supabaseUser.user_metadata?.first_name || 
                       supabaseUser.user_metadata?.full_name?.split(' ')[0] ||
                       supabaseUser.user_metadata?.name?.split(' ')[0] ||
                       null;
      const lastName = supabaseUser.user_metadata?.last_name ||
                      (supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null) ||
                      (supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || null) ||
                      null;
      
      // Call backend endpoint to sync/create user
      await post('/auth/sync-user', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: firstName,
        last_name: lastName,
      });
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
      // Don't throw - allow user to continue even if sync fails
    }
  };

  // Fetch user data from backend
  const fetchUser = async (): Promise<void> => {
    if (!supabaseUser || !session) {
      setUser(null);
      return;
    }

    try {
      // First sync user to backend
      await syncUserToBackend(supabaseUser);

      // Then fetch user data from backend using API utility (handles transformation)
      const userData = await get<User>('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Fallback to minimal user object
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        plan_tier: 'free',
      });
    }
  };

  // Initialize auth state from Supabase
  useEffect(() => {
    // If Supabase is not configured, skip initialization
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUser();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUser();
    } else {
      setUser(null);
    }
  }, [session]);

  // Logout function
  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  // Update user function
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    loading,
    isAuthenticated: !!session && !!supabaseUser,
    logout,
    updateUser,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
