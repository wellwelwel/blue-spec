import type { DashboardData } from '@/types/dashboard/dashboard';
import { useEffect } from 'preact/hooks';
import { data, live, status } from '../../data/state';

const fetchData = async (): Promise<DashboardData> => {
  const response = await fetch('/api/data', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export const useDashboardData = (): void => {
  useEffect(() => {
    const refresh = () => {
      fetchData()
        .then((next) => {
          data.value = next;
          status.value = 'ready';
        })
        .catch(() => {
          if (!data.value) status.value = 'error';
        });
    };

    refresh();

    const source = new EventSource('/events');
    source.onopen = () => (live.value = true);
    source.onmessage = () => refresh();
    source.onerror = () => (live.value = false);

    return () => source.close();
  }, []);
};
