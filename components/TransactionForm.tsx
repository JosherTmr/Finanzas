import React, { useState } from 'react';
import { Category, RecurrenceType, Transaction, TransactionType } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (t: Transaction, isPaid?: boolean) => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<Props> = ({ onClose, onSave, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [category, setCategory] = useState<Category>(initialData?.category || 'food');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initialData?.recurrence || 'one-time');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  
  // New state for immediate payment (only for new entries)
  const [isPaid, setIsPaid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newTransaction: Transaction = {
      id: initialData?.id || crypto.randomUUID(),
      title,
      amount: parseFloat(amount),
      type,
      category,
      recurrence,
      startDate,
      endDate: recurrence === 'monthly-range' ? endDate : undefined,
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
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted text-xl">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-textMain focus:outline-none focus:border-primary text-3xl font-bold placeholder-white/20"
                placeholder="0"
                autoFocus
              />
            </div>
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
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  type === t 
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

          {/* Date Logic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                {recurrence === 'permanent' ? 'Desde' : 'Fecha'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain text-sm scheme-dark"
              />
            </div>
            {recurrence === 'monthly-range' && (
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-textMain text-sm scheme-dark"
                />
              </div>
            )}
          </div>

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

          {/* Paid Checkbox - Only for new one-time transactions */}
          {!initialData && recurrence === 'one-time' && (
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