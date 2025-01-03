// src/components/converter/constants.ts
import { Codec, FormatOption } from '../components/converter/types';

export const VIDEO_CODECS: Codec[] = [
  {
    id: 'h264',
    name: 'H.264/AVC',
    engines: [
      { id: 'libx264', name: 'x264', description: 'CPU (Software)' },
      { id: 'h264_qsv', name: 'QSV', description: 'Intel QuickSync' },
      { id: 'h264_nvenc', name: 'NVENC', description: 'NVIDIA GPU' },
      { id: 'h264_amf', name: 'AMF', description: 'AMD GPU' }
    ]
  },
  {
    id: 'hevc',
    name: 'H.265/HEVC',
    engines: [
      { id: 'libx265', name: 'x265', description: 'CPU (Software)' },
      { id: 'hevc_qsv', name: 'QSV', description: 'Intel QuickSync' },
      { id: 'hevc_nvenc', name: 'NVENC', description: 'NVIDIA GPU' },
      { id: 'hevc_amf', name: 'AMF', description: 'AMD GPU' }
    ]
  },
  {
    id: 'av1',
    name: 'AV1',
    engines: [
      { id: 'libsvtav1', name: 'SVT-AV1', description: 'CPU (Software)' },
      { id: 'libaom-av1', name: 'AOM', description: 'CPU (Software)' },
      { id: 'av1_qsv', name: 'QSV', description: 'Intel QuickSync' }
    ]
  }
];

export const AUDIO_CODECS: Codec[] = [
  { 
    id: 'aac',
    name: 'AAC',
    engines: [
      { id: 'aac', name: 'AAC', description: 'Advanced Audio Coding' }
    ]
  },
  {
    id: 'opus',
    name: 'Opus',
    engines: [
      { id: 'libopus', name: 'Opus', description: 'Opus Interactive Audio Codec' }
    ]
  },
  {
    id: 'mp3',
    name: 'MP3',
    engines: [
      { id: 'libmp3lame', name: 'LAME', description: 'LAME MP3 Encoder' }
    ]
  },
  {
    id: 'ac3',
    name: 'AC3',
    engines: [
      { id: 'ac3', name: 'AC3', description: 'Dolby Digital' }
    ]
  },
  {
    id: 'eac3',
    name: 'E-AC3',
    engines: [
      { id: 'eac3', name: 'E-AC3', description: 'Dolby Digital Plus' }
    ]
  },
  {
    id: 'flac',
    name: 'FLAC',
    engines: [
      { id: 'flac', name: 'FLAC', description: 'Free Lossless Audio Codec' }
    ]
  },
  {
    id: 'alac',
    name: 'ALAC',
    engines: [
      { id: 'alac', name: 'ALAC', description: 'Apple Lossless Audio Codec' }
    ]
  }
];

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'mp4',
    label: 'MP4',
    type: 'video',
    description: 'MPEG-4 Part 14',
    extensions: ['mp4']
  },
  {
    value: 'mkv',
    label: 'MKV',
    type: 'video',
    description: 'Matroska Video',
    extensions: ['mkv']
  },
  {
    value: 'mp3',
    label: 'MP3',
    type: 'audio',
    description: 'MPEG Audio Layer III',
    extensions: ['mp3']
  },
  {
    value: 'wav',
    label: 'WAV',
    type: 'audio',
    description: 'Waveform Audio File Format',
    extensions: ['wav']
  }
];

export const QUALITY_PRESETS = {
  high: {
    label: 'High',
    videoBitrate: '5000k',
    audioBitrate: '320k',
    resolution: '1920x1080',
    sampleRate: '48000'
  },
  medium: {
    label: 'Medium',
    videoBitrate: '2500k',
    audioBitrate: '192k',
    resolution: '1280x720',
    sampleRate: '44100'
  },
  low: {
    label: 'Low',
    videoBitrate: '1000k',
    audioBitrate: '128k',
    resolution: '854x480',
    sampleRate: '44100'
  }
};

export const SUPPORTED_INPUT_FORMATS = [
  'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv',
  'webm', 'mp3', 'wav', 'aac', 'flac', 'm4a'
];