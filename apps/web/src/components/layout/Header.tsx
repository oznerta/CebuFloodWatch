'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Moon, Sun, Bell, User, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const nextDark = !isDark;
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Alert Banner / Ticker */}
      <div className="flex items-center gap-3">
        <Badge variant="critical" className="animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          ACTIVE FLOOD ADVISORY
        </Badge>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium hidden md:inline">
          Suba River cresting at Mabolo Bridge. Mambaling underpass flagged impassable.
        </span>
      </div>

      {/* User Controls & Theme */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User Identity Chip */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-slate-900 dark:text-white">
              CDRRMO Operator
            </span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              City DRRMO Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
