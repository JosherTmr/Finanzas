import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Transaction, TransactionStatusMap, MonthlySummary } from '../types';

interface FinanceContextType {
  transactions: Transaction[];
  statusMap: TransactionStatusMap;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  toggleStatus: (transactionId: string, monthKey: string) => void;
  getStatus: (transactionId: string, monthKey: string) => boolean;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number; // 0-11
  setSelectedMonth: (month: number) => void;
  getMonthlySummary: (year: number, month: number) => MonthlySummary;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Dummy Data
const INITIAL_DATA: Transaction[] = [
  { id: '1', title: 'Sueldo Mensual', amount: 3500000, type: 'income', category: 'income', recurrence: 'permanent', startDate: '2024-01-01', createdAt: Date.now() },
  { id: '2', title: 'Arriendo', amount: 800000, type: 'expense', category: 'housing', recurrence: 'permanent', startDate: '2024-01-01', createdAt: Date.now() },
  { id: '3', title: 'Internet', amount: 62993, type: 'expense', category: 'utilities', recurrence: 'permanent', startDate: '2024-01-01', createdAt: Date.now() },
  { id: '4', title: 'Deuda Bancolombia', amount: 100000, type: 'debt', category: 'debt', recurrence: 'monthly-range', startDate: '2024-01-01', endDate: '2024-08-31', createdAt: Date.now() },
  { id: '5', title: 'Ahorro Viaje', amount: 200000, type: 'savings', category: 'savings', recurrence: 'permanent', startDate: '2024-03-01', createdAt: Date.now() },
  { id: '6', title: 'Plan Celular', amount: 21000, type: 'expense', category: 'utilities', recurrence: 'permanent', startDate: '2024-01-01', createdAt: Date.now() },
];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [statusMap, setStatusMap] = useState<TransactionStatusMap>(() => {
    const saved = localStorage.getItem('statusMap');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('statusMap', JSON.stringify(statusMap));
  }, [statusMap]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const toggleStatus = (transactionId: string, monthKey: string) => {
    const key = `${transactionId}_${monthKey}`;
    setStatusMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatus = (transactionId: string, monthKey: string) => {
    return !!statusMap[`${transactionId}_${monthKey}`];
  };

  const getMonthlySummary = useCallback((year: number, month: number): MonthlySummary => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthKey = `${year}-${month}`;

    let income = 0;
    let expenses = 0;
    let debt = 0;
    let savings = 0;
    let paidTotal = 0; // Only counts outflows (expense + debt + savings)
    let totalOutflow = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.startDate);
      // Logic to check if transaction is active in this month
      let isActive = false;
      
      if (t.recurrence === 'one-time') {
        isActive = tDate.getMonth() === month && tDate.getFullYear() === year;
      } else if (t.recurrence === 'permanent') {
        isActive = tDate <= monthEnd;
      } else if (t.recurrence === 'monthly-range' && t.endDate) {
        const tEndDate = new Date(t.endDate);
        isActive = tDate <= monthEnd && tEndDate >= monthStart;
      }

      if (isActive) {
        if (t.type === 'income') {
          income += t.amount;
        } else {
          const amount = t.amount;
          totalOutflow += amount;
          if (t.type === 'expense') expenses += amount;
          if (t.type === 'debt') debt += amount;
          if (t.type === 'savings') savings += amount;

          // Check if paid
          if (statusMap[`${t.id}_${monthKey}`]) {
            paidTotal += amount;
          }
        }
      }
    });

    return {
      income,
      expenses,
      debt,
      savings,
      balance: income - totalOutflow,
      executionRate: totalOutflow > 0 ? (paidTotal / totalOutflow) * 100 : 0
    };
  }, [transactions, statusMap]);

  return (
    <FinanceContext.Provider value={{
      transactions,
      statusMap,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      toggleStatus,
      getStatus,
      selectedYear,
      setSelectedYear,
      selectedMonth,
      setSelectedMonth,
      getMonthlySummary
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};