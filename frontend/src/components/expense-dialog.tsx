'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Expense, PAYMENT_METHODS, PaymentMethod, TX_TYPES, TxType } from '@/lib/types';
import { cn } from '@/lib/utils';

const NONE = '__none__';

const TYPE_ICON = { EXPENSE: ShoppingCart, GIVEN: ArrowUpCircle, RECEIVED: ArrowDownCircle } as const;
const TYPE_SELECTED: Record<TxType, string> = {
  EXPENSE: 'border-primary bg-primary/10 text-primary',
  GIVEN: 'border-red-500 bg-red-50 text-red-600',
  RECEIVED: 'border-green-600 bg-green-50 text-green-700',
};

const schema = z.object({
  type: z.enum(['EXPENSE', 'GIVEN', 'RECEIVED']),
  amount: z.number({ message: 'Enter an amount' }).positive('Amount must be greater than 0'),
  person: z.string().max(120).optional(),
  categoryId: z.string(),
  description: z.string().max(500).optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  expenseDate: z.string().min(1, 'Date is required'),
});
type FormValues = z.infer<typeof schema>;

const bigField = 'h-14 text-lg';

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
    { value: NONE, label: 'No category' },
    ...(categories.data ?? []).map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` })),
  ];
  const paymentItems = PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'EXPENSE',
      amount: undefined as unknown as number,
      person: '',
      categoryId: NONE,
      description: '',
      paymentMethod: 'CASH',
      expenseDate: todayISO(),
    },
  });

  const currentType = watch('type');
  const meta = TX_TYPES.find((t) => t.value === currentType)!;

  useEffect(() => {
    if (!open) return;
    reset({
      type: (expense?.type ?? 'EXPENSE') as TxType,
      amount: expense ? Number(expense.amount) : (undefined as unknown as number),
      person: expense?.person ?? '',
      categoryId: expense?.categoryId ?? NONE,
      description: expense?.description ?? '',
      paymentMethod: (expense?.paymentMethod ?? 'CASH') as PaymentMethod,
      expenseDate: expense ? expense.expenseDate.slice(0, 10) : todayISO(),
    });
  }, [open, expense, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      type: values.type,
      amount: values.amount,
      person: values.person?.trim() || null,
      categoryId: values.categoryId === NONE ? null : values.categoryId,
      description: values.description?.trim() || null,
      paymentMethod: values.paymentMethod,
      expenseDate: values.expenseDate,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: expense!.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Saved' : 'Added');
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not save');
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEdit ? 'Edit' : 'Add Money'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Type: 3 big buttons */}
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {TX_TYPES.map((t) => {
                  const Icon = TYPE_ICON[t.value];
                  const selected = field.value === t.value;
                  return (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => field.onChange(t.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-4 text-base font-bold transition-colors',
                        selected ? TYPE_SELECTED[t.value] : 'border-border text-muted-foreground',
                      )}
                    >
                      <Icon className="size-7" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}
          />

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="mb-2 block text-base">
              How much?
            </Label>
            <div className="flex items-center gap-2 rounded-2xl border-2 px-4 py-2 focus-within:border-primary">
              <span className="text-3xl font-bold text-muted-foreground">₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                className="w-full bg-transparent text-4xl font-bold outline-none"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="mt-1 text-base text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Person */}
          <div>
            <Label htmlFor="person" className="mb-2 block text-base">
              {meta.personLabel}
            </Label>
            <Input id="person" className={bigField} placeholder="Name" {...register('person')} />
          </div>

          {/* Category */}
          <div>
            <Label className="mb-2 block text-base">Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={categoryItems}>
                  <SelectTrigger className={cn(bigField, 'w-full')}>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className="text-base">
                      No category
                    </SelectItem>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-base">
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Date + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expenseDate" className="mb-2 block text-base">
                Date
              </Label>
              <Input id="expenseDate" type="date" max={todayISO()} className={bigField} {...register('expenseDate')} />
            </div>
            <div>
              <Label className="mb-2 block text-base">Paid by</Label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} items={paymentItems}>
                    <SelectTrigger className={cn(bigField, 'w-full')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-base">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="description" className="mb-2 block text-base">
              Note (optional)
            </Label>
            <Input id="description" className={bigField} placeholder="e.g. Lunch" {...register('description')} />
          </div>

          <Button type="submit" disabled={saving} className="h-14 w-full text-lg font-bold">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
