// src/lib/types.ts

// File Dialog Types
export interface FileDialogOptions {
    properties?: string[];
    filters?: Array<{ name: string; extensions: string[] }>;
    defaultPath?: string;
}

export interface FileDialogResult {
    canceled: boolean;
    filePaths: string[];
}

// Command Execution Types
export interface ExecuteCommandOptions {
    signal?: AbortSignal;
    timeout?: number;
}

// Media Information Types
export interface MediaInfo {
    duration: number;
    format: string;
    bitrate: number;
    codec: string;
    channels: number;
    sampleRate: number;
}

// System Information Types
export interface DriveInfo {
    name: string;
    mount_point: string;
    total_space: number;
    free_space: number;
    available_space: number;
    drive_type: string;
}

export interface NetworkSpeed {
    download: number;
    upload: number;
    timestamp: number;
}

export interface SystemStats {
    drives: DriveInfo[];
    network: NetworkSpeed;
    counts: {
        downloads: number;
        queue: number;
        completed: number;
    };
}

export interface SystemStatus {
    cpu_usage: number;
    memory_usage: number;
    os_info: string;
    cpu_info: string;
    app_version: string;
}

// Status Bar Types
export interface StatusMessage {
    type: 'info' | 'warning' | 'error';
    text: string;
    timestamp: number;
}

// Window Control Types
export interface WindowState {
    isMaximized: boolean;
    isMinimized: boolean;
    isFocused: boolean;
}

// Application Settings Types
export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoStart: boolean;
    notifications: boolean;
}

// IPC Channel Types
export type IpcChannel =
    | 'dialog:open'
    | 'app:getDocumentDir'
    | 'command:execute'
    | 'command:abort'
    | 'window:minimize'
    | 'window:maximize'
    | 'window:close'
    | 'window:isMaximized'
    | 'app:darkMode'
    | 'system-stats-update'
    | 'system-stats-error';

// Command Types
export type CommandType =
    | 'media:getInfo'
    | 'app:getVersion'
    | 'app:getPlatform'
    | 'app:getPath'
    | 'get_system_stats'
    | 'subscribe_to_system_stats'
    | 'unsubscribe_from_system_stats';

// Electron Bridge Types
export interface ElectronAPI {
    ipcRenderer: {
        invoke(channel: string, data?: any): Promise<any>;
        on(channel: string, func: (...args: any[]) => void): void;
        once(channel: string, func: (...args: any[]) => void): void;
        removeListener(channel: string, func: (...args: any[]) => void): void;
    };
}

// // Window with Electron
// declare global {
//     interface Window {
//         electron?: ElectronAPI;
//     }
// }

// Response Types
export interface CommandResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Subscription Types
export interface SubscriptionOptions {
    interval?: number;
    callback?: (data: any) => void;
}

export interface SystemStatsSubscription {
    id: number;
    interval: number;
}

// Error Types
export interface AppError extends Error {
    code?: string;
    details?: any;
}

// Path Types
export interface PathOptions {
    create?: boolean;
    defaultPath?: string;
}

export type PathName = 
    | 'home'
    | 'appData'
    | 'userData'
    | 'temp'
    | 'downloads'
    | 'documents'
    | 'music'
    | 'pictures'
    | 'videos';

// Event Types
export interface SystemStatsUpdateEvent {
    id: number;
    stats: SystemStats;
}

export interface SystemStatsErrorEvent {
    id: number;
    error: string;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
    mode: ThemeMode;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        error: string;
        text: string;
    };
}

// Utility Types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export interface Disposable {
    dispose(): void;
}

// Process Information Types
export interface ProcessInfo {
    pid: number;
    memory: number;
    cpu: number;
    name: string;
    command: string;
}

// Export namespace for organization
export namespace App {
    export type Settings = AppSettings;
    export type Error = AppError;
    export type Command = CommandType;
    export type IpcChannelType = IpcChannel;
}