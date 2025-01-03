// src/components/windowed/statusbar.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invokeCommand } from '../../lib/webview';

interface SystemStatus {
    cpu_usage: number;
    memory_usage: number;
    os_info: string;
    cpu_info: string;
    app_version: string;
}

interface StatusMessage {
    type: 'info' | 'warning' | 'error';
    text: string;
    timestamp: number;
}

function StatusBar() {
    const { t } = useTranslation();
    const [systemInfo, setSystemInfo] = useState<SystemStatus | null>(null);
    const [status, setStatus] = useState<StatusMessage>({
        type: 'info',
        text: t('status.ready'),
        timestamp: Date.now()
    });

    useEffect(() => {
        loadSystemInfo();
        const unsubscribePromise = setupStatusListener();
        const updateInterval = setInterval(updateSystemStats, 1000);

        return () => {
            clearInterval(updateInterval);
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, [t]);

    const loadSystemInfo = async () => {
        try {
            const info = await invokeCommand<SystemStatus>('get_system_info');
            setSystemInfo(info);
        } catch (error) {
            console.error('Failed to load system info:', error);
            setStatus({
                type: 'error',
                text: t('status.error.loading'),
                timestamp: Date.now()
            });
        }
    };

    const updateSystemStats = async () => {
        try {
            const updates = await invokeCommand<SystemStatus>('get_status_updates');
            setSystemInfo(prev => prev ? {
                ...prev,
                cpu_usage: updates.cpu_usage,
                memory_usage: updates.memory_usage,
            } : null);
        } catch (error) {
            console.error('Failed to update system status:', error);
        }
    };

    const setupStatusListener = async () => {
        try {
            return await invokeCommand<() => void>('subscribe_to_status', {
                onStatusChange: (message: StatusMessage) => {
                    setStatus(message);
                    
                    // Clear info messages after 5 seconds
                    if (message.type === 'info') {
                        setTimeout(() => {
                            setStatus({
                                type: 'info',
                                text: t('status.ready'),
                                timestamp: Date.now()
                            });
                        }, 5000);
                    }
                },
                onSystemUpdate: (info: Partial<SystemStatus>) => {
                    setSystemInfo(prev => prev ? { ...prev, ...info } : null);
                }
            });
        } catch (error) {
            console.error('Failed to setup status listener:', error);
        }
    };

    const getStatusColor = (type: StatusMessage['type']): string => {
        switch (type) {
            case 'error':
                return 'text-red-400';
            case 'warning':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const getResourceColor = (usage: number): string => {
        if (usage > 90) return 'text-red-400';
        if (usage > 70) return 'text-yellow-400';
        return 'text-gray-400';
    };

    return (
        <div className="h-6 bg-[#1a1a1a] border-t border-[#2e2e2e] px-2 flex items-center justify-between">
            <span className={`text-xs ${getStatusColor(status.type)}`}>
                {status.text}
            </span>
            {systemInfo && (
                <div className="flex items-center space-x-4 text-xs">
                    <span className="text-gray-400" title={t('status.app_version_tooltip')}>
                        {t('status.app_version')}: {systemInfo.app_version}
                    </span>
                    <span className="text-gray-400" title={t('status.os_tooltip')}>
                        {t('status.os')}: {systemInfo.os_info}
                    </span>
                    <span 
                        className={getResourceColor(systemInfo.cpu_usage)}
                        title={t('status.cpu_tooltip')}
                    >
                        {t('status.cpu')}: {systemInfo.cpu_usage.toFixed(1)}%
                    </span>
                    <span 
                        className={getResourceColor(systemInfo.memory_usage)}
                        title={t('status.memory_tooltip')}
                    >
                        {t('status.memory')}: {systemInfo.memory_usage.toFixed(1)}%
                    </span>
                    <span 
                        className="text-gray-400"
                        title={t('status.cpu_info_tooltip')}
                    >
                        {systemInfo.cpu_info}
                    </span>
                </div>
            )}
        </div>
    );
}

export default StatusBar;