import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import type { VideoMetadata } from '../extractvideo';

interface VideoInfo {
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
    formats: VideoFormat[];
}

interface VideoFormat {
    quality: string;
    format: string;
    size: number;
    url: string;
}

export async function extractYouTubeVideo(url: string, format?: string, quality?: string): Promise<VideoMetadata> {
    try {
        const videoId = extractVideoId(url);
        const videoInfo = await fetchVideoInfo(videoId);
        
        if (!videoInfo.formats || videoInfo.formats.length === 0) {
            throw new Error('No video formats found');
        }
        
        return {
            title: videoInfo.title,
            description: videoInfo.description,
            duration: videoInfo.duration,
            thumbnail: videoInfo.thumbnail,
            formats: videoInfo.formats
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to extract YouTube video: ${error.message}`);
        } else {
            throw new Error('Failed to extract YouTube video: Unknown error');
        }
    }
}

// New function to list all available formats
export async function listAvailableFormats(url: string): Promise<VideoFormat[]> {
    try {
        const videoId = extractVideoId(url);
        const videoInfo = await fetchVideoInfo(videoId);
        return videoInfo.formats;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to list formats: ${error.message}`);
        }
        throw new Error('Failed to list formats: Unknown error');
    }
}

function extractVideoId(url: string): string {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    
    if (!match) {
        throw new Error('Invalid YouTube URL');
    }
    
    return match[1];
}

async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract video metadata from JSON-LD
        const jsonLd = $('script[type="application/ld+json"]').html();
        let videoData = {};
        if (jsonLd) {
            try {
                videoData = JSON.parse(jsonLd);
            } catch (e) {
                console.error('Failed to parse JSON-LD:', e);
            }
        }

        // Extract player response data
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
        let playerResponse = {};
        if (playerResponseMatch) {
            try {
                playerResponse = JSON.parse(playerResponseMatch[1]);
            } catch (e) {
                console.error('Failed to parse player response:', e);
            }
        }

        const title = $('meta[name="title"]').attr('content') || 
                     $('meta[property="og:title"]').attr('content') ||
                     'Untitled';
        const description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') ||
                          '';
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        const formats = extractFormatsFromPlayerResponse(playerResponse);
        
        if (formats.length === 0) {
            console.error('No formats found in player response');
            throw new Error('No video formats found');
        }
        
        return {
            title,
            description,
            duration: extractDuration(playerResponse),
            thumbnail,
            formats
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch video info: ${error.message}`);
    }
}

function extractFormatsFromPlayerResponse(playerResponse: any): VideoFormat[] {
    const formats: VideoFormat[] = [];
    
    try {
        const streamingData = playerResponse?.streamingData;
        if (!streamingData) return formats;

        // Process adaptive formats
        const adaptiveFormats = streamingData.adaptiveFormats || [];
        adaptiveFormats.forEach((format: any) => {
            if (format.url || format.signatureCipher) {
                formats.push({
                    quality: format.qualityLabel || format.quality,
                    format: format.mimeType?.split(';')[0].split('/')[1] || 'unknown',
                    size: format.contentLength ? parseInt(format.contentLength) : 0,
                    url: format.url || ''  // You might need to decode signatureCipher if url is not available
                });
            }
        });

        // Process formats
        const regularFormats = streamingData.formats || [];
        regularFormats.forEach((format: any) => {
            if (format.url || format.signatureCipher) {
                formats.push({
                    quality: format.qualityLabel || format.quality,
                    format: format.mimeType?.split(';')[0].split('/')[1] || 'unknown',
                    size: format.contentLength ? parseInt(format.contentLength) : 0,
                    url: format.url || ''
                });
            }
        });
    } catch (error) {
        console.error('Error extracting formats from player response:', error);
    }

    return formats;
}

function extractDuration(playerResponse: any): number {
    try {
        return parseInt(playerResponse?.videoDetails?.lengthSeconds || '0', 10);
    } catch (error) {
        return 0;
    }
}