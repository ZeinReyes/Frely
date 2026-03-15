'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { forgetPassword } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const { error } = await forgetPassword({
      email:       data.email,
      redirectTo:  `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      toast({
        title:       'Something went wrong',
        description: error.message,
        variant:     'error',
      });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-card animate-fade-in text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-2">
          We sent a password reset link to
        </p>
        <p className="text-gray-900 font-medium text-sm mb-6">{getValues('email')}</p>
        <p className="text-xs text-gray-400 mb-6">
          Didn&apos;t receive it? Check your spam folder or try again.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="w-full">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:text-primary-600 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
