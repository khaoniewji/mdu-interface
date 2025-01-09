// src/types/media.ts
export interface VideoInfo {
    id: string;
    title: string;
    description?: string;
    duration?: number;
    thumbnail?: string;
    formats: Format[];
    upload_date?: string;
    uploader?: string;
    view_count?: number;
    platform: 'YouTube';
  }
  
  export interface Format {
    bitrate: number;
    fps: any;
    height: number;
    width?: number;
    format_id: string;
    url: string;
    ext: string;
    quality: string;
    format_note?: string;
    filesize?: number;
    tbr?: number;
    acodec?: string;
    vcodec?: string;
  }