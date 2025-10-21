import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      const message = errorDescription?.includes('AADSTS50194')
        ? 'Microsoft login failed. The Azure AD app needs to be configured as multi-tenant or use a tenant-specific endpoint.'
        : errorDescription || 'Authentication failed';

      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: message,
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const syncUserProfile = async (user: User) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const displayName = user.user_metadata?.name ||
                           user.user_metadata?.full_name ||
                           user.user_metadata?.username;

        const username = user.user_metadata?.username ||
                        user.user_metadata?.preferred_username ||
                        user.email?.split('@')[0];

        const avatarUrl = user.user_metadata?.avatar_url ||
                         user.user_metadata?.picture;

        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username || null,
            display_name: displayName || null,
            avatar_url: avatarUrl || null,
          });
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncUserProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await syncUserProfile(session.user);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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
