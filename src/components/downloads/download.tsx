// src/components/downloads/download.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  StopCircle,
  Trash2,
  Plus,
  Search,
  MoreVertical,
  Filter,
  FolderOpen,
  Settings,
  RefreshCw
} from "lucide-react";
import { invokeCommand } from '@/lib/webview';
import { useDownloadHistory } from '@/hooks/downloadhistory';
import DownloadsList from "./downloadlists";
import AddDownload from "./adddownload";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DownloadPng from "@/assets/downloader.png";
import { VideoFormat} from '@/types/video';
export interface DownloadItem {
  id: string;
  fileName: string;
  fileSize: string;
  progress: number;
  status: DownloadStatus;
  speed: string;
  eta: string;
  error?: string;
  title: string;
  url: string;
  completedAt?: string;
  elapsedTime: string;
  videoId: string;
  outputPath: string;
  isAudioOnly: boolean;
  thumbnail?: string;
  format: {
    id: string;
    ext: string;
    quality: string;
    resolution?: string;
    filesize?: number;
    vcodec?: string;
    acodec?: string;
  };
}
export interface DownloadOptions {
  outputPath?: string;
  isAudioOnly?: boolean;
  filename?: string;
  audioQuality: string;
  videoQuality: string;
  format: string;
}

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'canceled';

interface DownloadUpdate extends DownloadItem {
  type: 'progress' | 'complete' | 'error';
}

interface FilterOptions {
  status?: DownloadStatus[];
  type?: 'video' | 'audio' | 'all';
  date?: 'today' | 'week' | 'month' | 'all';
}

export function Downloads() {
  const { t } = useTranslation();
  const { history, addToHistory, getHistory, clearHistory } = useDownloadHistory();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeDownloads, setActiveDownloads] = useState<DownloadItem[]>([]);
  const [downloadData, setDownloadData] = useState<DownloadItem[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters] = useState<FilterOptions>({
    status: undefined,
    type: 'all',
    date: 'all',
  });

  // Initial load and setup
  useEffect(() => {
    loadDownloadHistory();
    const unsubscribePromise = setupDownloadListener();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  // Set up real-time download updates
  const setupDownloadListener = async () => {
    try {
      return await invokeCommand<() => void>("subscribe_to_downloads", {
        onProgress: (update: DownloadUpdate) => {
          handleDownloadUpdate(update);
        },
      });
    } catch (error) {
      console.error("Failed to setup download listener:", error);
    }
  };

  // Handle download status updates
  const handleDownloadUpdate = useCallback((update: DownloadUpdate) => {
    switch (update.type) {
      case 'progress':
        setActiveDownloads(prev => {
          const index = prev.findIndex(item => item.videoId === update.videoId);
          if (index === -1) {
            return [...prev, update];
          }
          const newDownloads = [...prev];
          newDownloads[index] = update;
          return newDownloads;
        });
        break;

      case 'complete':
      case 'error':
        addToHistory(update);
        setActiveDownloads(prev =>
          prev.filter(item => item.videoId !== update.videoId)
        );
        setDownloadData(prev => [update, ...prev]);
        break;
    }
  }, [addToHistory]);

  // Load download history
  const loadDownloadHistory = async () => {
    setIsLoading(true);
    try {
      const serverHistory = await invokeCommand<DownloadItem[]>("get_download_history");

      // Merge with local history
      const active = serverHistory.filter(item => item.status === 'downloading');
      const completed = getHistory({
        status: ['completed', 'error', 'canceled']
      });

      setActiveDownloads(active);
      setDownloadData(completed);
    } catch (error) {
      console.error("Failed to load download history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh download history
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadDownloadHistory();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter downloads based on search and filters
  const filteredDownloads = useMemo(() => {
    return getHistory({
      search: searchQuery,
      status: filters.status,
      dateRange: filters.date === 'today'
        ? {
          start: Date.now() - 24 * 60 * 60 * 1000,
          end: Date.now()
        }
        : undefined
    });
  }, [searchQuery, filters, history, getHistory]);

  // Start a new download
  const handleAddDownload = async (url: string, format: VideoFormat, options: DownloadOptions) => {
    try {
      const downloadDir = options?.outputPath || await invokeCommand<string>("get_downloads_dir");

      await invokeCommand("start_download", {
        url,
        formatId: format.url, // Use format.url instead of formatId
        options: {
          outputPath: downloadDir,
          isAudioOnly: options?.isAudioOnly ?? format.type === 'audio',
          filename: options?.filename,
        }
      });

      setShowDownloadModal(false);
    } catch (error) {
      console.error("Failed to start download:", error);
      throw error;
    }
  };

  // Stop a specific download or all downloads
  const handleStopDownload = async (videoId: string) => {
    try {
      await invokeCommand("stop_download", { videoId });
      if (videoId === "all") {
        setActiveDownloads([]);
      } else {
        setActiveDownloads(prev => prev.filter(d => d.videoId !== videoId));
      }
    } catch (error) {
      console.error("Failed to stop download:", error);
    }
  };

  // Clear download history
  const handleClearHistory = async () => {
    try {
      await invokeCommand("clear_download_history");
      clearHistory();
      setDownloadData([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  // Stop all active downloads
  const handleStopAll = async () => {
    try {
      await handleStopDownload("all");
      setShowStopConfirm(false);
    } catch (error) {
      console.error("Failed to stop all downloads:", error);
    }
  };
  // Open downloads folder
  const handleOpenFolder = async () => {
    try {
      await invokeCommand("open_downloads_folder");
    } catch (error) {
      console.error("Failed to open downloads folder:", error);
    }
  };

  // Apply filters
  // const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     ...newFilters
  //   }));
  // };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('downloads.title')}
            </h1>
            {activeDownloads.length > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {activeDownloads.length} {t('downloads.status.active')}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn(
                      "h-4 w-4",
                      isRefreshing && "animate-spin"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('downloads.actions.refresh')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDownloadModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('downloads.actions.addDownload')}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenFolder}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t('downloads.actions.openFolder')}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={activeDownloads.length === 0}
                  onClick={() => setShowStopConfirm(true)}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  {t('downloads.actions.stopAll')}
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={downloadData.length === 0}
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('downloads.actions.clearHistory')}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('downloads.actions.settings')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('downloads.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // Implement filter dialog/popover
            }}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : activeDownloads.length === 0 && downloadData.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-center p-4">
            {/* <Download className="h-12 w-12 text-muted-foreground mb-4" /> */}
            <img src={DownloadPng} alt="Download" className="h-64 -mb-10 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {t('downloads.status.noDownloads')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('downloads.status.noDownloadsDesc')}
            </p>
            <Button onClick={() => setShowDownloadModal(true)}>
              {t('downloads.actions.addFirst')}
            </Button>
          </div>
        ) : (
          <div className="p-4">
            <DownloadsList
              downloads={[...activeDownloads, ...filteredDownloads]}
              searchQuery={searchQuery}
              filters={filters}
              onStopDownload={handleStopDownload}
            />
          </div>
        )}
      </ScrollArea>

      {/* Modals */}
      <AddDownload
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onAddDownload={handleAddDownload}
      />

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('downloads.confirmations.clearHistoryTitle')}</DialogTitle>
            <DialogDescription>
              {t('downloads.confirmations.clearHistoryDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
            >
              {t('downloads.actions.clearHistory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('downloads.confirmations.stopAllTitle')}</DialogTitle>
            <DialogDescription>
              {t('downloads.confirmations.stopAllDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopAll}
            >
              {t('downloads.actions.stopAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Downloads;
