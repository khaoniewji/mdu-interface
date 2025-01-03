// src/lib/types.ts
export interface FileDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: FileFilter[];
    properties?: DialogProperty[];
    message?: string;
    securityScopedBookmarks?: boolean;
    multiple?: boolean;
    directory?: boolean;
}

export interface FileFilter {
    name: string;
    extensions: string[];
}

export type DialogProperty =
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
    | 'dontAddToRecent';

export interface FileDialogResult {
    canceled: boolean;
    filePaths: string[];
    bookmarks?: string[];
}

export interface MediaInfo {
    format: {
        filename?: string;
        nbStreams?: number;
        nbPrograms?: number;
        formatName?: string;
        formatLongName?: string;
        startTime?: number;
        duration?: number;
        size?: number;
        bitRate?: number;
        probeScore?: number;
    };
    streams?: {
        video?: {
            codecType: 'video';
            codecName: string;
            codecLongName: string;
            profile?: string;
            width: number;
            height: number;
            codedWidth: number;
            codedHeight: number;
            frameRate: number;
            avgFrameRate: string;
            timeBase: string;
            bitRate?: number;
            bitsPerRawSample?: number;
            colorSpace?: string;
            colorTransfer?: string;
            colorPrimaries?: string;
            pixFmt?: string;
            level?: number;
        }[];
        audio?: {
            codecType: 'audio';
            codecName: string;
            codecLongName: string;
            profile?: string;
            sampleRate: number;
            channels: number;
            channelLayout: string;
            timeBase: string;
            bitRate?: number;
            bitsPerSample?: number;
        }[];
    };
    chapters?: {
        id: number;
        timeBase: string;
        start: number;
        end: number;
        tags?: Record<string, string>;
    }[];
    metadata?: Record<string, string>;
}

export interface ExecuteCommandOptions {
    timeout?: number;
    background?: boolean;
    signal?: AbortSignal;
}

export interface WebViewMessage {
    id: string;
    type: string;
    data: any;
}

export interface WebViewResponse {
    id: string;
    result?: any;
    error?: string;
}

export type MessageHandler = (response: { result?: any; error?: string }) => void;