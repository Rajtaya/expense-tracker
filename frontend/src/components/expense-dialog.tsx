'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { todayISO } from '@/lib/format';
import { useCategories, useCreateExpense, useUpdateExpense } from '@/lib/hooks';
import { Expense, PAYMENT_METHODS, PaymentMethod } from '@/lib/types';

const NONE = '__none__';

const schema = z.object({
  amount: z.number({ message: 'Enter an amount' }).positive('Amount must be greater than 0'),
  categoryId: z.string(),
  description: z.string().max(500).optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  expenseDate: z.string().min(1, 'Date is required'),
});
type FormValues = z.infer<typeof schema>;

export function ExpenseDialog({
  trigger,
  expense,
}: {
  trigger: React.ReactElement;
  expense?: Expense;
}) {
  const [open, setOpen] = useState(false);
  const categories = useCategories();
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const isEdit = !!expense;

  const categoryItems = [
    { value: NONE, label: 'Uncategorized' },
    ...(categories.data ?? []).map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ];
  const paymentItems = PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined as unknown as number,
      categoryId: NONE,
      description: '',
      paymentMethod: 'CASH',
      expenseDate: todayISO(),
    },
  });

  // Populate when opening (for both add and edit).
  useEffect(() => {
    if (!open) return;
    reset({
      amount: expense ? Number(expense.amount) : (undefined as unknown as number),
      categoryId: expense?.categoryId ?? NONE,
      description: expense?.description ?? '',
      paymentMethod: (expense?.paymentMethod ?? 'CASH') as PaymentMethod,
      expenseDate: expense ? expense.expenseDate.slice(0, 10) : todayISO(),
    });
  }, [open, expense, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      amount: values.amount,
      categoryId: values.categoryId === NONE ? null : values.categoryId,
      description: values.description?.trim() || null,
      paymentMethod: values.paymentMethod,
      expenseDate: values.expenseDate,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: expense!.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Expense updated' : 'Expense added');
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not save expense');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} items={categoryItems}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Uncategorized</SelectItem>
                      {(categories.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment</Label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} items={paymentItems}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenseDate">Date</Label>
            <Input id="expenseDate" type="date" max={todayISO()} {...register('expenseDate')} />
            {errors.expenseDate && (
              <p className="text-xs text-destructive">{errors.expenseDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. Lunch" {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
