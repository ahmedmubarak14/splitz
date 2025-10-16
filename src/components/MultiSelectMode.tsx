import { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface MultiSelectModeProps<T> {
  items: T[];
  renderItem: (item: T, isSelected: boolean, onToggle: () => void) => React.ReactNode;
  onDelete?: (items: T[]) => void;
  onComplete?: (items: T[]) => void;
  onCancel?: () => void;
  getItemId: (item: T) => string;
  className?: string;
}

export function MultiSelectMode<T>({
  items,
  renderItem,
  onDelete,
  onComplete,
  onCancel,
  getItemId,
  className,
}: MultiSelectModeProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  };

  const handleDelete = () => {
    const selectedItems = items.filter((item) => selectedIds.has(getItemId(item)));
    onDelete?.(selectedItems);
    setSelectedIds(new Set());
    setShowDeleteDialog(false);
  };

  const handleComplete = () => {
    const selectedItems = items.filter((item) => selectedIds.has(getItemId(item)));
    onComplete?.(selectedItems);
    setSelectedIds(new Set());
  };

  const handleCancel = () => {
    setSelectedIds(new Set());
    onCancel?.();
  };

  const selectedCount = selectedIds.size;
  const allSelected = selectedIds.size === items.length && items.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selection Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3 animate-slide-in-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : 'Select All'}
            </span>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2 animate-fade-in">
              {onComplete && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleComplete}
                  className="gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete ({selectedCount})
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedCount})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="gap-1"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 stagger-children">
        {items.map((item) => {
          const id = getItemId(item);
          const isSelected = selectedIds.has(id);
          return renderItem(item, isSelected, () => toggleItem(id));
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
