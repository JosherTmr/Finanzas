import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_LABELS, Transaction } from '../types';
import { formatCurrency, calculateWorkHours } from '../utils';
import { Check, Plus, ArrowLeft, Bookmark, CalendarClock, Timer, Tag } from 'lucide-react';
import TransactionForm from './TransactionForm';

import { useParams, useNavigate } from 'react-router-dom';

interface Props { }

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthDetail: React.FC<Props> = () => {
  const navigate = useNavigate();
  const { year, month } = useParams<{ year: string; month: string }>();
  const selectedYear = Number(year);
  const selectedMonth = Number(month);

  const {
    transactions,
    getStatus,
    toggleStatus,
    deleteTransaction,
    addTransaction,
    updateTransaction,
    splitTransaction,
    userConfig
  } = useFinance();

  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const monthKey = `${selectedYear}-${selectedMonth}`;

  const totalMonthlyWorkHours = useMemo(() => {
    return userConfig.workDaysPerWeek * userConfig.workHoursPerDay * 4;
  }, [userConfig]);

  // Filter and Sort Transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.startDate);
      const viewDateStart = new Date(selectedYear, selectedMonth, 1);
      const viewDateEnd = new Date(selectedYear, selectedMonth + 1, 0);

      if (t.recurrence === 'one-time') {
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
      }
      if (t.recurrence === 'permanent') {
        return tDate <= viewDateEnd;
      }
      if (t.recurrence === 'monthly-range' && t.endDate) {
        const endDate = new Date(t.endDate);
        return tDate <= viewDateEnd && endDate >= viewDateStart;
      }
      return false;
    }).sort((a, b) => {
      // Sort chronologically by date
      return new Date(a.startDate).getDate() - new Date(b.startDate).getDate();
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate Totals
  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let debt = 0;
    let savings = 0;
    let paidTotal = 0;
    let pendingTotal = 0;

    currentMonthTransactions.forEach(t => {
      const isPaid = getStatus(t.id, monthKey);

      if (t.type === 'income') {
        income += t.amount;
      } else {
        if (t.type === 'expense') expenses += t.amount;
        if (t.type === 'debt') debt += t.amount;
        if (t.type === 'savings') savings += t.amount;

        if (isPaid) paidTotal += t.amount;
        else pendingTotal += t.amount;
      }
    });

    const totalOut = expenses + debt + savings;
    return { income, totalOut, balance: income - totalOut, paidTotal, pendingTotal };
  }, [currentMonthTransactions, getStatus, monthKey]);

  const getInstallmentInfo = (t: Transaction) => {
    if (t.recurrence !== 'monthly-range' || !t.endDate) return null;
    const [sYear, sMonth] = t.startDate.split('-').map(Number);
    const [eYear, eMonth] = t.endDate.split('-').map(Number);
    const startMIndex = sMonth - 1;
    const endMIndex = eMonth - 1;
    const totalMonths = (eYear - sYear) * 12 + (endMIndex - startMIndex) + 1;
    const currentInstallment = (selectedYear - sYear) * 12 + (selectedMonth - startMIndex) + 1;
    return { current: currentInstallment, total: totalMonths };
  };

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Navbar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-white/10 text-textMuted">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-textMain">{MONTH_NAMES[selectedMonth]} {selectedYear}</h1>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-surface to-card rounded-2xl p-5 shadow-lg border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-textMuted text-xs uppercase tracking-wider font-semibold">Disponible</span>
              <div className={`text-4xl font-bold mt-1 ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(summary.balance, userConfig.currencyCode, userConfig.locale)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-black/20 p-2 rounded-lg">
              <span className="text-[10px] text-textMuted uppercase block">Ingresos</span>
              <span className="text-income font-semibold text-sm">{formatCurrency(summary.income, userConfig.currencyCode, userConfig.locale)}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-lg">
              <span className="text-[10px] text-textMuted uppercase block">Planificado</span>
              <span className="text-expense font-semibold text-sm">{formatCurrency(summary.totalOut, userConfig.currencyCode, userConfig.locale)}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-lg">
              <span className="text-[10px] text-textMuted uppercase block">Pendiente</span>
              <span className="text-textMain font-semibold text-sm">{formatCurrency(summary.pendingTotal, userConfig.currencyCode, userConfig.locale)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="px-4">
        <h3 className="text-textMuted text-sm font-medium mb-3 ml-1 uppercase tracking-wider">Movimientos</h3>
        <div className="space-y-3">
          {currentMonthTransactions.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <p>No hay registros este mes.</p>
              <button onClick={() => setIsFormOpen(true)} className="mt-4 text-primary font-bold">Agregar Registro</button>
            </div>
          ) : (
            currentMonthTransactions.map(t => {
              const isCompleted = getStatus(t.id, monthKey);
              const isIncome = t.type === 'income';
              const workHours = !isIncome ? calculateWorkHours(t.amount, summary.income, totalMonthlyWorkHours) : null;
              const installment = getInstallmentInfo(t);
              const transactionDate = new Date(t.startDate);
              // Add timezone offset to show correct local date
              transactionDate.setMinutes(transactionDate.getMinutes() + transactionDate.getTimezoneOffset());
              const dayString = transactionDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '');

              return (
                <div
                  key={t.id}
                  className={`group relative flex items-center p-4 rounded-xl border transition-all duration-300 ${isCompleted ? 'bg-black/20 border-transparent opacity-50' : 'bg-card border-white/5 shadow-md hover:border-white/20'}`}
                  onClick={() => { setEditingItem(t); setIsFormOpen(true); }}
                >
                  {/* Date & Checkbox Column */}
                  <div className="flex flex-col items-center w-16 mr-2 text-center">
                    <span className="text-xs text-textMuted font-semibold uppercase">{dayString.split(' ')[1]}</span>
                    <span className="text-xl font-bold text-textMain -mt-1">{dayString.split(' ')[0]}</span>
                    {!isIncome && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(t.id, monthKey); }}
                        className={`w-6 h-6 mt-2 rounded-md border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-primary border-primary text-background' : 'bg-transparent border-textMuted group-hover:border-primary'}`}
                      >
                        {isCompleted && <Check size={16} strokeWidth={3} />}
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`font-medium text-base truncate mt-0.5 ${isCompleted ? 'line-through text-textMuted' : 'text-textMain'}`}>
                        {t.title}
                      </span>
                      <div className="text-right ml-2">
                        <span className={`font-bold whitespace-nowrap block ${isIncome ? 'text-income' : 'text-textMain'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount, userConfig.currencyCode, userConfig.locale)}
                        </span>
                        {workHours && (
                          <span className="text-[10px] text-primary/70 font-medium flex items-center justify-end gap-1 mt-0.5">
                            <Timer size={10} /> {workHours}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-textMuted uppercase tracking-wide border border-white/5 flex items-center gap-1`}>
                        <Tag size={10} /> {CATEGORY_LABELS[t.category]}
                      </span>
                      {installment && !isIncome && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-expense/30 text-expense bg-expense/5 font-medium">
                          Cuota {installment.current}/{installment.total}
                        </span>
                      )}
                      {t.recurrence === 'permanent' && (
                        <span className="flex items-center gap-1 text-[10px] text-primary">
                          <Bookmark size={10} /> Fijo
                        </span>
                      )}
                      {t.type === 'debt' && t.paymentDay && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <CalendarClock size={10} /> Día de pago: {t.paymentDay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform z-40 active:scale-95"
      >
        <Plus size={30} />
      </button>

      {/* Modal */}
      {isFormOpen && (
        <TransactionForm
          initialData={editingItem || undefined}
          onClose={() => setIsFormOpen(false)}
          onSave={(t, isPaidImmediate) => {
            if (editingItem) {
              const currentViewStart = new Date(selectedYear, selectedMonth, 1);
              splitTransaction(editingItem, t, currentViewStart);
            } else {
              addTransaction(t);
              if (isPaidImmediate) {
                const parts = t.startDate.split('-');
                const y = parts[0];
                const m = parseInt(parts[1]) - 1;
                const key = `${y}-${m}`;
                toggleStatus(t.id, key);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default MonthDetail;