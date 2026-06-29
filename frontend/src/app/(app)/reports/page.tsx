'use client';

import { format, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { useMemo, useState } from 'react';
import { CategoryPie, TrendChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { useByCategory, useTrend } from '@/lib/hooks';

function rangeFor(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const d = (x: Date) => format(x, 'yyyy-MM-dd');
  switch (preset) {
    case 'month':
      return { from: d(startOfMonth(now)), to: d(now) };
    case '3m':
      return { from: d(subMonths(now, 2)), to: d(now) };
    case 'year':
      return { from: d(startOfYear(now)), to: d(now) };
    default:
      return {};
  }
}

export default function ReportsPage() {
  const [preset, setPreset] = useState('year');
  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  const byCategory = useByCategory(from, to);
  const trend = useTrend('month', from, to);
  const catTotal = (byCategory.data ?? []).reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <Select
          value={preset}
          onValueChange={(v) => setPreset(v ?? 'year')}
          items={[
            { value: 'month', label: 'This month' },
            { value: '3m', label: 'Last 3 months' },
            { value: 'year', label: 'This year' },
            { value: 'all', label: 'All time' },
          ]}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="year">This year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <CategoryPie data={byCategory.data ?? []} />
            )}
            {!!byCategory.data?.length && (
              <div className="mt-4 space-y-1.5">
                {byCategory.data.map((c) => (
                  <div key={c.categoryId ?? 'none'} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1">
                      {c.icon} {c.name}
                    </span>
                    <span className="font-medium">{formatMoney(c.total)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">
                      {catTotal ? Math.round((c.total / catTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? <Skeleton className="h-[280px] w-full" /> : <TrendChart data={trend.data ?? []} kind="bar" />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? <Skeleton className="h-[280px] w-full" /> : <TrendChart data={trend.data ?? []} kind="line" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
