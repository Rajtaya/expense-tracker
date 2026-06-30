'use client';

import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { formatDate, formatMoney } from '@/lib/format';
import { useExpenses, useSummary } from '@/lib/hooks';
import { TX_TYPES } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useSummary();
  const recent = useExpenses({ limit: 8, page: 1 });
  const s = summary.data;

  const topCats = (s?.byCategory ?? []).slice(0, 5);
  const maxCat = useMemo(() => Math.max(1, ...topCats.map((c) => c.total)), [topCats]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>

      {/* Spent this month — hero */}
      <Card className="border-primary/30 bg-primary text-primary-foreground">
        <CardContent className="py-7 text-center">
          <p className="text-lg opacity-90">Spent this month</p>
          {summary.isLoading ? (
            <Skeleton className="mx-auto mt-2 h-12 w-40 bg-white/30" />
          ) : (
            <p className="mt-1 text-5xl font-extrabold">{formatMoney(s?.thisMonth ?? 0)}</p>
          )}
        </CardContent>
      </Card>

      {/* Today / Year */}
      <div className="grid grid-cols-2 gap-4">
        <SmallStat label="Spent today" value={s?.today} loading={summary.isLoading} />
        <SmallStat label="Spent this year" value={s?.thisYear} loading={summary.isLoading} />
      </div>

      {/* Given / Received */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MoneyCard
          label="Money you gave"
          value={s?.givenThisMonth}
          loading={summary.isLoading}
          tone="out"
          icon={<ArrowUpCircle className="size-7 text-red-600" />}
        />
        <MoneyCard
          label="Money you got"
          value={s?.receivedThisMonth}
          loading={summary.isLoading}
          tone="in"
          icon={<ArrowDownCircle className="size-7 text-green-600" />}
        />
      </div>

      {/* Where money went */}
      <section>
        <h2 className="mb-3 text-2xl font-bold">Where money went</h2>
        <Card>
          <CardContent className="space-y-4 py-5">
            {summary.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : topCats.length ? (
              topCats.map((c) => (
                <div key={c.categoryId ?? 'none'}>
                  <div className="mb-1 flex items-center justify-between text-lg">
                    <span className="font-medium">
                      <span className="text-2xl">{c.icon}</span> {c.name}
                    </span>
                    <span className="font-bold">{formatMoney(c.total)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.total / maxCat) * 100}%`, background: c.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-lg text-muted-foreground">
                No spending yet. Tap the big <span className="font-bold text-primary">+ Add</span> button.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent */}
      <section>
        <h2 className="mb-3 text-2xl font-bold">Recent</h2>
        <div className="space-y-3">
          {recent.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : recent.data?.data.length ? (
            recent.data.data.map((e) => {
              const dir = TX_TYPES.find((t) => t.value === e.type)?.dir ?? 'out';
              const inMoney = dir === 'in';
              return (
                <Card key={e.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-2xl">
                      {e.category?.icon ?? (inMoney ? '💰' : '💸')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold">
                        {e.description || e.person || e.category?.name || 'Money'}
                      </p>
                      <p className="text-base text-muted-foreground">{formatDate(e.expenseDate)}</p>
                    </div>
                    <span className={`text-xl font-bold ${inMoney ? 'text-green-600' : 'text-red-600'}`}>
                      {inMoney ? '+' : '−'}
                      {formatMoney(e.amount)}
                    </span>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="py-6 text-center text-lg text-muted-foreground">Nothing yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SmallStat({ label, value, loading }: { label: string; value?: number; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-base text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-9 w-24" />
        ) : (
          <p className="mt-1 text-3xl font-bold">{formatMoney(value ?? 0)}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MoneyCard({
  label,
  value,
  loading,
  tone,
  icon,
}: {
  label: string;
  value?: number;
  loading?: boolean;
  tone: 'in' | 'out';
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className={`flex size-12 items-center justify-center rounded-full ${tone === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
          {icon}
        </span>
        <div>
          <p className="text-base text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className={`text-2xl font-bold ${tone === 'in' ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(value ?? 0)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
