// src/types/webview.d.ts
declare global {
    interface Window {
      chrome?: {
        webview?: {
          postMessage: (message: any) => void;
          addEventListener: (type: string, listener: (event: any) => void) => void;
        };
      };
    }
  }
  
  export {};