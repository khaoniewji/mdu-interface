import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { extractVideo } from './src/processor/extractvideo'
import { listAvailableFormats } from './src/processor/platform/youtube'

const app = new Elysia()
    .use(swagger({
        documentation: {
            info: {
                title: 'MDU API',
                description: 'Media Download Utility API',
                version: '1.0.0'
            }
        }
    }))
    .get('/', ({ path }) => path)
    .get('/extract', async ({ query }) => {
        if (!query.url) {
            throw new Error('URL is required')
        }
        return await extractVideo({
            url: query.url.toString(),
            format: query.format?.toString(),
            quality: query.quality?.toString(),
            download: query.download === 'true',
            info: query.info === 'true'
        })
    }, {
        query: t.Object({
            url: t.String(),
            format: t.Optional(t.String()),
            quality: t.Optional(t.String()),
            download: t.Optional(t.String()),
            info: t.Optional(t.String())
        }),
        detail: {
            summary: 'Extract video information and download options',
            tags: ['Video'],
            description: `
                Parameters:
                - url: Video URL (required)
                - format: Desired format (mp4, webm)
                - quality: Desired quality (360p, 720p, 1080p)
                - download: Get direct download URL (true/false)
                - info: Get only video info without formats (true/false)
            `
        }
    })
    .get('/formats', async ({ query }) => {
        if (!query.url) {
            throw new Error('URL is required')
        }
        const formats = await listAvailableFormats(query.url.toString())
        return {
            success: true,
            formats: formats.map(format => ({
                quality: format.quality,
                format: format.format,
                size: format.size,
                url: format.url
            }))
        }
    }, {
        query: t.Object({
            url: t.String()
        }),
        detail: {
            summary: 'List all available formats for a video',
            tags: ['Video'],
            description: `
                Lists all available formats and qualities for a video URL.
                
                Parameters:
                - url: Video URL (required)
                
                Returns an array of format objects containing:
                - quality: Video quality (e.g., 1080p, 720p)
                - format: File format (e.g., mp4, webm)
                - size: File size in bytes
                - url: Direct URL to the video format
            `
        }
    })
    .onError(({ code, error }) => {
        return {
            success: false,
            error: 'message' in error ? error.message : 'Unknown error',
            code: code
        }
    })
    .listen(3000)

console.log('🦊 MDU API is running at http://localhost:3000')