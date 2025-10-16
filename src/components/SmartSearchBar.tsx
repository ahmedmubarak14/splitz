import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type SearchFilter = {
  type: 'all' | 'tasks' | 'habits' | 'expenses' | 'challenges' | 'trips';
  status?: 'active' | 'completed' | 'pending';
  priority?: 'high' | 'medium' | 'low';
  dateRange?: 'today' | 'week' | 'month' | 'all';
};

interface SmartSearchBarProps {
  onSearch: (query: string, filters: SearchFilter) => void;
  placeholder?: string;
}

export function SmartSearchBar({ onSearch, placeholder }: SmartSearchBarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({ type: 'all' });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    onSearch(newQuery, filters);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onSearch(query, updatedFilters);
  };

  const clearFilters = () => {
    const resetFilters: SearchFilter = { type: 'all' };
    setFilters(resetFilters);
    onSearch(query, resetFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => key !== 'type' && filters[key as keyof SearchFilter]
  ).length;

  const typeOptions = [
    { value: 'all', label: t('search.all') || 'All', emoji: '🔍' },
    { value: 'tasks', label: t('nav.tasks') || 'Tasks', emoji: '✅' },
    { value: 'habits', label: t('nav.habits') || 'Habits', emoji: '🔥' },
    { value: 'expenses', label: t('nav.expenses'), emoji: '💰' },
    { value: 'challenges', label: t('nav.challenges'), emoji: '🏆' },
    { value: 'trips', label: t('nav.trips') || 'Trips', emoji: '✈️' },
  ];

  if (!isExpanded && isMobile) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        {placeholder || t('search.searchEverything') || 'Search everything...'}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder || t('search.searchEverything') || 'Search everything...'}
          className="pl-10 pr-20"
          autoFocus={isMobile && isExpanded}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <Filter className="w-3 h-3" />
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>{t('search.filters') || 'Filters'}</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Type Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('search.type') || 'Type'}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.type === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange({ type: option.value as any })}
                        className="justify-start"
                      >
                        <span className="mr-2">{option.emoji}</span>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('search.status') || 'Status'}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['active', 'completed', 'pending'].map((status) => (
                      <Badge
                        key={status}
                        variant={filters.status === status ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() =>
                          handleFilterChange({
                            status: filters.status === status ? undefined : status as any,
                          })
                        }
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">{t('search.dateRange') || 'Date Range'}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['today', 'week', 'month', 'all'].map((range) => (
                      <Badge
                        key={range}
                        variant={filters.dateRange === range ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() =>
                          handleFilterChange({
                            dateRange: filters.dateRange === range ? undefined : range as any,
                          })
                        }
                      >
                        {range}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    {t('search.clearFilters') || 'Clear Filters'}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {isMobile && isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setQuery('');
                clearFilters();
              }}
              className="h-7"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {(filters.type !== 'all' || activeFiltersCount > 0) && (
        <div className="flex gap-2 flex-wrap">
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {typeOptions.find((t) => t.value === filters.type)?.emoji}
              {typeOptions.find((t) => t.value === filters.type)?.label}
              <button
                onClick={() => handleFilterChange({ type: 'all' })}
                className="ml-1 hover:bg-background/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {filters.status}
              <button
                onClick={() => handleFilterChange({ status: undefined })}
                className="ml-1 hover:bg-background/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {filters.dateRange}
              <button
                onClick={() => handleFilterChange({ dateRange: undefined })}
                className="ml-1 hover:bg-background/20 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
