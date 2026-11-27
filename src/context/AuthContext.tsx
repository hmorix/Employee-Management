import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '../lib/supabase';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  loading: boolean;
  isLeader: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  profileError: null,
  loading: true,
  isLeader: false,
  isAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser: User) => {
    setProfileError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      setProfileError(error.message);
      setProfile(null);
      return;
    }

    if (data) {
      setProfile(data as Profile);
      return;
    }

    const meta = authUser.user_metadata || {};
    const fallbackCode = meta.employee_code || `HMX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email || '',
        full_name: meta.full_name || authUser.email?.split('@')[0] || 'HMorix User',
        role: meta.role || 'employee',
        designation: meta.designation || 'Team Member',
        employee_code: fallbackCode,
        status: 'active'
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      setProfileError(insertErr.message);
      setProfile(null);
    } else {
      setProfile((created as Profile) || null);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await fetchProfile(data.session.user);
      }
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        setLoading(true);
        await fetchProfile(s.user);
        if (mounted) setLoading(false);
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        profileError,
        loading,
        isLeader: ['admin', 'hr', 'team_leader'].includes(profile?.role || ''),
        isAdmin: ['admin', 'hr'].includes(profile?.role || ''),
        refreshProfile: async () => {
          if (session?.user) {
            setLoading(true);
            await fetchProfile(session.user);
            setLoading(false);
          }
        },
        signOut: async () => {
          await supabase.auth.signOut();
          setProfile(null);
          setProfileError(null);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
