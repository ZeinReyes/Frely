'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character');

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
    email:    z.string().email('Enter a valid email address'),
    password: passwordSchema,
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

const pwRules = [
  { label: 'At least 8 characters',  test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',    test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',    test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',              test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router    = useRouter();
  const { toast } = useToast();
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered]   = useState(false);
  const [pwValue, setPwValue]         = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const { error } = await signUp.email({
      email:       data.email,
      password:    data.password,
      name:        data.fullName,
      callbackURL: 'http://localhost:3000/dashboard',
    });

    if (error) {
      toast({
        title:       'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant:     'error',
      });
      return;
    }

    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="auth-card animate-fade-in text-center">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Check your inbox
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          We&apos;ve sent a verification link to your email address. Click it to activate your account.
        </p>
        <Button variant="secondary" className="w-full" onClick={() => router.push('/login')}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-card animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start managing your freelance business
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
              {...register('password', {
                onChange: (e) => setPwValue(e.target.value),
              })}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {pwValue && (
            <ul className="mt-2 space-y-1">
              {pwRules.map((rule) => {
                const passed = rule.test(pwValue);
                return (
                  <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                    {passed
                      ? <Check className="h-3.5 w-3.5 text-secondary" />
                      : <X    className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                    }
                    <span className={passed ? 'text-secondary' : 'text-gray-400 dark:text-gray-500'}>
                      {rule.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm password <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.confirm ? 'border-danger focus:ring-danger' : ''}`}
              {...register('confirm')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && (
            <p className="text-xs text-danger">{errors.confirm.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>

        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          By signing up you agree to our{' '}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-600 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}