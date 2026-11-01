/**
 * Currency and Number formatters with Indian Lakh/Crore notation support
 * and deterministic integer minor unit math.
 */

export function formatMinorToCurrency(
  minorAmount: number,
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR',
  options?: { compact?: boolean; hideDecimals?: boolean }
): string {
  const major = minorAmount / 100;

  if (currency === 'INR') {
    if (options?.compact) {
      if (Math.abs(major) >= 10000000) {
        return `₹${(major / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
      }
      if (Math.abs(major) >= 100000) {
        return `₹${(major / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
      }
      if (Math.abs(major) >= 1000) {
        return `₹${(major / 1000).toFixed(1).replace(/\.0$/, '')}k`;
      }
    }

    // Format with Indian grouping (e.g. 5,00,000)
    const [intPart, decPart] = major.toFixed(options?.hideDecimals ? 0 : 2).split('.');
    const isNegative = intPart.startsWith('-');
    const cleanInt = isNegative ? intPart.slice(1) : intPart;

    let formattedInt = '';
    if (cleanInt.length <= 3) {
      formattedInt = cleanInt;
    } else {
      const lastThree = cleanInt.slice(-3);
      const remaining = cleanInt.slice(0, -3);
      const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedInt = `${withCommas},${lastThree}`;
    }

    const sign = isNegative ? '-' : '';
    const dec = decPart && !options?.hideDecimals && decPart !== '00' ? `.${decPart}` : '';
    return `${sign}₹${formattedInt}${dec}`;
  }

  // Non-INR standard currencies
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const sym = symbolMap[currency] || '$';

  if (options?.compact) {
    if (Math.abs(major) >= 1000000) {
      return `${sym}${(major / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(major) >= 1000) {
      return `${sym}${(major / 1000).toFixed(1)}k`;
    }
  }

  return `${sym}${major.toLocaleString(undefined, {
    minimumFractionDigits: options?.hideDecimals ? 0 : 2,
    maximumFractionDigits: options?.hideDecimals ? 0 : 2,
  })}`;
}

export function parseCurrencyInputToMinor(inputStr: string): number {
  if (!inputStr) return 0;
  // Remove currency symbols, spaces, commas
  const clean = inputStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function getDaysRemaining(eventDate: string): {
  days: number;
  label: string;
  isPast: boolean;
  isToday: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, label: 'Today', isPast: false, isToday: true };
  } else if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)}d ago`, isPast: true, isToday: false };
  } else {
    return { days: diffDays, label: `${diffDays} days left`, isPast: false, isToday: false };
  }
}
