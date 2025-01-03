// src/lib/utils/waveform.ts
export class WaveformVisualizer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;
    private animationId: number;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d')!;
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.animationId = 0;
    }
  
    async visualize(audioFile: File) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      source.start();
      this.draw();
    }
  
    private draw = () => {
      this.animationId = requestAnimationFrame(this.draw);
      const { width, height } = this.canvas;
      this.context.clearRect(0, 0, width, height);
      this.analyser.getByteTimeDomainData(this.dataArray);
      
      this.context.lineWidth = 2;
      this.context.strokeStyle = 'rgb(147, 51, 234)';
      this.context.beginPath();
  
      const sliceWidth = width / this.dataArray.length;
      let x = 0;
  
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = this.dataArray[i] / 128.0;
        const y = (v * height) / 2;
  
        if (i === 0) {
          this.context.moveTo(x, y);
        } else {
          this.context.lineTo(x, y);
        }
  
        x += sliceWidth;
      }
  
      this.context.lineTo(width, height / 2);
      this.context.stroke();
    };
  
    stop() {
      cancelAnimationFrame(this.animationId);
      this.audioContext.close();
    }
  }