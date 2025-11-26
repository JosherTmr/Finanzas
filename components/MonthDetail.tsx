import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_COLORS, CATEGORY_LABELS, Transaction } from '../types';
import { formatCurrency } from '../utils';
import { Check, Edit2, Trash2, Plus, ArrowLeft, RefreshCw, Bookmark, CalendarClock } from 'lucide-react';
import TransactionForm from './TransactionForm';

interface Props {
  onBack: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthDetail: React.FC<Props> = ({ onBack }) => {
  const { 
    transactions, 
    selectedMonth, 
    selectedYear, 
    getStatus, 
    toggleStatus, 
    deleteTransaction,
    addTransaction,
    updateTransaction 
  } = useFinance();

  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const monthKey = `${selectedYear}-${selectedMonth}`;

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
      // Sort: Pending first, then by amount desc
      const statusA = getStatus(a.id, monthKey);
      const statusB = getStatus(b.id, monthKey);
      if (statusA === statusB) return b.amount - a.amount;
      return statusA ? 1 : -1;
    });
  }, [transactions, selectedMonth, selectedYear, getStatus]);

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
  }, [currentMonthTransactions, selectedMonth, selectedYear, getStatus]);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Borrar este registro?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="min-h-screen bg-background relative pb-24">
      {/* Navbar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-textMuted">
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
                        {formatCurrency(summary.balance)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-black/20 p-2 rounded-lg">
                   <span className="text-[10px] text-textMuted uppercase block">Ingresos</span>
                   <span className="text-income font-semibold text-sm">{formatCurrency(summary.income)}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                   <span className="text-[10px] text-textMuted uppercase block">Planificado</span>
                   <span className="text-expense font-semibold text-sm">{formatCurrency(summary.totalOut)}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                   <span className="text-[10px] text-textMuted uppercase block">Pendiente</span>
                   <span className="text-textMain font-semibold text-sm">{formatCurrency(summary.pendingTotal)}</span>
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
               <button onClick={() => setIsFormOpen(true)} className="mt-4 text-primary font-bold">Agregar Gasto</button>
            </div>
          ) : (
            currentMonthTransactions.map(t => {
               const isCompleted = getStatus(t.id, monthKey);
               const isIncome = t.type === 'income';

               return (
                 <div 
                   key={t.id}
                   className={`
                     group relative flex items-center p-4 rounded-xl border transition-all duration-300
                     ${isCompleted 
                        ? 'bg-black/20 border-transparent opacity-50' 
                        : 'bg-card border-white/5 shadow-md hover:translate-x-1'
                     }
                   `}
                 >
                    {/* Checkbox Logic */}
                    <button
                      onClick={() => toggleStatus(t.id, monthKey)}
                      className={`
                        w-6 h-6 rounded-md border-2 mr-4 flex items-center justify-center transition-colors
                        ${isCompleted 
                           ? 'bg-primary border-primary text-background' 
                           : 'bg-transparent border-textMuted group-hover:border-primary'
                        }
                      `}
                    >
                      {isCompleted && <Check size={16} strokeWidth={3} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0" onClick={() => { setEditingItem(t); setIsFormOpen(true); }}>
                       <div className="flex justify-between items-baseline">
                          <span className={`font-medium text-base truncate ${isCompleted ? 'line-through text-textMuted' : 'text-textMain'}`}>
                            {t.title}
                          </span>
                          <span className={`font-bold ml-2 whitespace-nowrap ${isIncome ? 'text-income' : 'text-textMain'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                       </div>
                       
                       <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-textMuted uppercase tracking-wide border border-white/5`}>
                            {CATEGORY_LABELS[t.category]}
                          </span>
                          
                          {t.recurrence === 'permanent' && (
                             <span className="flex items-center gap-1 text-[10px] text-primary">
                                <Bookmark size={10} /> Fijo
                             </span>
                          )}
                          {t.recurrence === 'monthly-range' && (
                             <span className="flex items-center gap-1 text-[10px] text-secondary">
                                <CalendarClock size={10} /> Recurrente
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
          onSave={(t) => {
            if (editingItem) updateTransaction(t);
            else addTransaction(t);
          }}
        />
      )}
    </div>
  );
};

export default MonthDetail;