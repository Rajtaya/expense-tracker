'use client';

import { ClipboardList, Home, LogOut, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ExpenseDialog } from '@/components/expense-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/reports', label: 'Reports', icon: ClipboardList },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Top header */}
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <span className="flex items-center gap-2 text-xl font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground">₹</span>
            <span className="hidden sm:inline">ExpenseTracker</span>
          </span>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="outline" size="lg" onClick={logout} className="h-11 gap-2 text-base">
            <LogOut className="size-5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Page content — extra bottom padding on mobile for the bottom bar */}
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:pb-10">{children}</main>

      {/* Persistent big Add button */}
      <ExpenseDialog
        trigger={
          <button
            aria-label="Add expense"
            className="fixed bottom-24 right-5 z-30 flex h-16 items-center gap-2 rounded-full bg-primary px-6 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 sm:bottom-8"
          >
            <Plus className="size-7" />
            Add
          </button>
        }
      />

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-3 border-t bg-background sm:hidden">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 text-sm font-semibold',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-7" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
