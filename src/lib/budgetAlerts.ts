import { EventFull, BudgetItem } from '../types';
import { formatMinorToCurrency } from './formatters';

export interface BudgetOverrunCheckResult {
  isOverrun: boolean; // true if exceeds category budget by > 10%
  overrunPercentage: number;
  targetMinor: number;
  currentActualMinor: number;
  newTotalMinor: number;
  overrunMinor: number;
  categoryName: string;
  matchedAllocationCategory: string;
  title: string;
  description: string;
  severity: 'none' | 'warning' | 'critical'; // critical if > 25% overrun
}

/**
 * Normalizes vendor or expense category names to match budget category allocations
 * e.g., "Catering" -> "Catering & Dining", "Photography" -> "Photography & Film"
 */
export function findMatchingBudgetAllocation(
  category: string,
  event: EventFull
) {
  const norm = category.toLowerCase().trim();
  const allocations = event.budgetAllocations || [];

  // 1. Direct match
  const direct = allocations.find(
    (a) => a.category.toLowerCase().trim() === norm
  );
  if (direct) return direct;

  // 2. Substring match
  const substring = allocations.find((a) => {
    const aNorm = a.category.toLowerCase();
    return aNorm.includes(norm) || norm.includes(aNorm);
  });
  if (substring) return substring;

  // 3. Fallback to first allocation
  return allocations[0] || null;
}

/**
 * Evaluates whether adding or modifying an expense or vendor cost exceeds the
 * allocated category budget by more than 10%.
 *
 * @param category The category name of the expense or vendor (e.g. "Catering & Dining")
 * @param proposedAmountMinor Proposed integer minor units (e.g. 5000000 = ₹50,000)
 * @param event The full event state
 * @param excludeItemId Optional ID of an existing item being updated
 */
export function checkCategoryBudgetOverrun(
  category: string,
  proposedAmountMinor: number,
  event: EventFull,
  excludeItemId?: string
): BudgetOverrunCheckResult {
  const allocation = findMatchingBudgetAllocation(category, event);
  const totalBudgetMinor = event.details.totalBudgetMinor || 0;

  if (!allocation || totalBudgetMinor <= 0) {
    return {
      isOverrun: false,
      overrunPercentage: 0,
      targetMinor: 0,
      currentActualMinor: 0,
      newTotalMinor: proposedAmountMinor,
      overrunMinor: 0,
      categoryName: category,
      matchedAllocationCategory: category,
      title: '',
      description: '',
      severity: 'none',
    };
  }

  const targetMinor = Math.round(
    (totalBudgetMinor * allocation.targetPercentage) / 100
  );

  // Sum all other items currently in this allocation category
  const existingItemsInCategory = (event.budgetItems || []).filter((item) => {
    if (excludeItemId && item.id === excludeItemId) return false;
    const itemAlloc = findMatchingBudgetAllocation(item.category, event);
    return itemAlloc?.category === allocation.category;
  });

  const existingOtherActualMinor = existingItemsInCategory.reduce(
    (sum, item) => sum + (item.actualAmountMinor || 0),
    0
  );

  const newTotalMinor = existingOtherActualMinor + proposedAmountMinor;
  const overrunMinor = newTotalMinor - targetMinor;
  const overrunPercentage =
    targetMinor > 0 ? (overrunMinor / targetMinor) * 100 : 0;

  // Trigger when exceeding allocated category budget by MORE THAN 10%
  const isOverrun = overrunPercentage > 10;
  const isCritical = overrunPercentage > 25;

  const currency = event.details.currency || 'INR';
  const formattedTarget = formatMinorToCurrency(targetMinor, currency);
  const formattedNewTotal = formatMinorToCurrency(newTotalMinor, currency);
  const formattedOverrun = formatMinorToCurrency(Math.abs(overrunMinor), currency);

  let title = '';
  let description = '';

  if (isOverrun) {
    title = isCritical
      ? `🚨 Critical Budget Alert: ${allocation.category} (+${overrunPercentage.toFixed(1)}%)`
      : `⚠️ Category Budget Warning: ${allocation.category} (+${overrunPercentage.toFixed(1)}%)`;

    description = `Committed expenses for "${allocation.category}" will reach ${formattedNewTotal}, exceeding the planned target of ${formattedTarget} by ${overrunPercentage.toFixed(1)}% (${formattedOverrun} over allocation).`;
  }

  return {
    isOverrun,
    overrunPercentage,
    targetMinor,
    currentActualMinor: existingOtherActualMinor,
    newTotalMinor,
    overrunMinor,
    categoryName: category,
    matchedAllocationCategory: allocation.category,
    title,
    description,
    severity: isCritical ? 'critical' : isOverrun ? 'warning' : 'none',
  };
}
