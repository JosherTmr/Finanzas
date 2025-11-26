export type TransactionType = 'expense' | 'income' | 'debt' | 'savings';

export type RecurrenceType = 'one-time' | 'monthly-range' | 'permanent';

export type Category =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'debt'
  | 'entertainment'
  | 'savings'
  | 'income'
  | 'other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  recurrence: RecurrenceType;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate?: string; // Optional, for monthly-range
  totalDebtAmount?: number; // Para saber cuánto fue la deuda original
  installmentsCount?: number; // Número de cuotas
  paymentDay?: number; // Día del mes ideal para pagar, 1-31
  notes?: string;
  createdAt: number;
}

// Maps a composite key "transactionId_YYYY-MM" to a boolean (paid/completed)
export type TransactionStatusMap = Record<string, boolean>;

export interface MonthlySummary {
  income: number;
  expenses: number;
  debt: number;
  savings: number;
  balance: number;
  executionRate: number; // % of budget/income used
}

export interface UserConfig {
  monthlyIncome: number; // Salario base referencia (informativo o fallback)
  workDaysPerWeek: number;
  workHoursPerDay: number;
  currencyCode: string;
  locale: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  housing: 'Vivienda',
  food: 'Alimentación',
  transport: 'Transporte',
  utilities: 'Servicios',
  debt: 'Deudas',
  entertainment: 'Ocio',
  savings: 'Ahorro',
  income: 'Ingresos',
  other: 'Otros'
};

export const CATEGORY_COLORS: Record<Category, string> = {
  housing: 'bg-orange-500',
  food: 'bg-yellow-500',
  transport: 'bg-blue-500',
  utilities: 'bg-cyan-500',
  debt: 'bg-red-500',
  entertainment: 'bg-purple-500',
  savings: 'bg-green-500',
  income: 'bg-emerald-600',
  other: 'bg-gray-500'
};