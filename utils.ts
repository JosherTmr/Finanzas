export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Using COP based on screenshot context (millions), changeable
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};