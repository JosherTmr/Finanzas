export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Using COP based on screenshot context (millions), changeable
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateWorkHours = (amount: number, totalIncome: number): string | null => {
  if (!totalIncome || totalIncome <= 0) return null;
  
  // Standard work month = 160 hours
  const hourlyRate = totalIncome / 160;
  const hoursNeeded = amount / hourlyRate;

  if (hoursNeeded < 1) {
    const minutes = Math.round(hoursNeeded * 60);
    return `${minutes} min`;
  }
  
  return `${hoursNeeded.toFixed(1)} hrs`;
};