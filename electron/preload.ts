// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Define channel types for better type safety
type IpcChannel = 
    | 'dialog:open'
    | 'app:getDocumentDir'
    | 'command:execute'
    | 'command:abort'
    | 'media:getInfo'
    | 'window:minimize'
    | 'window:maximize'
    | 'window:close'
    | 'window:isMaximized'
    | 'system-stats-update'
    | 'system-stats-error';

// Define system monitoring channels
const systemMonitoringChannels = [
    'system-stats-update',
    'system-stats-error'
] as const;

// Whitelist of valid channels for security
const validChannels = [
    'dialog:open',
    'app:getDocumentDir',
    'command:execute',
    'command:abort',
    'media:getInfo',
    'window:minimize',
    'window:maximize',
    'window:close',
    'window:isMaximized',
    ...systemMonitoringChannels
] as const;

// Type guard for channel validation
const validateChannel = (channel: string): channel is IpcChannel => {
    return validChannels.includes(channel as IpcChannel);
};

// Type definitions for the exposed electron API
interface ElectronAPI {
    ipcRenderer: {
        invoke: (channel: IpcChannel, data?: any) => Promise<any>;
        on: (channel: IpcChannel, func: (...args: any[]) => void) => void;
        once: (channel: IpcChannel, func: (...args: any[]) => void) => void;
    };
    systemMonitor: {
        getStats: () => Promise<any>;
        subscribe: (interval?: number) => Promise<number>;
        unsubscribe: (id: number) => Promise<boolean>;
        onUpdate: (callback: (stats: any) => void) => void;
        onError: (callback: (error: any) => void) => void;
    };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: async (channel: string, data?: any) => {
            if (validateChannel(channel)) {
                return await ipcRenderer.invoke(channel, data);
            }
            throw new Error(`Invalid channel: ${channel}`);
        },
        on: (channel: string, func: (...args: any[]) => void) => {
            if (validateChannel(channel)) {
                ipcRenderer.on(channel, (_event, ...args) => func(...args));
            }
        },
        once: (channel: string, func: (...args: any[]) => void) => {
            if (validateChannel(channel)) {
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            }
        }
    },
    systemMonitor: {
        getStats: async () => {
            return await ipcRenderer.invoke('command:execute', {
                command: 'get_system_stats'
            });
        },
        subscribe: async (interval?: number) => {
            return await ipcRenderer.invoke('command:execute', {
                command: 'subscribe_to_system_stats',
                args: { interval }
            });
        },
        unsubscribe: async (id: number) => {
            return await ipcRenderer.invoke('command:execute', {
                command: 'unsubscribe_from_system_stats',
                args: { id }
            });
        },
        onUpdate: (callback: (stats: any) => void) => {
            ipcRenderer.on('system-stats-update', (_event, data) => callback(data));
        },
        onError: (callback: (error: any) => void) => {
            ipcRenderer.on('system-stats-error', (_event, error) => callback(error));
        }
    }
} as ElectronAPI);

// Declare the API types globally
// declare global {
//     interface Window {
//         electron: ElectronAPI;
//     }
// }