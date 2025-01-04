// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Frameless window for custom titlebar
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#ffffff',
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173'); // Vite dev server URL
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// File dialog handler
ipcMain.handle('dialog:open', async (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return { canceled: true, filePaths: [] };

    try {
        const result = await dialog.showOpenDialog(window, {
            properties: ['openFile', 'multiSelections', ...options?.properties || []],
            filters: options?.filters || [],
            ...options
        });
        return result;
    } catch (error) {
        console.error('Failed to show open dialog:', error);
        return { canceled: true, filePaths: [] };
    }
});

// Document directory handler
ipcMain.handle('app:getDocumentDir', async (_event, options) => {
    try {
        const documentsPath = app.getPath('documents');
        if (options?.defaultPath) {
            return path.join(documentsPath, options.defaultPath);
        }
        return documentsPath;
    } catch (error) {
        console.error('Failed to get documents directory:', error);
        return '';
    }
});

// Command execution handler
ipcMain.handle('command:execute', async (_event, { command, args }) => {
    try {
        switch (command) {
            case 'media:getInfo':
                // Implement media info retrieval
                return {
                    duration: 0,
                    format: '',
                    bitrate: 0,
                    codec: '',
                    channels: 0,
                    sampleRate: 0,
                    // Add other media properties as needed
                };

            case 'app:getVersion':
                return app.getVersion();

            case 'app:getPlatform':
                return process.platform;

            case 'app:getPath':
                if (typeof args?.name === 'string') {
                    return app.getPath(args.name);
                }
                throw new Error('Invalid path name');

            default:
                throw new Error(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error(`Failed to execute command ${command}:`, error);
        throw error;
    }
});

// Command abortion handler
ipcMain.handle('command:abort', async (_event, { command }) => {
    console.log(`Aborting command: ${command}`);
    // Implement your abort logic here
    return { success: true };
});

// Window control handlers
ipcMain.handle('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.minimize();
        return true;
    }
    return false;
});

ipcMain.handle('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
        return true;
    }
    return false;
});

ipcMain.handle('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.close();
        return true;
    }
    return false;
});

ipcMain.handle('window:isMaximized', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window ? window.isMaximized() : false;
});

// Add any additional app-specific handlers
ipcMain.handle('app:darkMode', (_event) => {
    if (process.platform === 'darwin') {
        return nativeTheme.shouldUseDarkColors;
    }
    return false;
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Optional: Add auto-updater setup
// import { autoUpdater } from 'electron-updater';
// 
// autoUpdater.on('checking-for-update', () => {
//     // Handle checking for updates
// });
// 
// autoUpdater.on('update-available', (info) => {
//     // Handle update available
// });
// 
// autoUpdater.on('update-not-available', (info) => {
//     // Handle no update available
// });
// 
// autoUpdater.on('error', (err) => {
//     // Handle error in auto-updater
// });
// 
// autoUpdater.on('download-progress', (progressObj) => {
//     // Handle download progress
// });
// 
// autoUpdater.on('update-downloaded', (info) => {
//     // Handle update downloaded
// });

// Optional: Add deep linking
// app.on('open-url', (event, url) => {
//     event.preventDefault();
//     // Handle deep linking URL
// });

// Optional: Add system tray support
// import { Tray, Menu } from 'electron';
// let tray: Tray | null = null;
// 
// const createTray = () => {
//     tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
//     const contextMenu = Menu.buildFromTemplate([
//         { label: 'Show App', click: () => mainWindow?.show() },
//         { label: 'Quit', click: () => app.quit() }
//     ]);
//     tray.setContextMenu(contextMenu);
// };
// 
// app.whenReady().then(createTray);

export default app;
