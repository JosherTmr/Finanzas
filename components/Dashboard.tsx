import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../utils';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const Dashboard: React.FC<Props> = ({ onBack }) => {
  const { transactions, selectedYear, getStatus, userConfig } = useFinance();

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(selectedYear, i, 1);
    const monthEnd = new Date(selectedYear, i + 1, 0);

    let income = 0;
    let expense = 0;
    let savings = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.startDate);
      const isInMonth = (
        (t.recurrence === 'one-time' && tDate.getMonth() === i && tDate.getFullYear() === selectedYear) ||
        (t.recurrence === 'permanent' && tDate <= monthEnd) ||
        (t.recurrence === 'monthly-range' && t.endDate && new Date(t.endDate) >= monthStart && tDate <= monthEnd)
      );

      if (isInMonth) {
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'savings') savings += t.amount;
        else expense += t.amount;
      }
    });

    return {
      name: new Date(selectedYear, i).toLocaleString('es-ES', { month: 'short' }),
      income,
      expense,
      savings,
      net: income - (expense + savings)
    };
  });

  const totalSavings = monthlyData.reduce((acc, curr) => acc + curr.savings, 0);
  const totalIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0);

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 bg-surface rounded-full hover:bg-white/10">
          <ArrowLeft size={20} className="text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-white">Resumen {selectedYear}</h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-white/5 p-4 rounded-2xl">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Ahorro Total</h3>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSavings, userConfig.currencyCode, userConfig.locale)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {(totalSavings / (totalIncome || 1) * 100).toFixed(1)}% de ingresos
          </p>
        </div>
        <div className="bg-surface border border-white/5 p-4 rounded-2xl">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Cashflow Anual</h3>
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(monthlyData.reduce((acc, curr) => acc + curr.net, 0), userConfig.currencyCode, userConfig.locale)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Libre tras gastos</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface border border-white/5 p-4 rounded-2xl h-80">
        <h3 className="text-white font-semibold mb-4 text-sm">Ingresos vs Gastos</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(val) => `${val / 1000}k`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="income" radius={[4, 4, 0, 0]} barSize={8} fill="#10b981" />
            <Bar dataKey="expense" radius={[4, 4, 0, 0]} barSize={8} fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Categories */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold text-sm">Desglose de Gastos</h3>
        {/* Simplified visual breakdown */}
        {['housing', 'food', 'debt', 'entertainment'].map(cat => (
          <div key={cat} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-white/5">
            <span className="text-sm text-gray-300 capitalize">{cat === 'housing' ? 'Vivienda' : cat === 'food' ? 'Alimentación' : cat === 'debt' ? 'Deudas' : 'Ocio'}</span>
            <span className="text-sm text-gray-500">Ver detalles</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;