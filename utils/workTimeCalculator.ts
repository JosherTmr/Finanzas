import { UserConfig } from '../types';

/**
 * Calculate hourly rate based on monthly income and work configuration
 */
export const calculateHourlyRate = (
    monthlyIncome: number,
    workDaysPerWeek: number,
    workHoursPerDay: number
): number => {
    if (monthlyIncome <= 0 || workDaysPerWeek <= 0 || workHoursPerDay <= 0) {
        return 0;
    }

    // Approximate weeks per month (4.33 = 52 weeks / 12 months)
    const weeksPerMonth = 4.33;
    const hoursPerMonth = workDaysPerWeek * workHoursPerDay * weeksPerMonth;

    return monthlyIncome / hoursPerMonth;
};

/**
 * Convert an amount to work time (hours and days)
 */
export const getWorkTimeCost = (
    amount: number,
    hourlyRate: number
): { hours: number; days: number; minutes: number } => {
    if (hourlyRate <= 0) {
        return { hours: 0, days: 0, minutes: 0 };
    }

    const hours = amount / hourlyRate;
    const minutes = hours * 60;
    const days = hours / 8; // Assuming 8-hour workday for display

    return {
        hours: parseFloat(hours.toFixed(2)),
        days: parseFloat(days.toFixed(2)),
        minutes: parseFloat(minutes.toFixed(0))
    };
};

/**
 * Generate a friendly message about work time cost using Time Coins
 */
export const getWorkTimeMessage = (
    amount: number,
    hourlyRate: number,
    workHoursPerDay: number = 8
): string => {
    if (amount <= 0 || hourlyRate <= 0) {
        return '';
    }

    const { hours, days } = getWorkTimeCost(amount, hourlyRate);

    // Less than 1 hour - show as decimal
    if (hours < 1) {
        return `⏱️ Cuesta ${hours.toFixed(1)} time coins`;
    }

    // Between 1 and 2 hours
    if (hours < 2) {
        return `💎 Cuesta ${hours.toFixed(1)} time coins`;
    }

    // Less than a full workday
    if (hours < workHoursPerDay) {
        return `⏰ Cuesta ${hours.toFixed(1)} time coins`;
    }

    // Between 1 and 2 days
    if (days < 2) {
        return `📅 Equivale a ${days.toFixed(1)} día de energía`;
    }

    // Between 2 and 5 days (a work week)
    if (days < 5) {
        return `📆 Equivale a ${days.toFixed(1)} días de energía`;
    }

    // Between 1 and 2 weeks
    if (days < 10) {
        const weeks = days / 5;
        return `🗓️ Representa ${weeks.toFixed(1)} semanas de esfuerzo`;
    }

    // More than 2 weeks
    if (days < 20) {
        const weeks = days / 5;
        return `🚨 ¡Son ${weeks.toFixed(1)} semanas de esfuerzo!`;
    }

    // A month or more
    const months = days / 20; // Approximate working days per month
    if (months < 2) {
        return `⚠️ ¡Es más de un mes de esfuerzo!`;
    }

    return `🔥 ¡Son ${months.toFixed(1)} meses de esfuerzo!`;
};

/**
 * Get a formatted hourly rate message for display
 */
export const getHourlyRateMessage = (hourlyRate: number): string => {
    if (hourlyRate <= 0) {
        return 'Configura tu salario para ver el valor de tu tiempo';
    }

    return `Con esta configuración, 1 time coin (hora) vale $${hourlyRate.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
};
