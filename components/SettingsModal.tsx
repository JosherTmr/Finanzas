import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Save, Briefcase, Clock, DollarSign } from 'lucide-react';
import { calculateHourlyRate, getHourlyRateMessage } from '../utils/workTimeCalculator';

interface Props {
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { userConfig, updateUserConfig, getMonthlyIncomeTransaction, updateMonthlyIncome } = useFinance();

  // Get the actual monthly income from transactions
  const incomeTransaction = getMonthlyIncomeTransaction();
  const currentIncome = incomeTransaction?.amount || 0;

  const [days, setDays] = useState(userConfig.workDaysPerWeek.toString());
  const [hours, setHours] = useState(userConfig.workHoursPerDay.toString());
  const [income, setIncome] = useState(currentIncome.toString());

  // Sync state with context when data changes (fixes stale data on re-open)
  React.useEffect(() => {
    setIncome(currentIncome.toString());
    setDays(userConfig.workDaysPerWeek.toString());
    setHours(userConfig.workHoursPerDay.toString());
  }, [currentIncome, userConfig]);

  // Calculate hourly rate in real-time
  const hourlyRate = useMemo(() => {
    const incomeNum = parseFloat(income) || 0;
    const daysNum = parseFloat(days) || 5;
    const hoursNum = parseFloat(hours) || 8;
    return calculateHourlyRate(incomeNum, daysNum, hoursNum);
  }, [income, days, hours]);

  const hourlyRateMessage = useMemo(() => {
    return getHourlyRateMessage(hourlyRate);
  }, [hourlyRate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update monthly income using the new method (preserves history)
      const newIncome = parseFloat(income) || 0;
      if (newIncome !== currentIncome) {
        updateMonthlyIncome(newIncome);
      }

      // Update work configuration
      updateUserConfig({
        ...userConfig,
        workDaysPerWeek: parseFloat(days) || 5,
        workHoursPerDay: parseFloat(hours) || 8
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert(`Hubo un error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold text-textMain">Configuración de Perfil</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-textMuted" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Income (Reference) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
              <DollarSign size={14} /> Sueldo Mensual
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg"
              placeholder="0"
            />
            <p className="text-[10px] text-textMuted mt-1">Los cambios se aplicarán desde el mes actual en adelante, preservando el historial.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Days per week */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                <Briefcase size={14} /> Días / Semana
              </label>
              <input
                type="number"
                max="7"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg"
              />
            </div>

            {/* Hours per day */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                <Clock size={14} /> Horas / Día
              </label>
              <input
                type="number"
                max="24"
                min="1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg"
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Hourly rate preview */}
            {hourlyRate > 0 && (
              <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                <p className="text-xs text-secondary/80 leading-relaxed text-center">
                  💰 {hourlyRateMessage}
                </p>
              </div>
            )}

            {/* Motivational message */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-xs text-primary/80 leading-relaxed text-center">
                Estos datos se usarán para mostrarte cuántas <strong>horas de vida</strong> te cuestan tus gastos reales cada mes. ¡Toma decisiones más conscientes! 💪
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Guardar Configuración
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;