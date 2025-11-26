export const formatCurrency = (amount: number, currencyCode: string = 'COP', locale: string = 'es-CO'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateWorkHours = (amount: number, totalIncome: number, customMonthlyHours?: number): string | null => {
  if (!totalIncome || totalIncome <= 0) return null;

  // Default to 160 hours (40h week * 4) if no custom config provided
  const monthlyHours = customMonthlyHours && customMonthlyHours > 0 ? customMonthlyHours : 160;

  const hourlyRate = totalIncome / monthlyHours;
  const hoursNeeded = amount / hourlyRate;

  if (hoursNeeded < 1) {
    const minutes = Math.round(hoursNeeded * 60);
    return `${minutes} min`;
  }

  return `${hoursNeeded.toFixed(1)} hrs`;
};