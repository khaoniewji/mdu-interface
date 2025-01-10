// ./src/process/extractvideo.ts
import { extractYouTubeVideo } from './platform/youtube';

export interface VideoExtractRequest {
    url: string;
    format?: string;
    quality?: string;
    download?: boolean;
    info?: boolean;
}

export interface VideoFormat {
    quality: string;
    format: string;
    size: number;
    url: string;
}

export interface VideoMetadata {
    title: string;
    description?: string;
    duration: number;
    thumbnail?: string;
    formats: VideoFormat[];
    downloadUrl?: string;  // Direct download URL if download=true
}

export async function extractVideo(request: VideoExtractRequest): Promise<VideoMetadata> {
    // Validate request
    if (!request.url) {
        throw new Error('URL is required');
    }

    // Set default values
    const params: VideoExtractRequest = {
        format: request.format || 'mp4',
        quality: request.quality || 'highest',
        download: request.download || false,
        info: request.info || false,
        ...request
    };

    // Detect platform and extract
    try {
        if (isYouTubeUrl(request.url)) {
            return await extractYouTubeVideo(request.url, params.format, params.quality);
        } else if (isVimeoUrl(request.url)) {
            throw new Error('Vimeo support coming soon');
        } else {
            throw new Error('Unsupported platform. Currently supports: YouTube');
        }
    } catch (error: any) {
        throw new Error(`${error.message}`);
    }
}

// Helper functions
function isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function isVimeoUrl(url: string): boolean {
    return url.includes('vimeo.com');
}