import { useState, useEffect } from 'react';
import {
    Download,
    ListOrdered,
    CheckCircle,
    HardDrive,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { invokeCommand } from '../../lib/webview';

interface DriveInfo {
    name: string;
    mount_point: string;
    total_space: number;
    free_space: number;
    available_space: number;
    drive_type: string;
}

interface NetworkSpeed {
    download: number;
    upload: number;
    timestamp: number;
}

interface SystemStats {
    drives: DriveInfo[];
    network: NetworkSpeed;
    counts: {
        downloads: number;
        queue: number;
        completed: number;
    };
}

function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function calculateUsagePercentage(total: number, available: number): number {
    return Math.round(((total - available) / total) * 100);
}

function Sidebar() {
    const { t } = useTranslation();
    const [drives, setDrives] = useState<DriveInfo[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>({
        download: 0,
        upload: 0,
        timestamp: Date.now()
    });
    const [counts, setCounts] = useState({ downloads: 0, queue: 0, completed: 0 });

    useEffect(() => {
        const initializeStats = async () => {
            try {
                const initialStats = await invokeCommand<SystemStats>('get_system_stats');
                updateStats(initialStats);
                setIsInitialLoad(false);
            } catch (error) {
                console.error('Failed to load initial stats:', error);
                setError(t('sidebar.drives.error.loading'));
                setIsInitialLoad(false);
            }
        };

        initializeStats();
        setupSystemStatsListener();

        return () => {
            cleanup();
        };
    }, []);

    const updateStats = (stats: SystemStats) => {
        if (stats.drives.length > 0) {
            setDrives(prevDrives => stats.drives.length > 0 ? stats.drives : prevDrives);
        }
        setNetworkSpeed(stats.network);
        setCounts(stats.counts);
        setError(null);
    };

    const setupSystemStatsListener = async () => {
        try {
            return await invokeCommand<() => void>('subscribe_to_system_stats', {
                onUpdate: (stats: SystemStats) => {
                    updateStats(stats);
                },
                onError: (errorMessage: string) => {
                    if (drives.length === 0) {
                        setError(errorMessage);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to setup system stats listener:', error);
        }
    };

    const cleanup = () => {
        invokeCommand('unsubscribe_from_system_stats').catch(console.error);
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            const stats = await invokeCommand<SystemStats>('get_system_stats');
            updateStats(stats);
        } catch (error) {
            console.error('Failed to refresh stats:', error);
            if (drives.length === 0) {
                setError(t('sidebar.drives.error.loading'));
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="w-64 h-full border-r bg-background border-border">
            <div className="flex-1 space-y-6 p-4">
                {/* Categories Section */}
                <div className="space-y-1">
                    <div className="px-2 py-1.5">
                        <h2 className="text-xs font-medium text-muted-foreground">
                            {t('sidebar.categories.title')}
                        </h2>
                    </div>
                    <nav className="space-y-1">
                        {[
                            { icon: Download, label: 'downloads', count: counts.downloads },
                            { icon: ListOrdered, label: 'queue', count: counts.queue },
                            { icon: CheckCircle, label: 'completed', count: counts.completed }
                        ].map(({ icon: Icon, label, count }) => (
                            <button
                                key={label}
                                className="w-full flex items-center px-2 py-1.5 text-sm text-foreground/70 hover:bg-accent hover:text-accent-foreground rounded-md group transition-colors"
                            >
                                <div className="flex items-center flex-1">
                                    <Icon className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground" />
                                    <span>{t(`sidebar.categories.${label}`)}</span>
                                </div>
                                {count > 0 && (
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Drive Status Section */}
                <div className="space-y-2">
                    <div className="px-2 flex items-center justify-between">
                        <h2 className="text-xs font-medium text-muted-foreground">
                            {t('sidebar.drives.title')}
                        </h2>
                        <button
                            onClick={handleRefresh}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {error && drives.length === 0 && (
                        <div className="mx-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-xs text-destructive flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-2" />
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 px-2">
                        {isInitialLoad ? (
                            <div className="text-sm text-muted-foreground animate-pulse">
                                {t('sidebar.drives.loading')}
                            </div>
                        ) : (
                            drives.map((drive, index) => (
                                <div key={`${drive.name}-${index}`} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-sm text-foreground">
                                                {drive.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {calculateUsagePercentage(drive.total_space, drive.available_space)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{
                                                width: `${calculateUsagePercentage(drive.total_space, drive.available_space)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{formatBytes(drive.available_space)} free</span>
                                        <span>{formatBytes(drive.total_space)} total</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Network Status Section */}
                <div className="space-y-1">
                    <div className="px-2 py-1.5">
                        <h2 className="text-xs font-medium text-muted-foreground">
                            {t('sidebar.network.title')}
                        </h2>
                    </div>
                    <div className="px-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-2 text-foreground">
                                <span>↓</span>
                                <span className="tabular-nums text-xs">
                                    {networkSpeed.download.toFixed(1)} MB/s
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-foreground">
                                <span>↑</span>
                                <span className="tabular-nums text-xs">
                                    {networkSpeed.upload.toFixed(1)} MB/s
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;