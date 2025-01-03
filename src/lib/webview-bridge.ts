import {
    FileDialogOptions,
    FileDialogResult,
    ExecuteCommandOptions,
    MediaInfo,
    WebViewMessage,
    WebViewResponse,
    MessageHandler
} from './types';

class WebViewBridge {
    private static instance: WebViewBridge;
    private isInitialized: boolean = false;
    private messageHandlers: Map<string, MessageHandler> = new Map();
    private messageCounter: number = 0;

    private constructor() {
        this.initialize();
    }

    public static getInstance(): WebViewBridge {
        if (!WebViewBridge.instance) {
            WebViewBridge.instance = new WebViewBridge();
        }
        return WebViewBridge.instance;
    }

    private initialize(): void {
        if (this.isInitialized) return;

        if (typeof window === 'undefined' || !window.chrome?.webview) {
            console.warn('WebView2 environment not detected');
            return;
        }

        this.setupMessageHandler();
        this.isInitialized = true;
    }

    private setupMessageHandler(): void {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.addEventListener('message', (event: { data: WebViewResponse }) => {
                const { id, result, error } = event.data;
                const handler = this.messageHandlers.get(id);

                if (handler) {
                    if (error) {
                        handler({ error });
                    } else {
                        handler({ result });
                    }
                    this.messageHandlers.delete(id);
                }
            });
        }
    }

    private async postMessage<T>(type: string, data: any): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!window.chrome?.webview) {
                reject(new Error('WebView2 environment not available'));
                return;
            }

            const messageId = `${type}_${this.messageCounter++}`;
            const message: WebViewMessage = {
                id: messageId,
                type,
                data
            };

            this.messageHandlers.set(messageId, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result as T);
                }
            });

            window.chrome.webview.postMessage(message);
        });
    }

    public async openFileDialog(options: FileDialogOptions): Promise<FileDialogResult> {
        try {
            return await this.postMessage<FileDialogResult>('showOpenDialog', options);
        } catch (error) {
            throw new Error(`Failed to open file dialog: ${error}`);
        }
    }

    public async getDocumentDir(options: {
        create?: boolean;
        defaultPath?: string;
    } = {}): Promise<string> {
        try {
            return await this.postMessage<string>('getDocumentDirectory', options);
        } catch (error) {
            throw new Error(`Failed to get document directory: ${error}`);
        }
    }

    public async invokeCommand<T>(
        command: string,
        args?: any,
        options: ExecuteCommandOptions = {}
    ): Promise<T> {
        try {
            const messageData = {
                command,
                args,
                options
            };

            if (options.signal) {
                options.signal.addEventListener('abort', () => {
                    this.postMessage('abortCommand', { command });
                });
            }

            return await this.postMessage<T>('executeCommand', messageData);
        } catch (error) {
            throw new Error(`Failed to execute command: ${error}`);
        }
    }

    public async getMediaInfo(filePath: string): Promise<MediaInfo> {
        return this.invokeCommand<MediaInfo>('get_media_info', {
            path: filePath,
            detailed: true,
        });
    }
}

export const webviewBridge = WebViewBridge.getInstance();