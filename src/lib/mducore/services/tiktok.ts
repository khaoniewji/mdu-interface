// src/services/tiktok.ts
import axios, { AxiosInstance } from 'axios';
import { UserAgentSelector } from '../useragents';
import fs from 'fs';

interface TikTokVideo {
  id: string;
  desc: string;
  createTime: number;
  video: {
    id: string;
    height: number;
    width: number;
    duration: number;
    ratio: string;
    format: string;
    playAddr: string;
    downloadAddr: string;
    cover: string;
    dynamicCover: string;
  };
  author: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarLarger: string;
  };
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
  };
  music: {
    id: string;
    title: string;
    authorName: string;
    playUrl: string;
  };
}

export class TikTokService {
  private static instance: TikTokService;
  private axios: AxiosInstance;
  private userAgentSelector: UserAgentSelector;

  private constructor() {
    this.userAgentSelector = UserAgentSelector.getInstance();
    this.axios = axios.create({
      headers: {
        'User-Agent': this.userAgentSelector.getRandomUserAgent().value,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
  }

  static getInstance(): TikTokService {
    if (!this.instance) {
      this.instance = new TikTokService();
    }
    return this.instance;
  }

  private rotateUserAgent(): void {
    this.axios.defaults.headers['User-Agent'] = 
      this.userAgentSelector.getNextUserAgent().value;
  }

  private async getVideoId(url: string): Promise<string> {
    const regex = /video\/(\d+)/;
    const match = url.match(regex);
    
    if (match) return match[1];

    // Handle shortened URLs
    const response = await this.axios.get(url, { maxRedirects: 5 });
    const finalUrl = response.request.res.responseUrl;
    const finalMatch = finalUrl.match(regex);
    
    if (!finalMatch) {
      throw new Error('Invalid TikTok URL');
    }
    
    return finalMatch[1];
  }

  async getVideoInfo(url: string): Promise<TikTokVideo> {
    try {
      const videoId = await this.getVideoId(url);
      const response = await this.axios.get(
        `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/`,
        {
          params: {
            aweme_id: videoId,
            device_type: 'iPhone13,2',
            region: 'US',
            priority_region: '',
            os_version: '14.4.2',
          },
        }
      );

      if (!response.data.aweme_list?.[0]) {
        throw new Error('Video not found');
      }

      return this.parseVideoData(response.data.aweme_list[0]);
    } catch (error) {
      this.rotateUserAgent();
      if (error instanceof Error) {
        throw new Error(`Failed to fetch TikTok video info: ${error.message}`);
      } else {
        throw new Error('Failed to fetch TikTok video info: Unknown error');
      }
    }
  }

  private parseVideoData(data: any): TikTokVideo {
    return {
      id: data.aweme_id,
      desc: data.desc,
      createTime: data.create_time,
      video: {
        id: data.video.vid,
        height: data.video.height,
        width: data.video.width,
        duration: data.video.duration,
        ratio: data.video.ratio,
        format: data.video.format || 'mp4',
        playAddr: data.video.play_addr.url_list[0],
        downloadAddr: data.video.download_addr.url_list[0],
        cover: data.video.cover.url_list[0],
        dynamicCover: data.video.dynamic_cover.url_list[0],
      },
      author: {
        id: data.author.uid,
        uniqueId: data.author.unique_id,
        nickname: data.author.nickname,
        avatarLarger: data.author.avatar_larger.url_list[0],
      },
      stats: {
        diggCount: data.statistics.digg_count,
        shareCount: data.statistics.share_count,
        commentCount: data.statistics.comment_count,
        playCount: data.statistics.play_count,
      },
      music: {
        id: data.music.mid,
        title: data.music.title,
        authorName: data.music.author,
        playUrl: data.music.play_url.url_list[0],
      },
    };
  }

  async downloadVideo(url: string, outputPath: string): Promise<string> {
    try {
      const info = await this.getVideoInfo(url);
      const videoResponse = await this.axios.get(info.video.downloadAddr, {
        responseType: 'arraybuffer',
      });

      const filename = `${info.id}.mp4`;
      const fullPath = `${outputPath}/${filename}`;
      await fs.promises.writeFile(fullPath, videoResponse.data);

      return fullPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download TikTok video: ${error.message}`);
      } else {
        throw new Error('Failed to download TikTok video: Unknown error');
      }
    }
  }
}

// Export singleton instance
export const tiktokService = TikTokService.getInstance();