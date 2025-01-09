// src/hooks/useDownloadHistory.ts
import { useLocalStorageArray } from './uselocalstorage';
import type { DownloadItem } from '@/components/downloads/download';

interface DownloadHistoryItem extends DownloadItem {
  timestamp: number;
}

export function useDownloadHistory(maxItems: number = 1000) {
  const [history, { add: addToStorage, clear }] = useLocalStorageArray<DownloadHistoryItem>(
    'download-history',
    []
  );

  const addToHistory = (download: DownloadItem) => {
    const historyItem: DownloadHistoryItem = {
      ...download,
      timestamp: Date.now(),
    };

    addToStorage((current: any[]) => {
      const filtered = current.filter((item: { videoId: string; }) => item.videoId !== download.videoId);
      const newHistory = [historyItem, ...filtered];
      return newHistory.slice(0, maxItems);
    });
  };

  const getHistory = (filters?: {
    status?: string[];
    search?: string;
    dateRange?: { start: number; end: number };
  }) => {
    let filtered = [...history];

    if (filters?.status?.length) {
      filtered = filtered.filter((item) => filters.status!.includes(item.status));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.fileName.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.url.toLowerCase().includes(search)
      );
    }

    if (filters?.dateRange) {
      filtered = filtered.filter(
        (item) =>
          item.timestamp >= filters.dateRange!.start &&
          item.timestamp <= filters.dateRange!.end
      );
    }

    return filtered;
  };

  const clearHistory = () => {
    clear();
  };

  return {
    history,
    addToHistory,
    getHistory,
    clearHistory,
  };
}