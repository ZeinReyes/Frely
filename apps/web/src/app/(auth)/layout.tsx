import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Vyrn</h1>
          <p className="mt-2 text-sm text-gray-500">Your work. Your clients. One place.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
