import type {
  LoadStatus,
  ModalState,
  SeverityFilter,
} from '@/types/dashboard/client';
import type { DashboardData } from '@/types/dashboard/dashboard';
import { signal } from '@preact/signals';

export const data = signal<DashboardData | null>(null);
export const status = signal<LoadStatus>('loading');
export const live = signal(false);
export const query = signal('');
export const severityFilter = signal<SeverityFilter>('All');
export const modal = signal<ModalState | null>(null);

export const useData = (): DashboardData => {
  const current = data.value;
  if (!current) throw new Error('Dashboard data read before it was ready');
  return current;
};
