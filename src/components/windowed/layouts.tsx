// src/components/windowed/layout.tsx
import { useEffect } from 'react';
import Header from './header';
import Sidebar from './sidebar';
// import StatusBar from './statusbar';
import { invokeCommand } from '../../lib/webview';

interface LayoutProps {
    children: React.ReactNode;
}

interface WindowState {
    width: number;
    height: number;
    isMaximized: boolean;
    isMinimized: boolean;
    isFullscreen: boolean;
}

function Layout({ children }: LayoutProps) {
    useEffect(() => {
        setupLayoutListeners();
        saveInitialWindowState();

        return () => {
            cleanupLayoutListeners();
        };
    }, []);

    const setupLayoutListeners = async () => {
        try {
            // Subscribe to window state changes
            await invokeCommand<() => void>('subscribe_to_window_state', {
                onStateChange: handleWindowStateChange
            });

            // Subscribe to window size changes
            await invokeCommand<() => void>('subscribe_to_window_size', {
                onSizeChange: handleWindowSizeChange
            });

            // Handle window close request
            await invokeCommand<() => void>('subscribe_to_window_close', {
                onCloseRequest: handleWindowClose
            });
        } catch (error) {
            console.error('Failed to setup layout listeners:', error);
        }
    };

    const cleanupLayoutListeners = async () => {
        try {
            await invokeCommand('unsubscribe_from_window_state');
            await invokeCommand('unsubscribe_from_window_size');
            await invokeCommand('unsubscribe_from_window_close');
        } catch (error) {
            console.error('Failed to cleanup layout listeners:', error);
        }
    };

    const saveInitialWindowState = async () => {
        try {
            const state = await invokeCommand<WindowState>('get_window_state');
            await invokeCommand('save_window_state', { state });
        } catch (error) {
            console.error('Failed to save initial window state:', error);
        }
    };

    const handleWindowStateChange = async (state: WindowState) => {
        try {
            // Update layout based on window state
            document.documentElement.classList.toggle('maximized', state.isMaximized);
            document.documentElement.classList.toggle('fullscreen', state.isFullscreen);
            
            // Save window state
            await invokeCommand('save_window_state', { state });
        } catch (error) {
            console.error('Failed to handle window state change:', error);
        }
    };

    const handleWindowSizeChange = async (size: { width: number; height: number }) => {
        try {
            // Handle window size changes
            await invokeCommand('save_window_size', { size });
        } catch (error) {
            console.error('Failed to handle window size change:', error);
        }
    };

    const handleWindowClose = async () => {
        try {
            // Perform any cleanup before closing
            await invokeCommand('prepare_for_close');
            return true; // Allow window to close
        } catch (error) {
            console.error('Failed to handle window close:', error);
            return false; // Prevent window from closing
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#121212]">
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Layout;