import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Transaction, TransactionStatusMap, MonthlySummary, UserConfig } from '../types';
import { useGoogleCloud } from '../hooks/useGoogleCloud';

interface FinanceContextType {
  transactions: Transaction[];
  statusMap: TransactionStatusMap;
  userConfig: UserConfig;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  splitTransaction: (original: Transaction, updated: Transaction, splitDate: Date) => void;
  toggleStatus: (transactionId: string, monthKey: string) => void;
  getStatus: (transactionId: string, monthKey: string) => boolean;
  updateUserConfig: (config: UserConfig) => void;
  getMonthlyIncomeTransaction: () => Transaction | undefined;
  updateMonthlyIncome: (newAmount: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number; // 0-11
  setSelectedMonth: (month: number) => void;
  getMonthlySummary: (year: number, month: number) => MonthlySummary;
  loginGoogle: () => void;
  isGoogleAuth: boolean;
  schedulePayment: (title: string, date: string, amount: number) => Promise<void>;
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

const INITIAL_CONFIG: UserConfig = {
  monthlyIncome: 0,
  workDaysPerWeek: 5,
  workHoursPerDay: 8,
  currencyCode: 'COP',
  locale: 'es-CO'
};

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Google Cloud integration
  const {
    isAuthenticated,
    handleLogin,
    saveToDrive,
    loadFromDrive,
    addToCalendar
  } = useGoogleCloud();

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [statusMap, setStatusMap] = useState<TransactionStatusMap>(() => {
    const saved = localStorage.getItem('statusMap');
    return saved ? JSON.parse(saved) : {};
  });

  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem('userConfig');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Load data from Drive when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFromDrive().then(data => {
        if (data) {
          const localLastUpdated = Number(localStorage.getItem('lastUpdated')) || 0;
          // Use the most recent data (Drive vs localStorage)
          if (data.lastUpdated > localLastUpdated) {
            console.log('📥 Cargando datos desde Drive (más reciente)');
            setTransactions(data.transactions);
            setUserConfig(data.userConfig);
            setStatusMap(data.statusMap);
            localStorage.setItem('lastUpdated', data.lastUpdated.toString());
          } else {
            console.log('📱 Datos locales son más recientes');
          }
        }
      });
    }
  }, [isAuthenticated, loadFromDrive]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('statusMap', JSON.stringify(statusMap));
  }, [statusMap]);

  useEffect(() => {
    localStorage.setItem('userConfig', JSON.stringify(userConfig));
  }, [userConfig]);

  // Auto-save to Drive with debounce
  useEffect(() => {
    if (isAuthenticated) {
      const timeout = setTimeout(() => {
        const backupData = {
          transactions,
          userConfig,
          statusMap,
          lastUpdated: Date.now()
        };
        saveToDrive(backupData);
        localStorage.setItem('lastUpdated', backupData.lastUpdated.toString());
      }, 2000); // 2 second debounce
      return () => clearTimeout(timeout);
    }
  }, [transactions, userConfig, statusMap, isAuthenticated, saveToDrive]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateUserConfig = (config: UserConfig) => {
    setUserConfig(config);
  };

  // Logic to handle historic editing
  const splitTransaction = (original: Transaction, updated: Transaction, splitDate: Date) => {
    const originalStart = new Date(original.startDate);
    // Normalize time to midnight to compare just dates safely
    originalStart.setHours(0, 0, 0, 0);
    const split = new Date(splitDate);
    split.setHours(0, 0, 0, 0);

    // If original started BEFORE the split date, we must split history
    if (originalStart < split) {
      // 1. Cap the old transaction
      const prevDate = new Date(split);
      prevDate.setDate(prevDate.getDate() - 1);

      // Handle timezone offset for YYYY-MM-DD string
      const offset = prevDate.getTimezoneOffset();
      const localPrevDate = new Date(prevDate.getTime() - (offset * 60 * 1000));
      const endDateStr = localPrevDate.toISOString().split('T')[0];

      const oldVersion: Transaction = {
        ...original,
        recurrence: 'monthly-range',
        endDate: endDateStr
      };

      // 2. Create the new transaction starting from splitDate
      // Ensure splitDate string is correct in local time
      const offsetSplit = split.getTimezoneOffset();
      const localSplitDate = new Date(split.getTime() - (offsetSplit * 60 * 1000));
      const startDateStr = localSplitDate.toISOString().split('T')[0];

      const newVersion: Transaction = {
        ...updated,
        id: generateUUID(), // New ID implies fresh start for stats tracking
        startDate: startDateStr,
        createdAt: Date.now()
      };

      setTransactions(prev => {
        // Remove original, add oldVersion (capped) and newVersion (started now)
        return [...prev.filter(t => t.id !== original.id), oldVersion, newVersion];
      });

    } else {
      // If original started this month or later, just update normally
      updateTransaction(updated);
    }
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

  // Get the primary monthly income transaction (Sueldo Mensual)
  const getMonthlyIncomeTransaction = useCallback((): Transaction | undefined => {
    // Prioritize permanent income transaction (current salary)
    const permanent = transactions.find(t =>
      t.type === 'income' && t.recurrence === 'permanent'
    );
    if (permanent) return permanent;

    // Fallback to any monthly-range if no permanent exists
    return transactions.find(t =>
      t.type === 'income' && t.recurrence === 'monthly-range'
    );
  }, [transactions]);

  // Helper for safe UUID generation
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Update monthly income with historical preservation
  const updateMonthlyIncome = (newAmount: number) => {
    const incomeTransaction = getMonthlyIncomeTransaction();
    if (!incomeTransaction) {
      // If no income transaction exists, create a new one
      const newIncome: Transaction = {
        id: generateUUID(),
        title: 'Sueldo Mensual',
        amount: newAmount,
        type: 'income',
        category: 'income',
        recurrence: 'permanent',
        startDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      addTransaction(newIncome);
      return;
    }

    // If amount hasn't changed, do nothing
    if (incomeTransaction.amount === newAmount) {
      return;
    }

    // Create updated transaction with new amount
    const updatedTransaction: Transaction = {
      ...incomeTransaction,
      amount: newAmount
    };

    // Use splitTransaction to preserve history
    // Split at the first day of current month
    const now = new Date();
    const splitDate = new Date(now.getFullYear(), now.getMonth(), 1);

    splitTransaction(incomeTransaction, updatedTransaction, splitDate);
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
      userConfig,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      splitTransaction,
      toggleStatus,
      getStatus,
      updateUserConfig,
      getMonthlyIncomeTransaction,
      updateMonthlyIncome,
      selectedYear,
      setSelectedYear,
      selectedMonth,
      setSelectedMonth,
      getMonthlySummary,
      loginGoogle: handleLogin,
      isGoogleAuth: isAuthenticated,
      schedulePayment: addToCalendar
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