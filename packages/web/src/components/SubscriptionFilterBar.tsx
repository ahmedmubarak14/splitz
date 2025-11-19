import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FilterOptions } from "@/lib/subscriptionFilters";

interface SubscriptionFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  advancedFilters?: FilterOptions;
  onAdvancedFiltersChange?: (filters: FilterOptions) => void;
  activeFilterCount?: number;
}

export const SubscriptionFilterBar = ({
  searchQuery,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  advancedFilters = {},
  onAdvancedFiltersChange,
  activeFilterCount = 0,
}: SubscriptionFilterBarProps) => {
  const clearSearch = () => onSearchChange("");

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <Select value={filterCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="entertainment">Entertainment</SelectItem>
          <SelectItem value="productivity">Productivity</SelectItem>
          <SelectItem value="health">Health & Fitness</SelectItem>
          <SelectItem value="education">Education</SelectItem>
          <SelectItem value="shopping">Shopping</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="renewal_date">Renewal Date</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="amount">Amount</SelectItem>
          <SelectItem value="category">Category</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>

      {/* Advanced Filters */}
      {onAdvancedFiltersChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 px-1.5 min-w-5 h-5"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Advanced Filters</h4>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={advancedFilters.status || 'all'}
                  onValueChange={(value) =>
                    onAdvancedFiltersChange({
                      ...advancedFilters,
                      status: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={advancedFilters.minAmount || ''}
                    onChange={(e) =>
                      onAdvancedFiltersChange({
                        ...advancedFilters,
                        minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={advancedFilters.maxAmount || ''}
                    onChange={(e) =>
                      onAdvancedFiltersChange({
                        ...advancedFilters,
                        maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Usage Frequency */}
              <div className="space-y-2">
                <Label>Usage</Label>
                <Select
                  value={advancedFilters.usageFrequency || 'all'}
                  onValueChange={(value) =>
                    onAdvancedFiltersChange({
                      ...advancedFilters,
                      usageFrequency: value === 'all' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Usage</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onAdvancedFiltersChange({})}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};