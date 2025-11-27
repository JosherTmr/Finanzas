import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Save, Briefcase, Clock, DollarSign, Globe } from 'lucide-react';
import { calculateHourlyRate, getHourlyRateMessage } from '../utils/workTimeCalculator';

interface Props {
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { userConfig, updateUserConfig, getMonthlyIncomeTransaction, updateMonthlyIncome, loginGoogle, logout, isGoogleAuth } = useFinance();

  // Get the actual monthly income from transactions
  const incomeTransaction = getMonthlyIncomeTransaction();
  const currentIncome = incomeTransaction?.amount || 0;

  const [days, setDays] = useState(userConfig.workDaysPerWeek.toString());
  const [hours, setHours] = useState(userConfig.workHoursPerDay.toString());
  const [income, setIncome] = useState(currentIncome.toString());
  const [currency, setCurrency] = useState(userConfig.currencyCode || 'COP');
  const [locale, setLocale] = useState(userConfig.locale || 'es-CO');

  // Sync state with context when data changes (fixes stale data on re-open)
  React.useEffect(() => {
    setIncome(currentIncome.toString());
    setDays(userConfig.workDaysPerWeek.toString());
    setHours(userConfig.workHoursPerDay.toString());
    setCurrency(userConfig.currencyCode || 'COP');
    setLocale(userConfig.locale || 'es-CO');
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
        workHoursPerDay: parseFloat(hours) || 8,
        currencyCode: currency,
        locale: locale
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

          {/* Google Cloud Sync */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
              <Globe size={14} /> Sincronización en la Nube
            </label>
            {!isGoogleAuth ? (
              <button
                type="button"
                onClick={loginGoogle}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl shadow border border-gray-200 transition-all flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Conectar con Google
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-income/10 border border-income/30 rounded-xl p-3 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-income rounded-full animate-pulse"></div>
                  <span className="text-sm text-income font-medium">✓ Sincronizado con Google Drive</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('¿Estás seguro de que deseas cerrar sesión? Perderás el acceso a la sincronización en la nube.')) {
                      await logout();
                    }
                  }}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-2 px-4 rounded-xl border border-red-500/30 transition-all"
                >
                  Desconectar de Google
                </button>
              </div>
            )}
            <p className="text-[10px] text-textMuted mt-1">
              Tus datos se guardarán automáticamente en Google Drive y podrás acceder desde cualquier dispositivo.
            </p>
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

          <div className="grid grid-cols-2 gap-4">
            {/* Currency */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                <Globe size={14} /> Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg appearance-none"
              >
                <option value="COP">COP ($)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="MXN">MXN ($)</option>
                <option value="ARS">ARS ($)</option>
                <option value="CLP">CLP ($)</option>
              </select>
            </div>

            {/* Locale */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                <Globe size={14} /> Formato
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg appearance-none"
              >
                <option value="es-CO">Colombia</option>
                <option value="en-US">USA</option>
                <option value="es-ES">España</option>
                <option value="es-MX">México</option>
                <option value="es-AR">Argentina</option>
                <option value="es-CL">Chile</option>
              </select>
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