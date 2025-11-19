import { add, format, differenceInDays, startOfDay, isValid } from "date-fns";

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * Calculate next renewal date with proper handling of edge cases
 */
export const calculateNextRenewalDate = (
  currentDate: Date | string,
  cycle: BillingCycle,
  customDays?: number
): Date => {
  const current = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  
  if (!isValid(current)) {
    throw new Error('Invalid date provided');
  }

  let nextDate: Date;

  switch (cycle) {
    case 'weekly':
      nextDate = add(current, { weeks: 1 });
      break;
    
    case 'monthly':
      nextDate = add(current, { months: 1 });
      break;
    
    case 'quarterly':
      nextDate = add(current, { months: 3 });
      break;
    
    case 'yearly':
      nextDate = add(current, { years: 1 });
      break;
    
    case 'custom':
      if (!customDays || customDays <= 0) {
        throw new Error('Custom cycle requires valid customDays parameter');
      }
      nextDate = add(current, { days: customDays });
      break;
    
    default:
      nextDate = add(current, { months: 1 });
  }

  return startOfDay(nextDate);
};

/**
 * Calculate days until renewal
 */
export const daysUntilRenewal = (renewalDate: Date | string): number => {
  const renewal = typeof renewalDate === 'string' ? new Date(renewalDate) : renewalDate;
  const today = startOfDay(new Date());
  
  return differenceInDays(renewal, today);
};

/**
 * Get renewal urgency level
 */
export const getRenewalUrgency = (renewalDate: Date | string): {
  level: 'critical' | 'warning' | 'normal' | 'upcoming';
  daysLeft: number;
  message: string;
} => {
  const days = daysUntilRenewal(renewalDate);

  if (days < 0) {
    return {
      level: 'critical',
      daysLeft: days,
      message: 'Overdue',
    };
  } else if (days === 0) {
    return {
      level: 'critical',
      daysLeft: 0,
      message: 'Renews today',
    };
  } else if (days === 1) {
    return {
      level: 'critical',
      daysLeft: 1,
      message: 'Renews tomorrow',
    };
  } else if (days <= 3) {
    return {
      level: 'warning',
      daysLeft: days,
      message: `Renews in ${days} days`,
    };
  } else if (days <= 7) {
    return {
      level: 'warning',
      daysLeft: days,
      message: `Renews in ${days} days`,
    };
  } else if (days <= 30) {
    return {
      level: 'normal',
      daysLeft: days,
      message: `Renews in ${days} days`,
    };
  } else {
    return {
      level: 'upcoming',
      daysLeft: days,
      message: `Renews in ${days} days`,
    };
  }
};

/**
 * Calculate trial urgency
 */
export const getTrialUrgency = (trialEndDate: Date | string): {
  level: 'critical' | 'warning' | 'normal';
  daysLeft: number;
  message: string;
} => {
  const days = daysUntilRenewal(trialEndDate);

  if (days <= 0) {
    return {
      level: 'critical',
      daysLeft: 0,
      message: 'Trial ended',
    };
  } else if (days === 1) {
    return {
      level: 'critical',
      daysLeft: 1,
      message: 'Trial ends tomorrow',
    };
  } else if (days <= 3) {
    return {
      level: 'warning',
      daysLeft: days,
      message: `Trial ends in ${days} days`,
    };
  } else if (days <= 7) {
    return {
      level: 'warning',
      daysLeft: days,
      message: `Trial ends in ${days} days`,
    };
  } else {
    return {
      level: 'normal',
      daysLeft: days,
      message: `Trial ends in ${days} days`,
    };
  }
};

/**
 * Calculate total annual cost
 */
export const calculateAnnualCost = (amount: number, cycle: BillingCycle, customDays?: number): number => {
  switch (cycle) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'yearly':
      return amount;
    case 'custom':
      if (!customDays || customDays <= 0) return amount * 12;
      return (amount * 365) / customDays;
    default:
      return amount * 12;
  }
};

/**
 * Format renewal date in user-friendly way
 */
export const formatRenewalDate = (renewalDate: Date | string): string => {
  const renewal = typeof renewalDate === 'string' ? new Date(renewalDate) : renewalDate;
  const days = daysUntilRenewal(renewal);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days <= 7) return `In ${days} days`;
  
  return format(renewal, 'MMM d, yyyy');
};