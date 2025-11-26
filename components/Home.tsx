import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils';
import { ChevronDown, Lock, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface Props { }

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Home: React.FC<Props> = () => {
  const { selectedYear, setSelectedYear, getMonthlySummary } = useFinance();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Create array of months 11 down to 0
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => 11 - i), []);

  return (
    <div className="pb-8 px-4 pt-4 relative">
      {/* Header / Year Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-textMain tracking-tight">Mis Finanzas</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-surface text-primary font-bold py-2 pl-4 pr-10 rounded-xl border border-primary/20 focus:outline-none focus:border-primary shadow-lg shadow-black/20"
            >
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-surface text-textMuted rounded-xl border border-white/5 hover:text-primary hover:bg-white/5 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Month List */}
      <div className="space-y-4">
        {months.map((monthIndex) => {
          const isFuture = selectedYear > currentYear || (selectedYear === currentYear && monthIndex > currentMonthIndex);
          const isCurrent = selectedYear === currentYear && monthIndex === currentMonthIndex;
          const summary = getMonthlySummary(selectedYear, monthIndex);
          const totalOut = summary.expenses + summary.debt + summary.savings;
          // Pending = TotalOut * (1 - executionRate/100).
          const pendingAmount = totalOut * (1 - (summary.executionRate / 100));

          return (
            <Link
              key={monthIndex}
              to={!isFuture ? `/mes/${selectedYear}/${monthIndex}` : '#'}
              className={`
                block relative overflow-hidden rounded-2xl transition-all duration-300 border
                ${isFuture
                  ? 'bg-surface/30 border-white/5 opacity-50 cursor-not-allowed grayscale pointer-events-none'
                  : 'bg-surface border-white/5 shadow-lg hover:scale-[1.02] cursor-pointer'
                }
                ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
              `}
            >
              {/* Card Body */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className={`text-xl font-bold ${isCurrent ? 'text-primary' : 'text-textMain'}`}>
                      {MONTH_NAMES[monthIndex]}
                    </h2>
                    {isCurrent && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">Mes Actual</span>}
                  </div>
                  {isFuture && <Lock size={20} className="text-textMuted" />}
                </div>

                {!isFuture && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <span className="text-xs text-textMuted block mb-1">Balance (Disp.)</span>
                      <span className={`text-lg font-bold ${summary.balance >= 0 ? 'text-white' : 'text-expense'}`}>
                        {formatCurrency(summary.balance)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-textMuted block mb-1">Por Pagar</span>
                      <span className="text-lg font-bold text-expense">
                        {formatCurrency(pendingAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Visual Progress Line for current/past */}
                {!isFuture && (
                  <div className="mt-4 h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${summary.executionRate}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Decorative bottom gradient */}
              {!isFuture && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-surface opacity-50"></div>
              )}
            </Link>
          );
        })}
      </div>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

export default Home;