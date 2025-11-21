import { toast } from 'sonner';
import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Enhanced toast utilities with icons, colors, and undo functionality
 */

interface ToastOptions {
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

export const toastUtils = {
  /**
   * Success toast with checkmark icon
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      icon: React.createElement(CheckCircle2, { className: "h-5 w-5 text-success" }),
      action: options?.onUndo
        ? {
            label: options.undoLabel || 'Undo',
            onClick: options.onUndo,
          }
        : undefined,
      className: 'toast-success',
    });
  },

  /**
   * Error toast with X icon
   */
  error: (message: string, options?: Omit<ToastOptions, 'onUndo'>) => {
    return toast.error(message, {
      duration: options?.duration || 4000,
      icon: React.createElement(XCircle, { className: "h-5 w-5 text-destructive" }),
      className: 'toast-error',
    });
  },

  /**
   * Warning toast with alert icon
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 3500,
      icon: React.createElement(AlertCircle, { className: "h-5 w-5 text-warning" }),
      action: options?.onUndo
        ? {
            label: options.undoLabel || 'Undo',
            onClick: options.onUndo,
          }
        : undefined,
      className: 'toast-warning',
    });
  },

  /**
   * Info toast with info icon
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: options?.duration || 3000,
      icon: React.createElement(Info, { className: "h-5 w-5 text-info" }),
      className: 'toast-info',
    });
  },

  /**
   * Promise toast for async operations
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  /**
   * Dismissable toast with custom action
   */
  custom: (message: string, action: { label: string; onClick: () => void }) => {
    return toast(message, {
      duration: 5000,
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    });
  },
};

/**
 * Common toast messages for the app
 */
export const commonToasts = {
  // Save operations
  saved: (itemName?: string) =>
    toastUtils.success(`${itemName || 'Changes'} saved successfully`),
  
  saveError: (itemName?: string) =>
    toastUtils.error(`Failed to save ${itemName?.toLowerCase() || 'changes'}`),

  // Delete operations with undo
  deleted: (itemName: string, onUndo?: () => void) =>
    toastUtils.success(`${itemName} deleted`, {
      onUndo,
      undoLabel: 'Undo',
    }),

  deleteError: (itemName: string) =>
    toastUtils.error(`Failed to delete ${itemName.toLowerCase()}`),

  // Create operations
  created: (itemName: string) =>
    toastUtils.success(`${itemName} created successfully`),

  createError: (itemName: string) =>
    toastUtils.error(`Failed to create ${itemName.toLowerCase()}`),

  // Update operations
  updated: (itemName: string) =>
    toastUtils.success(`${itemName} updated successfully`),

  updateError: (itemName: string) =>
    toastUtils.error(`Failed to update ${itemName.toLowerCase()}`),

  // Copy operations
  copied: (itemName?: string) =>
    toastUtils.success(`${itemName || 'Link'} copied to clipboard`),

  // Network errors
  networkError: () =>
    toastUtils.error('Network error. Please check your connection.'),

  // Auth errors
  unauthorized: () =>
    toastUtils.error('You need to be logged in to do that'),

  // Generic
  somethingWrong: () =>
    toastUtils.error('Something went wrong. Please try again.'),
};
