import React, { useState, useMemo, useEffect } from 'react';
import { Category, RecurrenceType, Transaction, TransactionType } from '../types';
import { X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { calculateHourlyRate, getWorkTimeMessage } from '../utils/workTimeCalculator';

interface Props {
  onClose: () => void;
  onSave: (t: Transaction, isPaid?: boolean) => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<Props> = ({ onClose, onSave, initialData }) => {
  const { userConfig, getMonthlyIncomeTransaction } = useFinance();

  const [title, setTitle] = useState(initialData?.title || '');
  // This 'amount' state will now handle BOTH monthly amount and total debt amount
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [category, setCategory] = useState<Category>(initialData?.category || 'food');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initialData?.recurrence || 'one-time');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  
  // New fields for Smart Debt Mode
  const [totalDebtAmount, setTotalDebtAmount] = useState(initialData?.totalDebtAmount?.toString() || '');
  const [installmentsCount, setInstallmentsCount] = useState(initialData?.installmentsCount?.toString() || '');
  const [paymentDay, setPaymentDay] = useState(initialData?.paymentDay?.toString() || '1');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPaid, setIsPaid] = useState(false);

  const isSmartDebtMode = useMemo(() => type === 'debt' && recurrence === 'monthly-range', [type, recurrence]);

  // Effect for one-time expenses
  useEffect(() => {
    if (type === 'expense' && recurrence === 'one-time') {
      setIsPaid(true);
    } else {
      setIsPaid(false); // Reset if conditions change
    }
  }, [type, recurrence]);

  const workTimeMessage = useMemo(() => {
    const amountToCompare = isSmartDebtMode ? totalDebtAmount : amount;
    if (type !== 'expense' || !amountToCompare || parseFloat(amountToCompare) <= 0) {
      return '';
    }
    const incomeTransaction = getMonthlyIncomeTransaction();
    const monthlyIncome = incomeTransaction?.amount || 0;
    if (monthlyIncome <= 0) return '';
    const hourlyRate = calculateHourlyRate(monthlyIncome, userConfig.workDaysPerWeek, userConfig.workHoursPerDay);
    return getWorkTimeMessage(parseFloat(amountToCompare), hourlyRate, userConfig.workHoursPerDay);
  }, [amount, totalDebtAmount, isSmartDebtMode, type, userConfig, getMonthlyIncomeTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (isSmartDebtMode) {
      if (!totalDebtAmount || parseFloat(totalDebtAmount) <= 0) newErrors.totalDebtAmount = 'El monto debe ser mayor a 0';
      if (!installmentsCount || parseInt(installmentsCount) <= 0) newErrors.installmentsCount = 'Debe ser al menos 1 cuota';
      if (!paymentDay || parseInt(paymentDay) < 1 || parseInt(paymentDay) > 31) newErrors.paymentDay = 'Día inválido';
    } else {
      if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (recurrence === 'monthly-range' && !isSmartDebtMode) {
      if (!startDate) newErrors.startDate = 'Requerido';
      if (!endDate) newErrors.endDate = 'Requerido';
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        newErrors.dateRange = 'La fecha final no puede ser anterior a la inicial';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!title) return;

    let finalAmount = parseFloat(amount);
    let finalEndDate = recurrence === 'monthly-range' ? endDate : undefined;

    if (isSmartDebtMode) {
      const total = parseFloat(totalDebtAmount);
      const installments = parseInt(installmentsCount);
      finalAmount = total / installments;

      const start = new Date(startDate);
      start.setUTCMonth(start.getUTCMonth() + installments);
      finalEndDate = start.toISOString().split('T')[0];
    }

    const newTransaction: Transaction = {
      id: initialData?.id || crypto.randomUUID(),
      title,
      amount: finalAmount,
      type,
      category,
      recurrence,
      startDate,
      endDate: finalEndDate,
      totalDebtAmount: isSmartDebtMode ? parseFloat(totalDebtAmount) : undefined,
      installmentsCount: isSmartDebtMode ? parseInt(installmentsCount) : undefined,
      paymentDay: isSmartDebtMode ? parseInt(paymentDay) : undefined,
      createdAt: initialData?.createdAt || Date.now(),
    };

    onSave(newTransaction, isPaid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold text-textMain">{initialData ? 'Editar' : 'Nuevo Registro'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-textMuted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
              {isSmartDebtMode ? 'Monto Total de la Deuda' : 'Monto'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted text-xl">$</span>
              <input
                type="number"
                value={isSmartDebtMode ? totalDebtAmount : amount}
                onChange={(e) => {
                  if (isSmartDebtMode) {
                    setTotalDebtAmount(e.target.value);
                    if (errors.totalDebtAmount) setErrors({ ...errors, totalDebtAmount: '' });
                  } else {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }
                }}
                className={`w-full bg-background border rounded-2xl py-4 pl-10 pr-4 text-textMain focus:outline-none focus:border-primary text-3xl font-bold placeholder-white/20 ${errors.amount || errors.totalDebtAmount ? 'border-expense' : 'border-white/10'}`}
                placeholder="0"
                autoFocus
              />
            </div>
            {errors.amount && <p className="text-expense text-xs mt-1 font-medium">{errors.amount}</p>}
            {errors.totalDebtAmount && <p className="text-expense text-xs mt-1 font-medium">{errors.totalDebtAmount}</p>}
            {workTimeMessage && (
              <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl p-3 animate-fade-in">
                <p className="text-sm text-primary font-medium text-center">
                  {workTimeMessage}
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Nombre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain focus:outline-none focus:border-primary text-lg"
              placeholder="Ej: Netflix, Arriendo..."
            />
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-4 gap-2 bg-background p-1.5 rounded-xl border border-white/5">
            {(['expense', 'income', 'debt', 'savings'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${type === t
                  ? t === 'income' ? 'bg-income text-background'
                    : t === 'debt' ? 'bg-expense text-white'
                      : t === 'savings' ? 'bg-secondary text-white'
                        : 'bg-white text-background'
                  : 'text-textMuted hover:text-white'
                  }`}
              >
                {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : t === 'debt' ? 'Deuda' : 'Ahorro'}
              </button>
            ))}
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Frecuencia</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrence('one-time')}
                className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all ${recurrence === 'one-time' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-background text-textMuted'}`}
              >
                Único
              </button>
              <button
                type="button"
                onClick={() => setRecurrence('monthly-range')}
                className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all ${recurrence === 'monthly-range' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-background text-textMuted'}`}
              >
                Recurrente
              </button>
              <button
                type="button"
                onClick={() => setRecurrence('permanent')}
                className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all ${recurrence === 'permanent' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-background text-textMuted'}`}
              >
                Permanente
              </button>
            </div>
            <p className="text-[10px] text-textMuted mt-2 px-1">
              {recurrence === 'one-time' && 'Solo aparece en este mes.'}
              {recurrence === 'monthly-range' && 'Se repite entre una fecha de inicio y fin.'}
              {recurrence === 'permanent' && 'Aparece en todos los meses del año automáticamente.'}
            </p>
          </div>

          {/* Smart Debt Fields */}
          {isSmartDebtMode && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Nº Cuotas</label>
                <input
                  type="number"
                  value={installmentsCount}
                  onChange={(e) => {
                    setInstallmentsCount(e.target.value);
                    if (errors.installmentsCount) setErrors({ ...errors, installmentsCount: '' });
                  }}
                  className={`w-full bg-background border rounded-xl py-3 px-4 text-textMain text-sm scheme-dark ${errors.installmentsCount ? 'border-expense' : 'border-white/10'}`}
                  placeholder="Ej: 12"
                />
                {errors.installmentsCount && <p className="text-expense text-xs mt-1 font-medium">{errors.installmentsCount}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Día de Pago</label>
                <input
                  type="number"
                  value={paymentDay}
                  min="1"
                  max="31"
                  onChange={(e) => {
                    setPaymentDay(e.target.value);
                    if (errors.paymentDay) setErrors({ ...errors, paymentDay: '' });
                  }}
                  className={`w-full bg-background border rounded-xl py-3 px-4 text-textMain text-sm scheme-dark ${errors.paymentDay ? 'border-expense' : 'border-white/10'}`}
                  placeholder="1-31"
                />
                {errors.paymentDay && <p className="text-expense text-xs mt-1 font-medium">{errors.paymentDay}</p>}
              </div>
            </div>
          )}

          {/* Date Logic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                {recurrence === 'permanent' ? 'Desde' : 'Fecha Inicio'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.dateRange) setErrors({ ...errors, dateRange: '' });
                }}
                className={`w-full bg-background border rounded-xl py-3 px-4 text-textMain text-sm scheme-dark ${errors.dateRange || errors.startDate ? 'border-expense' : 'border-white/10'}`}
              />
            </div>
            {recurrence === 'monthly-range' && !isSmartDebtMode && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.dateRange) setErrors({ ...errors, dateRange: '' });
                  }}
                  className={`w-full bg-background border rounded-xl py-3 px-4 text-textMain text-sm scheme-dark ${errors.dateRange || errors.endDate ? 'border-expense' : 'border-white/10'}`}
                />
              </div>
            )}
          </div>
          {errors.dateRange && <p className="text-expense text-xs mt-1 font-medium text-center">{errors.dateRange}</p>}

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain text-sm focus:outline-none appearance-none"
            >
              <option value="housing">Vivienda</option>
              <option value="food">Alimentación</option>
              <option value="utilities">Servicios</option>
              <option value="transport">Transporte</option>
              <option value="debt">Deudas</option>
              <option value="entertainment">Ocio</option>
              <option value="savings">Ahorro</option>
              <option value="income">Ingresos</option>
              <option value="other">Otros</option>
            </select>
          </div>

          {/* Paid Checkbox - Now hidden for one-time expenses, logic is automatic */}
          {!initialData && recurrence === 'one-time' && type !== 'expense' && (
            <div
              className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setIsPaid(!isPaid)}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isPaid ? 'bg-primary border-primary' : 'border-textMuted'}`}>
                {isPaid && <Check size={16} className="text-background" strokeWidth={3} />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-textMain">¿Ya fue pagado?</span>
                <span className="text-[10px] text-textMuted">Se marcará como completado inmediatamente.</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            <Check size={20} />
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;