'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Radio } from 'lucide-react';

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <div className="w-full min-h-screen bg-[#F2F2F7]">{children}</div>;
  }

  // If session is verifying, show sleek loading indicator
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
          <Radio className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
          Verifying Security Clearance...
        </p>
      </div>
    );
  }

  // If not authenticated and not on an auth page, block rendering entirely
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F2F2F7] text-[#1C1C1E] antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
}
