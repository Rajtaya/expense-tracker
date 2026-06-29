export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
];

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  description: string | null;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  receiptImage: string | null;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface Summary {
  today: number;
  thisMonth: number;
  thisYear: number;
  monthCount: number;
  byCategory: CategoryTotal[];
}

export interface TrendPoint {
  period: string;
  total: number;
}
