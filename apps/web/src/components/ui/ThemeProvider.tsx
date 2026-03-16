'use client';
import { useEffect } from 'react';
import { getTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme on mount
    const theme = getTheme();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return <>{children}</>;
}