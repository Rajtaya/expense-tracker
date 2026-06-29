'use client';

import { Plus } from 'lucide-react';
import { CategoryPie } from '@/components/charts';
import { ExpenseDialog } from '@/components/expense-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney } from '@/lib/format';
import { useExpenses, useSummary } from '@/lib/hooks';

export default function DashboardPage() {
  const summary = useSummary();
  const recent = useExpenses({ limit: 6, page: 1 });
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <ExpenseDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Add Expense
            </Button>
          }
        />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Today" value={s?.today} loading={summary.isLoading} accent />
        <Stat label="This Month" value={s?.thisMonth} loading={summary.isLoading} />
        <Stat label="This Year" value={s?.thisYear} loading={summary.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Category pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Month by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <CategoryPie data={s?.byCategory ?? []} />
            )}
            {!!s?.byCategory?.length && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {s.byCategory.slice(0, 6).map((c) => (
                  <span key={c.categoryId ?? 'none'} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                    {c.icon} {c.name} · {formatMoney(c.total)}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recent.data?.data.length ? (
              recent.data.data.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted text-lg">
                    {e.category?.icon ?? '📦'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.description || e.category?.name || 'Expense'}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category?.name ?? 'Uncategorized'} · {formatDate(e.expenseDate)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatMoney(e.amount)}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No expenses yet. Add your first one!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  accent,
}: {
  label: string;
  value?: number;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : undefined}>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 text-3xl font-bold">{formatMoney(value ?? 0)}</p>
        )}
      </CardContent>
    </Card>
  );
}
