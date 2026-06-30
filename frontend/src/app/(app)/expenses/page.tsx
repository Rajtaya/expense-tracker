'use client';

import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatMoney } from '@/lib/format';
import { ExpenseFilters, useCategories, useDeleteExpense, useExpenses } from '@/lib/hooks';
import { Expense, PAYMENT_METHODS, PaymentMethod, TX_TYPES, TxType } from '@/lib/types';

const ALL = '__all__';

const TYPE_BADGE: Record<TxType, { label: string; cls: string }> = {
  EXPENSE: { label: 'Expense', cls: 'bg-slate-100 text-slate-700' },
  GIVEN: { label: 'Given', cls: 'bg-red-100 text-red-700' },
  RECEIVED: { label: 'Received', cls: 'bg-green-100 text-green-700' },
};

function rangeFor(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const d = (x: Date) => format(x, 'yyyy-MM-dd');
  switch (preset) {
    case 'today':
      return { from: d(now), to: d(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: d(y), to: d(y) };
    }
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
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [paymentMethod, setPaymentMethod] = useState<string>(ALL);

  const categories = useCategories();
  const del = useDeleteExpense();

  const filters: ExpenseFilters = useMemo(() => {
    const r = rangeFor(preset);
    return {
      ...r,
      type: type === ALL ? undefined : (type as TxType),
      search: search || undefined,
      categoryId: categoryId === ALL ? undefined : categoryId,
      paymentMethod: paymentMethod === ALL ? undefined : (paymentMethod as PaymentMethod),
      limit: 200,
    };
  }, [preset, type, search, categoryId, paymentMethod]);

  const expenses = useExpenses(filters);
  const rows = expenses.data?.data ?? [];
  const total = rows.reduce((sum, e) => sum + e.amount, 0);

  const onDelete = async (e: Expense) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await del.mutateAsync(e.id);
      toast.success('Expense deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  const exportCsv = () => {
    if (!rows.length) return toast.error('Nothing to export');
    const header = ['Date', 'Type', 'Person', 'Category', 'Description', 'Payment', 'Amount'];
    const lines = rows.map((e) =>
      [
        e.expenseDate.slice(0, 10),
        e.type,
        (e.person ?? '').replace(/"/g, '""'),
        e.category?.name ?? '',
        (e.description ?? '').replace(/"/g, '""'),
        e.paymentMethod,
        e.amount,
      ]
        .map((v) => `"${v}"`)
        .join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <ExpenseDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Add Expense
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={preset}
            onValueChange={(v) => setPreset(v ?? 'all')}
            items={[
              { value: 'all', label: 'All time' },
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: 'month', label: 'This month' },
            ]}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={(v) => setType(v ?? ALL)}
            items={[
              { value: ALL, label: 'All types' },
              ...TX_TYPES.map((t) => ({ value: t.value, label: t.label })),
            ]}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
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
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? ALL)}
            items={[
              { value: ALL, label: 'All categories' },
              ...(categories.data ?? []).map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
            ]}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v ?? ALL)}
            items={[
              { value: ALL, label: 'All payments' },
              ...PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label })),
            ]}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All payments</SelectItem>
              {PAYMENT_METHODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> CSV
          </Button>
        </CardContent>
      </Card>

      {/* Total */}
      <div className="flex items-center justify-between px-1 text-sm">
        <span className="text-muted-foreground">{rows.length} expenses</span>
        <span className="font-semibold">Total: {formatMoney(total)}</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(e.expenseDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={TYPE_BADGE[e.type].cls}>
                        {TYPE_BADGE[e.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.category ? `${e.category.icon ?? ''} ${e.category.name}` : '—'}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {e.description || '—'}
                      {e.person ? <span className="text-muted-foreground"> · {e.person}</span> : null}
                    </TableCell>
                    <TableCell>{PAYMENT_METHODS.find((p) => p.value === e.paymentMethod)?.label}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${e.type === 'RECEIVED' ? 'text-green-600' : e.type === 'GIVEN' ? 'text-red-600' : ''}`}
                    >
                      {e.type === 'RECEIVED' ? '+' : ''}
                      {formatMoney(e.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ExpenseDialog
                          expense={e}
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => onDelete(e)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No expenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
