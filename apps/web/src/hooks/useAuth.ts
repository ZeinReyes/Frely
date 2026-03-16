'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export function useAuth() {
  const { data: session, isPending } = useSession();
  const { user, setUser, setLoading, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setLoading(isPending);

    if (session?.user && !isPending) {
      // Fetch full profile from DB to get plan, role, fullName
      api.get('/api/settings/profile')
        .then(({ data }) => {
          const profile = data.data.profile;
          setUser({
            id:            session.user.id,
            email:         session.user.email,
            name:          session.user.name,
            fullName:      profile.fullName || session.user.name,
            plan:          profile.plan     || 'STARTER',
            role:          profile.role     || 'USER',
            avatarUrl:     profile.image    || session.user.image || null,
            emailVerified: session.user.emailVerified,
          });
        })
        .catch(() => clearAuth());
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
    user:            session?.user ? user : null,
    isLoading:       isPending,
    isAuthenticated: !!session?.user,
    logout,
  };
}