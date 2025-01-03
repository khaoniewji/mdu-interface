// src/lib/mducore/mdu.d.ts

declare namespace MDU {
    // Common Types
    type ProgressCallback = (progress: number) => void;
    type ErrorCallback = (error: Error) => void;
    type LogCallback = (message: string, level: 'info' | 'warn' | 'error' | 'debug') => void;
  
    // HLS Types
    interface MediaSegment {
      uri: string;
      duration: number;
      sequence: number;
      discontinuity?: boolean;
      byterange?: {
        length: number;
        offset?: number;
      };
      key?: {
        method: string;
        uri?: string;
        iv?: string;
      };
      map?: {
        uri: string;
        byterange?: {
          length: number;
          offset?: number;
      };
    };
    }
  
    interface PlaylistMetadata {
      targetDuration: number;
      mediaSequence: number;
      endList: boolean;
      version: number;
      playlistType?: string;
      encryptionMethod?: string;
      encryptionKey?: string;
      encryptionIV?: string;
    }
  
    interface ParsedPlaylist {
      metadata: PlaylistMetadata;
      segments: MediaSegment[];
      master?: boolean;
      variants?: VariantStream[];
    }
  
    interface VariantStream {
      uri: string;
      bandwidth: number;
      resolution?: string;
      codecs?: string;
      frameRate?: number;
      audio?: string;
      video?: string;
      subtitles?: string;
      closed_captions?: string;
    }
  
    interface DownloadOptions {
      timeout?: number;
      retries?: number;
      concurrent?: number;
      onProgress?: ProgressCallback;
      onError?: ErrorCallback;
      outputPath?: string;
      headers?: Record<string, string>;
      proxy?: string;
    }
  
    // Video Info Types
    interface VideoFormat {
      format_id: string;
      ext: string;
      url: string;
      acodec: string;
      vcodec: string;
      width?: number;
      height?: number;
      filesize?: number;
      tbr?: number;
      protocol: string;
      quality: string;
      format_note?: string;
    }
  
    interface VideoInfo {
      id: string;
      title: string;
      description?: string;
      thumbnail?: string;
      duration: number;
      view_count?: number;
      like_count?: number;
      uploader: string;
      upload_date: string;
      formats: VideoFormat[];
      subtitles?: Record<string, SubtitleTrack[]>;
      automatic_captions?: Record<string, SubtitleTrack[]>;
      categories?: string[];
      tags?: string[];
      is_live?: boolean;
      live_status?: 'is_live' | 'was_live' | 'not_live' | 'post_live';
      start_time?: number;
      end_time?: number;
      chapters?: Chapter[];
      channel_id?: string;
      channel_url?: string;
      extractor: string;
      extractor_key: string;
      webpage_url: string;
    }
  
    interface SubtitleTrack {
      url: string;
      ext: string;
      name: string;
      language: string;
    }
  
    interface Chapter {
      start_time: number;
      end_time: number;
      title: string;
    }
  
    // Download Types
    interface DownloadTask {
      id: string;
      url: string;
      title: string;
      format: string;
      status: DownloadStatus;
      progress: number;
      size?: number;
      downloaded: number;
      speed: number;
      eta?: number;
      created_at: Date;
      updated_at: Date;
      error?: string;
      output_path?: string;
    }
  
    type DownloadStatus = 
      | 'queued' 
      | 'downloading' 
      | 'paused'
      | 'completed'
      | 'error'
      | 'canceled';
  
    // Configuration Types
    interface Config {
      download: {
        concurrent_downloads: number;
        max_retries: number;
        chunk_size: number;
        default_output_path: string;
        filename_template: string;
        user_agent_rotation: boolean;
        proxy_rotation: boolean;
      };
      network: {
        timeout: number;
        max_bandwidth?: number;
        proxy_list?: string[];
        headers?: Record<string, string>;
      };
      extraction: {
        prefer_native: boolean;
        use_cookies: boolean;
        cookies_file?: string;
      };
    }
  
    // User Agent Types
    interface UserAgentInfo {
      name: string;
      value: string;
      platform: 'desktop' | 'mobile' | 'tablet';
      os: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
    }
  
    // Event Types
    interface DownloadEvent {
      type: 'progress' | 'complete' | 'error' | 'pause' | 'resume' | 'cancel';
      task: DownloadTask;
      error?: Error;
    }
  
    // API Interfaces
    interface HLSParser {
      create(
        manifestUrl: string,
        headers?: Record<string, string>,
        userAgent?: UserAgentInfo,
        config?: any
      ): Promise<HLSParser>;
      fetchPlaylist(url: string): Promise<ParsedPlaylist>;
      downloadSegment(segment: MediaSegment, retries?: number): Promise<Buffer>;
      downloadSegments(
        segments: MediaSegment[],
        options?: DownloadOptions
      ): AsyncGenerator<SegmentDownloadResult>;
      rotateUserAgent(): void;
      setUserAgent(userAgent: UserAgentInfo): void;
      getCurrentUserAgent(): UserAgentInfo;
    }
  
    interface SegmentDownloadResult {
      sequence: number;
      data: Buffer;
      error?: Error;
    }
  
    interface DownloadManager {
      addTask(url: string, options?: DownloadOptions): Promise<string>;
      pauseTask(id: string): Promise<void>;
      resumeTask(id: string): Promise<void>;
      cancelTask(id: string): Promise<void>;
      removeTask(id: string): Promise<void>;
      getTask(id: string): Promise<DownloadTask>;
      listTasks(): Promise<DownloadTask[]>;
      on(event: string, callback: (event: DownloadEvent) => void): void;
      off(event: string, callback: (event: DownloadEvent) => void): void;
    }
  
    interface Extractor {
      extract(url: string): Promise<VideoInfo>;
      isSupported(url: string): boolean;
      getFormats(url: string): Promise<VideoFormat[]>;
      getSubtitles(url: string): Promise<Record<string, SubtitleTrack[]>>;
    }
  
    // Error Types
    interface MDUError extends Error {
      code: string;
      details?: any;
    }
  
    class NetworkError extends Error implements MDUError {
      code: string;
      details?: any;
    }
  
    class ExtractorError extends Error implements MDUError {
      code: string;
      details?: any;
    }
  
    class DownloadError extends Error implements MDUError {
      code: string;
      details?: any;
    }
  }
  
  export = MDU;
  export as namespace MDU;