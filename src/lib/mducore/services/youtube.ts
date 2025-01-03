// src/services/youtube.ts

import { invokeCommand } from '../../webview';
import { HLSParser } from '../hlsparser';

interface YouTubeVideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number;
  tbr: number;
  url: string;
  acodec: string;
  vcodec: string;
  fps: number;
  isHLS?: boolean;
  hlsManifestUrl?: string;
}

interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  view_count: number;
  like_count: number;
  uploader: string;
  upload_date: string;
  formats: YouTubeVideoFormat[];
}

export class YouTubeService {
  private static instance: YouTubeService;

  private constructor() {}

  static getInstance(): YouTubeService {
    if (!this.instance) {
      this.instance = new YouTubeService();
    }
    return this.instance;
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      const info = await invokeCommand<YouTubeVideoInfo>('youtube_get_info', { url });
      return this.processVideoInfo(info);
    } catch (error) {
      throw new Error(`Failed to fetch video info: ${error}`);
    }
  }

  async getVideoFormats(url: string): Promise<YouTubeVideoFormat[]> {
    try {
      const info = await this.getVideoInfo(url);
      return info.formats;
    } catch (error) {
      throw new Error(`Failed to fetch video formats: ${error}`);
    }
  }

  async downloadVideo(url: string, format: string, options: {
    outputPath?: string;
    quality?: string;
    audioOnly?: boolean;
    onProgress?: (progress: number) => void;
  } = {}): Promise<string> {
    try {
      const downloadId = await invokeCommand<string>('youtube_download', {
        url,
        format,
        ...options
      });

      if (options.onProgress) {
        await this.setupProgressListener(downloadId, options.onProgress);
      }

      return downloadId;
    } catch (error) {
      throw new Error(`Failed to start download: ${error}`);
    }
  }

  private async setupProgressListener(
    downloadId: string,
    onProgress: (progress: number) => void
  ): Promise<() => void> {
    const unsubscribe = await invokeCommand<() => void>('subscribe_to_download_progress', {
      downloadId,
      onProgress: (progress: number) => {
        onProgress(progress);
      }
    });

    return unsubscribe;
  }

  private processVideoInfo(info: YouTubeVideoInfo): YouTubeVideoInfo {
    // Process formats to handle HLS streams if present
    info.formats = info.formats.map(format => {
      if (format.url && format.url.includes('.m3u8')) {
        // Handle HLS format
        return this.processHLSFormat(format);
      }
      return format;
    });

    return info;
  }

  private processHLSFormat(format: YouTubeVideoFormat): YouTubeVideoFormat {
    if (!format.url.includes('.m3u8')) return format;

    // Add HLS-specific properties
    return {
      ...format,
      isHLS: true,
      hlsManifestUrl: format.url,
      // Add any other HLS-specific properties needed
    };
  }

  async getStreamUrls(manifestUrl: string): Promise<string[]> {
    try {
      const response = await fetch(manifestUrl);
      const content = await response.text();
      
      // if (!HLSParser.isHLS(content)) {
      //   throw new Error('Not a valid HLS manifest');
      // }

      return HLSParser.getMasterPlaylistUrls(content);
    } catch (error) {
      throw new Error(`Failed to parse HLS manifest: ${error}`);
    }
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i))) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  }
}

// Export singleton instance
export const youtubeService = YouTubeService.getInstance();