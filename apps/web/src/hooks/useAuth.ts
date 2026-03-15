'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, isPending } = useSession();
  const { user, setUser, setLoading, clearAuth } = useAuthStore();
  const router = useRouter();

  // Sync Better Auth session → Zustand store
  useEffect(() => {
    setLoading(isPending);
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        fullName: (session.user as { fullName?: string }).fullName || session.user.name,
        plan: (session.user as { plan?: string }).plan || 'STARTER',
        avatarUrl: session.user.image || null,
        emailVerified: session.user.emailVerified,
      });
    } else if (!isPending) {
      clearAuth();
    }
  }, [session, isPending, setUser, setLoading, clearAuth]);

  const logout = async () => {
    await signOut();
    clearAuth();
    router.push('/login');
  };

  return {
    user: session?.user ? user : null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    logout,
  };
}
