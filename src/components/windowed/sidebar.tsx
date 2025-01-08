import { useState, useEffect } from 'react';
import {
    Download,
    ListOrdered,
    CheckCircle,
    HardDrive,
    Network,
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
            setDrives(prevDrives => {
                // Only update if we have new valid data
                return stats.drives.length > 0 ? stats.drives : prevDrives;
            });
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
                    // Only show error if we have no drives data
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
            // Only show error if we have no drives data
            if (drives.length === 0) {
                setError(t('sidebar.drives.error.loading'));
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex-1 space-y-6 p-4">
                {/* Categories Section */}
                <div className="space-y-0">
                    <div className="px-2 py-1.5">
                        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('sidebar.categories.title')}
                        </h2>
                    </div>
                    <nav className="space-y-0.5">
                        {[
                            { icon: Download, label: 'downloads', count: counts.downloads },
                            { icon: ListOrdered, label: 'queue', count: counts.queue },
                            { icon: CheckCircle, label: 'completed', count: counts.completed }
                        ].map(({ icon: Icon, label, count }) => (
                            <button
                                key={label}
                                className="w-full flex items-center px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md group transition-colors dark:text-gray-300 dark:hover:bg-zinc-900"
                            >
                                <div className="flex items-center">
                                    <Icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                                    <span className="flex-1">{t(`sidebar.categories.${label}`)}</span>
                                </div>
                                {count > 0 && (
                                    <span className="text-xs text-gray-400 tabular-nums">
                                        {count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Drive Status Section */}
                <div className="space-y-1">
                    <div className="px-2 flex items-center justify-between">
                        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('sidebar.drives.title')}
                        </h2>
                        <button
                            onClick={handleRefresh}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors dark:hover:bg-zinc-900 dark:hover:text-gray-200"
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {error && drives.length === 0 && (
                        <div className="mx-2 p-2 bg-red-50 border border-red-100 rounded-md dark:bg-red-900/10 dark:border-red-900/20">
                            <p className="text-xs text-red-600 flex items-center dark:text-red-400">
                                <AlertCircle className="w-3.5 h-3.5 mr-2" />
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="space-y-1 px-2">
                        {isInitialLoad ? (
                            <div className="text-sm text-gray-400 animate-pulse">
                                {t('sidebar.drives.loading')}
                            </div>
                        ) : (
                            drives.map((drive, index) => (
                                <div key={`${drive.name}-${index}`} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {drive.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 tabular-nums">
                                            {calculateUsagePercentage(drive.total_space, drive.available_space)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden dark:bg-zinc-800">
                                        <div
                                            className="h-full bg-gray-700 rounded-full transition-all duration-300 dark:bg-gray-400"
                                            style={{
                                                width: `${calculateUsagePercentage(drive.total_space, drive.available_space)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>{formatBytes(drive.available_space)} free</span>
                                        <span>{formatBytes(drive.total_space)} total</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Network Status Section remains unchanged */}
                <div className="space-y-0">
                    <div className="px-2 py-1.5">
                        <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('sidebar.network.title')}
                        </h2>
                    </div>
                    <div className=" px-2">
                        {/* <div className="flex items-center space-x-2 ">
                            <Network className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {t('sidebar.network.speed')}
                            </span>
                        </div> */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                                <span>↓</span>
                                <span className="tabular-nums text-xs">
                                    {networkSpeed.download.toFixed(1)} MB/s
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
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