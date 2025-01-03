// src/components/converter/types.ts
export interface ConversionItem {
    fileName: string;
    fileSize: string;
    progress: number;
    status: string;
    speed: string;
    eta: string;
    error: string;
    inputPath: string;
    outputPath: string;
    format: string;
    completedAt: string;
    elapsedTime: string;
    conversionId: string;
    videoCodec?: string;
    audioCodec?: string;
    resolution?: string;
    bitrate?: string;
  }

  export interface ConversionStatus {
    converting: string;
    completed: string;
    failed: string;
    stopped: string;
  }
  
  export interface ConversionOptions {
    quality: string;
    outputPath: string;
    videoCodec?: string;
    videoEngine?: string;
    audioCodec?: string;
    audioEngine?: string;
    videoBitrate?: string;
    audioBitrate?: string;
    resolution?: string;
    framerate?: string;
    sampleRate?: string;
    channels?: string;
  }
  
  export interface Codec {
    id: string;
    name: string;
    engines: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  }
  
  export interface FormatOption {
    value: string;
    label: string;
    type: "video" | "audio";
    description: string;
    extensions: string[];
  }