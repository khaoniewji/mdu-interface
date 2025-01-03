// src/components/downloads/downloadlists.tsx
import { DownloadItem } from './download';

export interface FilterOptions {
  status?: ('queued' | 'downloading' | 'paused' | 'completed' | 'error' | 'canceled')[];
  type?: 'video' | 'audio' | 'all';
  date?: 'today' | 'week' | 'month' | 'all';
}

interface DownloadsListProps {
  downloads: DownloadItem[];
  searchQuery: string;
  filters?: FilterOptions;
  onStopDownload: (videoId: string) => void;
}

function DownloadsList({ downloads, searchQuery, filters, onStopDownload }: DownloadsListProps) {
  const filteredDownloads = downloads.filter(download => {
    // Text search
    const matchesSearch = download.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Status filter
    if (filters?.status && filters.status.length > 0) {
      if (!filters.status.includes(download.status)) return false;
    }

    // Type filter
    if (filters?.type && filters.type !== 'all') {
      if (filters.type === 'audio' && !download.isAudioOnly) return false;
      if (filters.type === 'video' && download.isAudioOnly) return false;
    }

    // Date filter
    if (filters?.date && filters.date !== 'all') {
      const downloadDate = download.completedAt ? new Date(download.completedAt) : new Date();
      const now = new Date();
      const diffDays = (now.getTime() - downloadDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (filters.date) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }

    return true;
  });

  return (
    <div className="space-y-2">
      {filteredDownloads.map((download) => (
        <div
          key={download.videoId}
          className="bg-[#1a1a1a] rounded-md p-3 text-xs text-gray-300"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">{download.title}</span>
            <span className="text-gray-400">{download.fileSize}</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-[#2e2e2e] rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${download.progress}%` }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-gray-400">
              {download.speed} - {download.eta}
            </span>
            {download.status === 'downloading' && (
              <button
                onClick={() => onStopDownload(download.videoId)}
                className="text-red-400 hover:text-red-300"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DownloadsList;