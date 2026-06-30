'use client';

import { format, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function monthLabel(period: string): string {
  // period is "YYYY-MM"
  const [y, m] = period.split('-').map(Number);
  return format(new Date(y, (m ?? 1) - 1, 1), 'MMM yyyy');
}

export default function ReportsPage() {
  const [preset, setPreset] = useState('year');
  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  const byCategory = useByCategory(from, to);
  const trend = useTrend('month', from, to);
  const catTotal = (byCategory.data ?? []).reduce((s, c) => s + c.total, 0);
  const monthTotal = (trend.data ?? []).reduce((s, m) => s + m.total, 0);

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
        {/* Spending by category (table) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {byCategory.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : byCategory.data?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byCategory.data.map((c) => (
                    <TableRow key={c.categoryId ?? 'none'}>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                          {c.icon} {c.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(c.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {catTotal ? Math.round((c.total / catTotal) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">{formatMoney(catTotal)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">No spending in this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly spending (table) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {trend.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : trend.data?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trend.data.map((m) => (
                    <TableRow key={m.period}>
                      <TableCell>{monthLabel(m.period)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(m.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">{formatMoney(monthTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">No spending in this period.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
