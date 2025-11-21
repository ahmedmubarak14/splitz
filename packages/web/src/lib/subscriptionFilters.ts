import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

export type SortOption = 'renewal_date' | 'name' | 'amount' | 'category' | 'status';

export interface FilterOptions {
  category?: string;
  searchQuery?: string;
  status?: 'active' | 'trial' | 'paused' | 'canceled' | 'all';
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  usageFrequency?: string;
}

export const filterSubscriptions = (subscriptions: any[], options: FilterOptions) => {
  return subscriptions.filter((sub) => {
    // Category filter
    if (options.category && options.category !== 'all' && sub.category !== options.category) {
      return false;
    }

    // Search query filter
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      const matchesName = sub.name?.toLowerCase().includes(query);
      const matchesCategory = sub.category?.toLowerCase().includes(query);
      const matchesTags = sub.tags?.some((tag: string) => tag.toLowerCase().includes(query));
      
      if (!matchesName && !matchesCategory && !matchesTags) {
        return false;
      }
    }

    // Status filter
    if (options.status && options.status !== 'all') {
      if (options.status === 'trial') {
        if (!sub.trial_ends_at || new Date(sub.trial_ends_at) < new Date()) {
          return false;
        }
      } else if (sub.status !== options.status) {
        return false;
      }
    }

    // Amount filter
    if (options.minAmount !== undefined && sub.amount < options.minAmount) {
      return false;
    }
    if (options.maxAmount !== undefined && sub.amount > options.maxAmount) {
      return false;
    }

    // Date range filter
    if (options.startDate && sub.next_renewal_date) {
      const renewalDate = new Date(sub.next_renewal_date);
      if (isBefore(renewalDate, startOfDay(options.startDate))) {
        return false;
      }
    }
    if (options.endDate && sub.next_renewal_date) {
      const renewalDate = new Date(sub.next_renewal_date);
      if (isAfter(renewalDate, endOfDay(options.endDate))) {
        return false;
      }
    }

    // Tags filter
    if (options.tags && options.tags.length > 0) {
      const hasMatchingTag = options.tags.some(tag => 
        sub.tags?.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Usage frequency filter
    if (options.usageFrequency && sub.usage_frequency !== options.usageFrequency) {
      return false;
    }

    return true;
  });
};

export const sortSubscriptions = (subscriptions: any[], sortBy: SortOption, ascending: boolean = true) => {
  const sorted = [...subscriptions].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'renewal_date':
        aValue = a.next_renewal_date ? new Date(a.next_renewal_date).getTime() : 0;
        bValue = b.next_renewal_date ? new Date(b.next_renewal_date).getTime() : 0;
        break;
      
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      
      case 'amount':
        aValue = a.amount || 0;
        bValue = b.amount || 0;
        break;
      
      case 'category':
        aValue = a.category?.toLowerCase() || '';
        bValue = b.category?.toLowerCase() || '';
        break;
      
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      
      default:
        return 0;
    }

    if (aValue < bValue) return ascending ? -1 : 1;
    if (aValue > bValue) return ascending ? 1 : -1;
    return 0;
  });

  return sorted;
};

export const calculateRenewalStats = (subscriptions: any[]) => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);

  return {
    dueThisWeek: subscriptions.filter(sub => {
      if (!sub.next_renewal_date) return false;
      const renewalDate = new Date(sub.next_renewal_date);
      return renewalDate >= today && renewalDate <= nextWeek;
    }).length,
    dueThisMonth: subscriptions.filter(sub => {
      if (!sub.next_renewal_date) return false;
      const renewalDate = new Date(sub.next_renewal_date);
      return renewalDate >= today && renewalDate <= nextMonth;
    }).length,
    overdue: subscriptions.filter(sub => {
      if (!sub.next_renewal_date) return false;
      return new Date(sub.next_renewal_date) < today;
    }).length,
  };
};

export const groupByCategory = (subscriptions: any[]) => {
  return subscriptions.reduce((groups: any, sub) => {
    const category = sub.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(sub);
    return groups;
  }, {});
};

export const calculateCategoryTotals = (subscriptions: any[]) => {
  const grouped = groupByCategory(subscriptions);
  return Object.entries(grouped).map(([category, subs]: [string, any]) => ({
    category,
    count: subs.length,
    total: subs.reduce((sum: number, sub: any) => sum + (sub.amount || 0), 0),
    subscriptions: subs,
  }));
};