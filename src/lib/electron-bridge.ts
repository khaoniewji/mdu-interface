// src/lib/electron-bridge.ts
import type {
    FileDialogOptions,
    FileDialogResult,
    ExecuteCommandOptions,
    MediaInfo,
} from './types';

class ElectronBridge {
    private static instance: ElectronBridge;
    private isInitialized: boolean = false;

    private constructor() {
        this.initialize();
    }

    public static getInstance(): ElectronBridge {
        if (!ElectronBridge.instance) {
            ElectronBridge.instance = new ElectronBridge();
        }
        return ElectronBridge.instance;
    }

    private initialize(): void {
        if (this.isInitialized) return;

        if (!window?.electron?.ipcRenderer) {
            console.warn('Electron IPC environment not detected');
            return;
        }

        this.isInitialized = true;
    }

    private async invoke<T>(channel: string, data?: any): Promise<T> {
        if (!window?.electron?.ipcRenderer) {
            throw new Error('Electron IPC environment not available');
        }

        try {
            return await window.electron.ipcRenderer.invoke(channel, data);
        } catch (error) {
            throw new Error(`Failed to invoke ${channel}: ${error}`);
        }
    }

    public async openFileDialog(options: FileDialogOptions): Promise<FileDialogResult> {
        return this.invoke<FileDialogResult>('dialog:open', options);
    }

    public async getDocumentDir(options: {
        create?: boolean;
        defaultPath?: string;
    } = {}): Promise<string> {
        return this.invoke<string>('app:getDocumentDir', options);
    }

    public async invokeCommand<T>(
        command: string,
        args?: any,
        options: ExecuteCommandOptions = {}
    ): Promise<T> {
        const messageData = {
            command,
            args,
            options
        };

        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                this.invoke('command:abort', { command });
            });
        }

        return this.invoke<T>('command:execute', messageData);
    }

    public async getMediaInfo(filePath: string): Promise<MediaInfo> {
        return this.invokeCommand<MediaInfo>('media:getInfo', {
            path: filePath,
            detailed: true,
        });
    }
}

export const electronBridge = ElectronBridge.getInstance();