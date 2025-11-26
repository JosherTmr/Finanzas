import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Save, Briefcase, Clock, DollarSign } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { userConfig, updateUserConfig } = useFinance();
  
  const [days, setDays] = useState(userConfig.workDaysPerWeek.toString());
  const [hours, setHours] = useState(userConfig.workHoursPerDay.toString());
  const [income, setIncome] = useState(userConfig.monthlyIncome.toString());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserConfig({
      monthlyIncome: parseFloat(income) || 0,
      workDaysPerWeek: parseFloat(days) || 5,
      workHoursPerDay: parseFloat(hours) || 8
    });
    onClose();
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
              <DollarSign size={14} /> Salario Base (Referencia)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg"
              placeholder="0"
            />
            <p className="text-[10px] text-textMuted mt-1">Este valor es referencial, los cálculos usan tus ingresos reales del mes.</p>
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

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
             <p className="text-xs text-primary/80 leading-relaxed text-center">
               Estos datos se usarán para calcular cuántas <strong>horas de vida</strong> te cuestan tus gastos reales cada mes.
             </p>
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