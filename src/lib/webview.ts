// src/lib/webview.ts
import { electronBridge } from './electron-bridge';
import type { 
    FileDialogOptions, 
    FileDialogResult, 
    ExecuteCommandOptions, 
    MediaInfo,
    SystemStats
} from './types';

// Export type definitions
export * from './types';

// Utility functions
export const openFileDialog = async (
    options: FileDialogOptions
): Promise<FileDialogResult> => {
    return electronBridge.openFileDialog(options);
};

export const getDocumentDir = async (options?: {
    create?: boolean;
    defaultPath?: string;
}): Promise<string> => {
    return electronBridge.getDocumentDir(options);
};

export const invokeCommand = async <T>(
    command: string,
    args?: any,
    options?: ExecuteCommandOptions
): Promise<T> => {
    return electronBridge.invokeCommand<T>(command, args, options);
};

export const getMediaInfo = async (filePath: string): Promise<MediaInfo> => {
    return electronBridge.getMediaInfo(filePath);
};

// Add to electron-bridge.ts or webview.ts
export const subscribeToSystemStats = async (interval?: number): Promise<number> => {
    return invokeCommand<number>('subscribe_to_system_stats', { interval });
};

export const unsubscribeFromSystemStats = async (id: number): Promise<boolean> => {
    return invokeCommand<boolean>('unsubscribe_from_system_stats', { id });
};

export const getSystemStats = async (): Promise<SystemStats> => {
    return invokeCommand<SystemStats>('get_system_stats');
};