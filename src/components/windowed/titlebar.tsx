// src/components/windowed/titlebar.tsx
import { useState, useEffect } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import appLogo from '../../assets/app.png';

interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
}

interface WebViewMessage {
  type: string;
  data: any;
}

function TitleBar() {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMinimized: false,
    isFullscreen: false,
  });

  useEffect(() => {
    // Setup message handler for window state updates
    const handleMessage = (event: { data: WebViewMessage }) => {
      const { type, data } = event.data;
      if (type === 'window-state') {
        setWindowState(data);
      }
    };

    // Get initial window state
    window.chrome?.webview?.postMessage({ 
      command: 'get_window_state' 
    });

    // Subscribe to window state updates
    window.chrome?.webview?.addEventListener('message', handleMessage);

    // No need to remove event listener as WebView2 handles cleanup automatically
    // when the component is unmounted
    return () => {
      // Cleanup is handled by WebView2
    };
  }, []);

  const handleMinimize = () => {
    window.chrome?.webview?.postMessage({ 
      command: 'minimize_window' 
    });
  };

  const handleMaximize = () => {
    window.chrome?.webview?.postMessage({ 
      command: 'toggle_maximize_window' 
    });
  };

  const handleClose = () => {
    window.chrome?.webview?.postMessage({ 
      command: 'close_window' 
    });
  };

  return (
    <div 
      className="h-8 bg-[#1a1a1a] border-b border-[#2e2e2e] flex items-center justify-between select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left side - drag handle and title */}
      <div className="flex-1 px-2 flex items-center">
        <img src={appLogo} alt="App Icon" className="w-4 h-4 mr-2" />
        <span className="text-xs text-gray-400 font-medium">
          Media Downloader Utility
        </span>
      </div>

      {/* Right side - window controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-12 h-full flex items-center justify-center
                     hover:bg-[#2d2d2d] transition-colors"
          title="Minimize"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="w-12 h-full flex items-center justify-center
                     hover:bg-[#2d2d2d] transition-colors"
          title={windowState.isMaximized ? "Restore" : "Maximize"}
        >
          {windowState.isMaximized ? (
            <Square className="w-4 h-4 text-gray-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-12 h-full flex items-center justify-center
                     hover:bg-red-600 transition-colors group"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;