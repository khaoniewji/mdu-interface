// src/lib/mducore/hlsparser.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { URL } from 'url';
import { UserAgentSelector, UserAgentInfo } from './useragents';

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
  onProgress?: (progress: number) => void;
}

interface SegmentDownloadResult {
  sequence: number;
  data: Buffer;
  error?: Error;
}

export class HLSParser {
  static isHLS(_content: string) {
      throw new Error('Method not implemented.');
  }
  static getMasterPlaylistUrls(_content: string): string[] | PromiseLike<string[]> {
      throw new Error('Method not implemented.');
  }
  private static readonly DEFAULT_HEADERS = {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
  };

  private axios: AxiosInstance;
  private baseUrl: string;
  private userAgentSelector: UserAgentSelector;
  private currentUserAgent: UserAgentInfo;
  private encryptionKeys: Map<string, Buffer> = new Map();

  private constructor(
    baseUrl: string = '',
    headers: Record<string, string> = {},
    userAgent?: UserAgentInfo,
    config?: AxiosRequestConfig
  ) {
    this.baseUrl = baseUrl;
    this.userAgentSelector = UserAgentSelector.getInstance();
    this.currentUserAgent = userAgent || this.userAgentSelector.getRandomUserAgent();

    this.axios = axios.create({
      ...config,
      headers: {
        ...HLSParser.DEFAULT_HEADERS,
        'User-Agent': this.currentUserAgent.value,
        'Origin': this.baseUrl,
        'Referer': this.baseUrl,
        ...headers
      },
      timeout: config?.timeout || 10000,
      maxRedirects: config?.maxRedirects || 5
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          // Rotate user agent and retry on 403
          this.rotateUserAgent();
          const config = error.config;
          if (config) {
            return this.axios(config);
          }
        }
        throw error;
      }
    );
  }

  static async create(
    manifestUrl: string,
    headers: Record<string, string> = {},
    userAgent?: UserAgentInfo,
    config?: AxiosRequestConfig
  ): Promise<HLSParser> {
    const baseUrl = new URL(manifestUrl).origin;
    return new HLSParser(baseUrl, headers, userAgent, config);
  }

  rotateUserAgent(): void {
    this.currentUserAgent = this.userAgentSelector.getNextUserAgent();
    this.axios.defaults.headers['User-Agent'] = this.currentUserAgent.value;
  }

  setUserAgent(userAgent: UserAgentInfo): void {
    this.currentUserAgent = userAgent;
    this.axios.defaults.headers['User-Agent'] = userAgent.value;
  }

  getCurrentUserAgent(): UserAgentInfo {
    return this.currentUserAgent;
  }

  private resolveUrl(uri: string): string {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    return new URL(uri, this.baseUrl).toString();
  }

  async fetchPlaylist(url: string): Promise<ParsedPlaylist> {
    try {
      const response = await this.axios.get(url);
      const content = response.data;
      return this.parse(content, url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch playlist: ${error.message}`);
      }
      throw error;
    }
  }

  private async fetchEncryptionKey(keyUri: string): Promise<Buffer> {
    if (this.encryptionKeys.has(keyUri)) {
      return this.encryptionKeys.get(keyUri)!;
    }

    try {
      const response = await this.axios.get(keyUri, {
        responseType: 'arraybuffer'
      });
      const key = Buffer.from(response.data);
      this.encryptionKeys.set(keyUri, key);
      return key;
    } catch (error) {
      throw new Error(`Failed to fetch encryption key: ${error}`);
    }
  }

  parse(content: string, playlistUrl: string = ''): ParsedPlaylist {
    if (!this.isValidManifest(content)) {
      throw new Error('Invalid HLS manifest');
    }

    const lines = content.split('\n').filter(line => line.trim());
    
    if (this.isMasterPlaylist(content)) {
      return this.parseMasterPlaylist(lines, playlistUrl);
    }

    return this.parseMediaPlaylist(lines, playlistUrl);
  }

  private parseMasterPlaylist(lines: string[], _playlistUrl: string): ParsedPlaylist {
    const variants: VariantStream[] = [];
    let currentVariant: Partial<VariantStream> = {};

    lines.forEach(line => {
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        currentVariant = this.parseStreamInf(line);
      } else if (!line.startsWith('#') && currentVariant) {
        currentVariant.uri = this.resolveUrl(line);
        variants.push(currentVariant as VariantStream);
        currentVariant = {};
      }
    });

    return {
      master: true,
      variants: this.sortVariants(variants),
      metadata: {
        version: this.parseVersion(lines),
        targetDuration: 0,
        mediaSequence: 0,
        endList: false
      },
      segments: []
    };
  }

  private sortVariants(variants: VariantStream[]): VariantStream[] {
    return variants.sort((a, b) => b.bandwidth - a.bandwidth);
  }

  private parseMediaPlaylist(lines: string[], _playlistUrl: string): ParsedPlaylist {
    const metadata: PlaylistMetadata = {
      targetDuration: 0,
      mediaSequence: 0,
      endList: false,
      version: 1
    };

    const segments: MediaSegment[] = [];
    let currentSegment: Partial<MediaSegment> = {};
    let currentKey: MediaSegment['key'];
    let currentMap: MediaSegment['map'];
    let sequence = 0;

    lines.forEach((line) => {
      if (line.startsWith('#EXTINF:')) {
        currentSegment.duration = this.parseDuration(line);
      } else if (line.startsWith('#EXT-X-KEY:')) {
        currentKey = this.parseKey(line);
      } else if (line.startsWith('#EXT-X-MAP:')) {
        currentMap = this.parseMap(line);
      } else if (line.startsWith('#EXT-X-BYTERANGE:')) {
        currentSegment.byterange = this.parseByteRange(line);
      } else if (line.startsWith('#EXT-X-DISCONTINUITY')) {
        currentSegment.discontinuity = true;
      } else if (line.startsWith('#EXT-X-')) {
        this.parseMetadataTag(line, metadata);
      } else if (!line.startsWith('#')) {
        currentSegment.uri = this.resolveUrl(line);
        currentSegment.sequence = sequence++;
        if (currentKey) {
          currentSegment.key = { ...currentKey };
        }
        if (currentMap) {
          currentSegment.map = { ...currentMap };
        }
        segments.push(currentSegment as MediaSegment);
        currentSegment = {};
      }
    });

    return { metadata, segments };
  }

  private parseStreamInf(line: string): Partial<VariantStream> {
    const variant: Partial<VariantStream> = {};
    const attrs = this.parseAttributes(line);

    if (attrs.BANDWIDTH) variant.bandwidth = parseInt(attrs.BANDWIDTH);
    if (attrs.RESOLUTION) variant.resolution = attrs.RESOLUTION;
    if (attrs.CODECS) variant.codecs = attrs.CODECS.replace(/"/g, '');
    if (attrs['FRAME-RATE']) variant.frameRate = parseFloat(attrs['FRAME-RATE']);
    if (attrs.AUDIO) variant.audio = attrs.AUDIO;
    if (attrs.VIDEO) variant.video = attrs.VIDEO;
    if (attrs.SUBTITLES) variant.subtitles = attrs.SUBTITLES;
    if (attrs['CLOSED-CAPTIONS']) variant.closed_captions = attrs['CLOSED-CAPTIONS'];

    return variant;
  }

  private parseAttributes(line: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /([A-Z-]+)=(?:([^,]+)|"([^"]+)")/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const key = match[1];
      const value = match[2] || match[3];
      attrs[key] = value;
    }

    return attrs;
  }

  private parseKey(line: string): MediaSegment['key'] {
    const attrs = this.parseAttributes(line);
    return {
      method: attrs.METHOD,
      uri: attrs.URI ? this.resolveUrl(attrs.URI.replace(/"/g, '')) : undefined,
      iv: attrs.IV
    };
  }

  private parseMap(line: string): MediaSegment['map'] {
    const attrs = this.parseAttributes(line);
    const map: MediaSegment['map'] = {
      uri: this.resolveUrl(attrs.URI.replace(/"/g, ''))
    };

    if (attrs.BYTERANGE) {
      map.byterange = this.parseByteRange(`#EXT-X-BYTERANGE:${attrs.BYTERANGE}`);
    }

    return map;
  }

  private parseByteRange(line: string): { length: number; offset?: number } {
    const [length, offset] = line.substring(line.indexOf(':') + 1).split('@').map(Number);
    return { length, offset };
  }

  private parseDuration(line: string): number {
    const match = line.match(/#EXTINF:(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseVersion(lines: string[]): number {
    const versionLine = lines.find(line => line.startsWith('#EXT-X-VERSION:'));
    return versionLine ? parseInt(versionLine.split(':')[1]) : 1;
  }

  private parseMetadataTag(line: string, metadata: PlaylistMetadata): void {
    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      metadata.targetDuration = parseInt(line.split(':')[1]);
    } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      metadata.mediaSequence = parseInt(line.split(':')[1]);
    } else if (line.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
      metadata.playlistType = line.split(':')[1];
    } else if (line.startsWith('#EXT-X-ENDLIST')) {
      metadata.endList = true;
    } else if (line.startsWith('#EXT-X-VERSION:')) {
      metadata.version = parseInt(line.split(':')[1]);
    }
  }

  private isValidManifest(content: string): boolean {
    return content.trim().startsWith('#EXTM3U');
  }

  private isMasterPlaylist(content: string): boolean {
    return content.includes('#EXT-X-STREAM-INF:');
  }

  async downloadSegment(segment: MediaSegment, retries: number = 3): Promise<Buffer> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        let segmentData = await this.axios.get(segment.uri, {
          responseType: 'arraybuffer',
          ...(segment.byterange && {
            headers: {
              Range: `bytes=${segment.byterange.offset || 0}-${
                (segment.byterange.offset || 0) + segment.byterange.length - 1
              }`
            }
          })
        });

        let buffer = Buffer.from(segmentData.data);

        // Handle encryption if present
        if (segment.key?.method === 'AES-128' && segment.key.uri) {
          const key = await this.fetchEncryptionKey(segment.key.uri);
          buffer = this.decryptSegment(buffer, key, segment.key.iv);
        }

        return buffer;
      } catch (error) {
        lastError = error as Error;
        this.rotateUserAgent();
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError || new Error('Failed to download segment after retries');
  }

  private decryptSegment(data: Buffer, _key: Buffer, _iv?: string): Buffer {
    // Implement AES-128 decryption
    // This is a placeholder - you'll need to implement actual decryption logic
    return data;
  }

  async *downloadSegments(
    segments: MediaSegment[],
    options: DownloadOptions = {}
  ): AsyncGenerator<SegmentDownloadResult> {
    const concurrency = options.concurrent || 3;
    const queue = [...segments];
    const active = new Set<Promise<SegmentDownloadResult>>();

    while (queue.length > 0 || active.size > 0) {
      while (queue.length > 0 && active.size < concurrency) {
        const segment = queue.shift()!;
        const promise = this.downloadSegment(segment, options.retries)
          .then(data => ({
            sequence: segment.sequence,
            data
          }))
          .catch(error => ({
            sequence: segment.sequence,
            data: Buffer.from([]),
            error
          }));

        active.add(promise);
        promise.finally(() => active.delete(promise));
      }

      if (active.size > 0) {
        const result = await Promise.race(active);
        yield result;

        if (options.onProgress) {
          const progress = ((segments.length - queue.length) / segments.length) * 100;
          options.onProgress(progress);
        }
      }
    }
  }
}