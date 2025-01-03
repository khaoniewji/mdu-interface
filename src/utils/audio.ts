// src/lib/utils/audio.ts
export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  export const getAudioDuration = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = (error) => reject(error);
      audio.src = URL.createObjectURL(file);
    });
  };
  
  export const validateAudioFile = (file: File): boolean => {
    const validTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/mp3',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
    ];
    return validTypes.includes(file.type);
  };