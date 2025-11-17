import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { captureException, setUserContext, clearUserContext } from '@/lib/sentry';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  checking: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  checking: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setChecking(false);

        // Update Sentry context
        if (session?.user) {
          setUserContext({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          clearUserContext();
        }

        // Log auth events for debugging
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
        } else if (event === 'SIGNED_IN') {
          console.log('[Auth] User signed in:', session?.user.id);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] Error getting session:', error);
        captureException(error, { context: 'auth_init' });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setChecking(false);

      if (session?.user) {
        setUserContext({
          id: session.user.id,
          email: session.user.email,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, checking }}>
      {children}
    </AuthContext.Provider>
  );
};
