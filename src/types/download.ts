export interface DownloadItem {
    fileName: string;
    fileSize: string;
    progress: number;
    status: string;
    speed: string;
    eta: string;
    error: string;
    title: string;
    url: string;
    completedAt: string;
    elapsedTime: string;
    videoId: string;
    outputPath: string;
    isAudioOnly: boolean;
}