export interface VideoFormat {
    quality: string;
    format: string;
    size: number;
    url: string;
    mimeType: string;
    type: 'audio' | 'video';
  }
  
  export interface VideoInfo {
    title?: string;
    description?: string;
    duration?: number;
    thumbnail?: string;
    formats: VideoFormat[];
  }