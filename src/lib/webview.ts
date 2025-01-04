// src/lib/webview.ts
import { electronBridge } from './electron-bridge';
import type { 
    FileDialogOptions, 
    FileDialogResult, 
    ExecuteCommandOptions, 
    MediaInfo 
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

