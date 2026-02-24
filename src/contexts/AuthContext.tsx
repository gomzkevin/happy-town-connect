import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AdminRole = 'admin' | 'operador' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  adminRole: AdminRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status when user changes
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with auth state
          // but ensure session is fully set before checking admin
          setTimeout(async () => {
            await checkAdminStatus(session.user.id, session.user.email || '');
          }, 100);
        } else {
          setIsAdmin(false);
          setAdminRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string, userEmail: string, retryCount = 0) => {
    try {
      // Check if user is already in admin_users
      const { data, error } = await supabase
        .from('admin_users')
        .select('is_active, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setIsAdmin(true);
        setAdminRole(data.role as AdminRole);
        return;
      }

      // Check if there's a pending invitation for this email
      if (userEmail) {
        const { data: invitation } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('email', userEmail.toLowerCase())
          .eq('status', 'pending')
          .single();

        if (invitation) {
          console.log('Found pending invitation, attempting auto-link for:', userEmail);
          // Auto-link: create admin_users entry and mark invitation as accepted
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              user_id: userId,
              email: userEmail.toLowerCase(),
              role: invitation.role,
              is_active: true,
            });

          if (insertError) {
            console.error('Failed to auto-link invitation:', insertError);
            // Retry once after a delay (session may not be fully ready)
            if (retryCount < 2) {
              console.log(`Retrying auto-link (attempt ${retryCount + 2})...`);
              setTimeout(() => checkAdminStatus(userId, userEmail, retryCount + 1), 1000);
              return;
            }
          } else {
            console.log('Auto-link successful, updating invitation status');
            // Update invitation status
            await supabase
              .from('team_invitations')
              .update({ status: 'accepted', accepted_at: new Date().toISOString() })
              .eq('id', invitation.id);

            setIsAdmin(true);
            setAdminRole(invitation.role as AdminRole);
            return;
          }
        }
      }

      setIsAdmin(false);
      setAdminRole(null);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/admin`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminRole(null);
  };

  const value = {
    user,
    session,
    isAdmin,
    adminRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};