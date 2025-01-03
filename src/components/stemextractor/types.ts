// src/components/stemextractor/types.ts
export interface StemExtractionResult {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
    accompaniment?: string;
  }
  
  export type ModelType = "htdemucs" | "htdemucs_6s" | "mdx_extra" | "mdx_extra_q";
  export type SegmentSize = "default" | "8" | "16" | "32";
  export type ShiftCount = 0 | 1 | 2;
  export type SplitType = "2stems" | "4stems" | "5stems";
  export type OverlapSize = "4" | "8" | "16";
  export type QualityLevel = "low" | "medium" | "high";
  
  export interface ExtractionSettings {
    model: ModelType;
    segments: SegmentSize;
    shifts: ShiftCount;
    splits: SplitType;
    overlap: OverlapSize;
    quality?: QualityLevel;
    advanced?: AdvancedSettings;
  }
  
  export interface AdvancedSettings {
    normalize: boolean;
    denoise: boolean;
    sampleRate?: number;
    bitDepth?: 16 | 24 | 32;
    channels?: 1 | 2;
    trimSilence?: boolean;
    fadeInOut?: boolean;
    fadeLength?: number; // in milliseconds
  }
  
  export interface ModelOption {
    value: ModelType;
    label: string;
    description: string;
    recommended?: boolean;
    requirements?: {
      minRAM?: number; // in GB
      gpuRequired?: boolean;
      processingSpeed?: 'slow' | 'medium' | 'fast';
    };
  }
  
  export interface SplitOption {
    value: SplitType;
    label: string;
    description: string;
    stems: string[];
    defaultModel?: ModelType;
  }
  
  export interface ProcessingStatus {
    status: 'idle' | 'processing' | 'completed' | 'error';
    progress: number;
    currentPhase?: string;
    timeRemaining?: number;
    error?: string;
  }
  
  export interface ExtractionResult {
    id: string;
    timestamp: number;
    settings: ExtractionSettings;
    stems: StemExtractionResult;
    metadata: ExtractionMetadata;
  }
  
  export interface ExtractionMetadata {
    inputFile: {
      name: string;
      size: number;
      format: string;
      duration: number;
      sampleRate: number;
      channels: number;
      bitrate?: number;
    };
    outputFiles: {
      format: string;
      totalSize: number;
      stems: {
        [key: string]: {
          path: string;
          size: number;
          duration: number;
        };
      };
    };
    processing: {
      startTime: number;
      endTime: number;
      duration: number;
      model: ModelType;
      success: boolean;
      error?: string;
    };
  }
  
  export interface ExtractionStats {
    originalDuration: number;
    processingTime: number;
    compressionRatio: number;
    stemCount: number;
    outputFormat: string;
    modelUsed: ModelType;
    quality: QualityLevel;
  }
  
  // Constants
  export const DEFAULT_SETTINGS: ExtractionSettings = {
    model: "htdemucs",
    segments: "default",
    shifts: 0,
    splits: "4stems",
    overlap: "8",
    quality: "medium",
    advanced: {
      normalize: true,
      denoise: false,
      sampleRate: 44100,
      bitDepth: 16,
      channels: 2,
      trimSilence: false,
      fadeInOut: true,
      fadeLength: 100
    }
  };
  
  export const SUPPORTED_FORMATS = [
    'mp3',
    'wav',
    'flac',
    'ogg',
    'm4a',
    'aac',
    'wma',
    'aiff'
  ] as const;
  
  export const SUPPORTED_MODELS: ModelOption[] = [
    {
      value: "htdemucs",
      label: "HTDemucs",
      description: "Best overall quality and separation",
      recommended: true,
      requirements: {
        minRAM: 8,
        gpuRequired: false,
        processingSpeed: 'medium'
      }
    },
    {
      value: "htdemucs_6s",
      label: "HTDemucs 6s",
      description: "Faster processing with good quality",
      requirements: {
        minRAM: 6,
        gpuRequired: false,
        processingSpeed: 'fast'
      }
    },
    {
      value: "mdx_extra",
      label: "MDX Extra",
      description: "Enhanced separation for complex tracks",
      requirements: {
        minRAM: 12,
        gpuRequired: true,
        processingSpeed: 'slow'
      }
    },
    {
      value: "mdx_extra_q",
      label: "MDX Extra Q",
      description: "Maximum quality, longer processing time",
      requirements: {
        minRAM: 16,
        gpuRequired: true,
        processingSpeed: 'slow'
      }
    }
  ];
  
  export const SUPPORTED_SPLITS: SplitOption[] = [
    {
      value: "2stems",
      label: "2 Stems",
      description: "Vocals + Instrumental",
      stems: ['vocals', 'accompaniment'],
      defaultModel: "htdemucs_6s"
    },
    {
      value: "4stems",
      label: "4 Stems",
      description: "Vocals + Drums + Bass + Other",
      stems: ['vocals', 'drums', 'bass', 'other'],
      defaultModel: "htdemucs"
    },
    {
      value: "5stems",
      label: "5 Stems",
      description: "Vocals + Drums + Bass + Piano + Other",
      stems: ['vocals', 'drums', 'bass', 'piano', 'other'],
      defaultModel: "mdx_extra"
    }
  ];