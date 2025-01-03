// src/lib/webview.ts
import { webviewBridge } from './webview-bridge';
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
    return webviewBridge.openFileDialog(options);
};

export const getDocumentDir = async (options?: {
    create?: boolean;
    defaultPath?: string;
}): Promise<string> => {
    return webviewBridge.getDocumentDir(options);
};

export const invokeCommand = async <T>(
    command: string,
    args?: any,
    options?: ExecuteCommandOptions
): Promise<T> => {
    return webviewBridge.invokeCommand<T>(command, args, options);
};

export const getMediaInfo = async (filePath: string): Promise<MediaInfo> => {
    return webviewBridge.getMediaInfo(filePath);
};

// WebView2 type definitions
declare global {
    interface Window {
        chrome?: {
            webview?: {
                postMessage: (message: any) => void;
                addEventListener: (type: string, listener: (event: any) => void) => void;
            };
        };
    }
}