'use client';

import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { Download, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExpenseDialog } from '@/components/expense-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney } from '@/lib/format';
import { ExpenseFilters, useDeleteExpense, useExpenses } from '@/lib/hooks';
import { Expense, TX_TYPES, TxType } from '@/lib/types';

const ALL = '__all__';
const bigField = 'h-13 text-base';

function rangeFor(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const d = (x: Date) => format(x, 'yyyy-MM-dd');
  switch (preset) {
    case 'today':
      return { from: d(now), to: d(now) };
    case '7':
      return { from: d(subDays(now, 6)), to: d(now) };
    case '30':
      return { from: d(subDays(now, 29)), to: d(now) };
    case 'month':
      return { from: d(startOfMonth(now)), to: d(endOfMonth(now)) };
    default:
      return {};
  }
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState('all');
  const [type, setType] = useState<string>(ALL);
  const del = useDeleteExpense();

  const filters: ExpenseFilters = useMemo(() => {
    const r = rangeFor(preset);
    return {
      ...r,
      type: type === ALL ? undefined : (type as TxType),
      search: search || undefined,
      limit: 300,
    };
  }, [preset, type, search]);

  const expenses = useExpenses(filters);
  const rows = expenses.data?.data ?? [];

  const onDelete = async (e: Expense) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await del.mutateAsync(e.id);
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error('Nothing to export');
    const header = ['Date', 'Type', 'Person', 'Category', 'Note', 'Paid by', 'Amount'];
    const lines = rows.map((e) =>
      [e.expenseDate.slice(0, 10), e.type, e.person ?? '', e.category?.name ?? '', e.description ?? '', e.paymentMethod, e.amount]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button variant="outline" size="lg" onClick={exportCsv} className="h-12 gap-2 text-base">
          <Download className="size-5" /> Save CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-14 pl-11 text-lg"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={preset}
          onValueChange={(v) => setPreset(v ?? 'all')}
          items={[
            { value: 'all', label: 'All time' },
            { value: 'today', label: 'Today' },
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: 'month', label: 'This month' },
          ]}
        >
          <SelectTrigger className={bigField}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => setType(v ?? ALL)}
          items={[{ value: ALL, label: 'All types' }, ...TX_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
        >
          <SelectTrigger className={bigField}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {TX_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {expenses.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : rows.length ? (
          rows.map((e) => {
            const dir = TX_TYPES.find((t) => t.value === e.type)?.dir ?? 'out';
            const inMoney = dir === 'in';
            return (
              <Card key={e.id}>
                <CardContent className="flex items-center gap-2 p-2">
                  <ExpenseDialog
                    expense={e}
                    trigger={
                      <button className="flex flex-1 items-center gap-3 rounded-xl p-2 text-left active:bg-muted">
                        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-2xl">
                          {e.category?.icon ?? (inMoney ? '💰' : '💸')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-semibold">
                            {e.description || e.person || e.category?.name || 'Money'}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {TX_TYPES.find((t) => t.value === e.type)?.label} · {formatDate(e.expenseDate)}
                          </span>
                        </span>
                        <span className={`shrink-0 text-xl font-bold ${inMoney ? 'text-green-600' : 'text-red-600'}`}>
                          {inMoney ? '+' : '−'}
                          {formatMoney(e.amount)}
                        </span>
                        <Pencil className="ml-1 size-4 shrink-0 text-muted-foreground" />
                      </button>
                    }
                  />
                  <button
                    aria-label="Delete"
                    onClick={() => onDelete(e)}
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl text-red-600 active:bg-red-50"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="py-10 text-center text-lg text-muted-foreground">No entries found.</p>
        )}
      </div>
    </div>
  );
}
