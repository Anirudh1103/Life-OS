export type ThemeMode = 'light' | 'dark' | 'system';

export type Role = 'admin' | 'user';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export type ToastVariant = 'default' | 'success' | 'danger' | 'warning';
