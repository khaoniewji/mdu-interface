import { ExtractionSettings, ProcessingStatus, StemExtractionResult } from "@/components/stemextractor/types";

interface PythonBridgeConfig {
  endpoint: string;
  timeout?: number;
  maxRetries?: number;
}

export class PythonBridgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PythonBridgeError';
  }
}

export class PythonBridge {
  private readonly endpoint: string;

  constructor(config: PythonBridgeConfig) {
    this.endpoint = config.endpoint;
  }

  async startExtraction(
    file: File,
    settings: ExtractionSettings,
    onProgress?: (status: ProcessingStatus) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('settings', JSON.stringify(settings));

    try {
      const response = await fetch(`${this.endpoint}/extraction/start`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new PythonBridgeError(
          'Failed to start extraction',
          'START_FAILED',
          await response.json()
        );
      }

      const { jobId } = await response.json();
      
      if (onProgress) {
        this.startProgressPolling(jobId, onProgress);
      }

      return jobId;
    } catch (error) {
      throw new PythonBridgeError(
        'Failed to communicate with Python backend',
        'COMMUNICATION_ERROR',
        error
      );
    }
  }

  private async startProgressPolling(
    jobId: string,
    onProgress: (status: ProcessingStatus) => void
  ) {
    const pollProgress = async () => {
      try {
        const response = await fetch(
          `${this.endpoint}/extraction/progress/${jobId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const status: ProcessingStatus = await response.json();
        onProgress(status);

        if (status.status !== 'completed' && status.status !== 'error') {
          setTimeout(pollProgress, 1000);
        }
      } catch (error) {
        onProgress({
          status: 'error',
          progress: 0,
          error: 'Failed to fetch progress'
        });
      }
    };

    pollProgress();
  }

  async getResults(jobId: string): Promise<StemExtractionResult> {
    try {
      const response = await fetch(
        `${this.endpoint}/extraction/results/${jobId}`
      );

      if (!response.ok) {
        throw new PythonBridgeError(
          'Failed to fetch results',
          'FETCH_RESULTS_FAILED',
          await response.json()
        );
      }

      return await response.json();
    } catch (error) {
      throw new PythonBridgeError(
        'Failed to fetch extraction results',
        'RESULTS_ERROR',
        error
      );
    }
  }

  async cancelExtraction(jobId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.endpoint}/extraction/cancel/${jobId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new PythonBridgeError(
          'Failed to cancel extraction',
          'CANCEL_FAILED',
          await response.json()
        );
      }
    } catch (error) {
      throw new PythonBridgeError(
        'Failed to cancel extraction',
        'CANCEL_ERROR',
        error
      );
    }
  }
}