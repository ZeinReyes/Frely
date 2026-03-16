'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authClient.verifyEmail({ query: { token } })
      .then(({ error }) => setStatus(error ? 'error' : 'success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="auth-card animate-fade-in text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Verifying your email...
        </h2>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-card animate-fade-in text-center">
        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Email verified!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Your account is now active. You can sign in.
        </p>
        <Button className="w-full" onClick={() => router.push('/login')}>
          Sign in to Frely
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-card animate-fade-in text-center">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-8 w-8 text-danger" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Verification failed
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        This link is invalid or has expired. Please try signing up again.
      </p>
      <Button variant="secondary" className="w-full" onClick={() => router.push('/register')}>
        Back to sign up
      </Button>
    </div>
  );
}