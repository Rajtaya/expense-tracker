import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Category, CategoryTotal, Expense, Paginated, PaymentMethod, Summary, TrendPoint, TxType } from './types';

export interface ExpenseFilters {
  type?: TxType;
  from?: string;
  to?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseInput {
  amount: number;
  type?: TxType;
  person?: string | null;
  categoryId?: string | null;
  description?: string | null;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  receiptImage?: string | null;
}

function clean(filters: ExpenseFilters): ExpenseFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null),
  );
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
    staleTime: 5 * 60_000,
  });
}

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => (await api.get<Paginated<Expense>>('/expenses', { params: clean(filters) })).data,
  });
}

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => (await api.get<Summary>('/reports/summary')).data,
  });
}

export function useTrend(groupBy: 'day' | 'month' = 'month', from?: string, to?: string) {
  return useQuery({
    queryKey: ['trend', groupBy, from, to],
    queryFn: async () => (await api.get<TrendPoint[]>('/reports/trend', { params: clean({ groupBy, from, to } as any) })).data,
  });
}

export function useByCategory(from?: string, to?: string) {
  return useQuery({
    queryKey: ['byCategory', from, to],
    queryFn: async () => (await api.get<CategoryTotal[]>('/reports/by-category', { params: clean({ from, to }) })).data,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ['expenses', 'summary', 'trend', 'byCategory'].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] }),
  );
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExpenseInput) => api.post('/expenses', body).then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ExpenseInput & { id: string }) =>
      api.patch(`/expenses/${id}`, body).then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`).then((r) => r.data),
    onSuccess: () => invalidateAll(qc),
  });
}
