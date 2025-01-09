// electron/main.ts
import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import * as path from 'path';
import * as si from 'systeminformation';
import checkDiskSpace from 'check-disk-space';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createNativeMenu } from './menu';
const execAsync = promisify(exec);

// Development mode check
const isDev = process.env.NODE_ENV === 'development';

// Custom logger
const logger = {
    debug: (...args: any[]) => isDev && console.debug('[Debug]', ...args),
    info: (...args: any[]) => console.log('[Info]', ...args),
    warn: (...args: any[]) => console.warn('[Warn]', ...args),
    error: (...args: any[]) => console.error('[Error]', ...args)
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Interfaces
interface SystemStats {
    drives: DriveInfo[];
    network: NetworkSpeed;
    counts: {
        downloads: number;
        queue: number;
        completed: number;
    };
}

interface DriveInfo {
    name: string;
    mount_point: string;
    total_space: number;
    free_space: number;
    available_space: number;
    drive_type: string;
}

interface NetworkSpeed {
    download: number;
    upload: number;
    timestamp: number;
}

// Global variables
let mainWindow: BrowserWindow | null = null;
let lastNetworkStats: {
    rx_bytes: number;
    tx_bytes: number;
    timestamp: number;
} | null = null;
const subscribers = new Map<number, NodeJS.Timeout>();
let subscriberId = 0;

// Cache management
let cachedStats: SystemStats | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
const ERROR_COOLDOWN = 5000; // 5 seconds


interface CachedDriveInfo {
    drives: DriveInfo[];
    timestamp: number;
}

// Add these to your global variables
let cachedDrives: CachedDriveInfo | null = null;
const DRIVE_CACHE_DURATION = 10000; // 10 seconds for drive info

// Helper functions
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

async function getDriveInfo(): Promise<DriveInfo[]> {
    const drives: DriveInfo[] = [];
    
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execAsync('powershell -command "Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, DriveType | ConvertTo-Json"')
                .catch(() => ({ stdout: '[]' }));  // Fallback to empty array on error
            
            let driveList;
            try {
                driveList = JSON.parse(stdout.trim());
            } catch {
                driveList = [];
            }
            
            // Handle both single drive and multiple drives
            const drivesToProcess = Array.isArray(driveList) ? driveList : [driveList];
            
            for (const drive of drivesToProcess) {
                if (drive?.DeviceID) {
                    try {
                        const diskSpace = await checkDiskSpace(drive.DeviceID + '\\');
                        if (diskSpace) {
                            drives.push({
                                name: drive.DeviceID,
                                mount_point: drive.DeviceID + '\\',
                                total_space: diskSpace.size,
                                free_space: diskSpace.free,
                                available_space: diskSpace.free,
                                drive_type: getDriveType(drive.DriveType)
                            });
                        }
                    } catch (error) {
                        logger.debug(`Skip drive ${drive.DeviceID}:`, error);
                    }
                }
            }
        } else {
            // Existing macOS/Linux code remains the same
            // but returns early if no drives are found
            if (drives.length === 0 && cachedDrives) {
                return cachedDrives.drives;
            }
        }
    } catch (error) {
        logger.error('Error getting drive info:', error);
        // Return cached drives if available
        if (cachedDrives) {
            return cachedDrives.drives;
        }
    }

    return drives;
}


// Helper function to convert Windows drive types to human-readable format
function getDriveType(type: number): string {
    const driveTypes: { [key: number]: string } = {
        0: 'unknown',
        1: 'no_root_dir',
        2: 'removable',
        3: 'fixed',
        4: 'remote',
        5: 'cdrom',
        6: 'ramdisk'
    };
    return driveTypes[type] || 'unknown';
}

async function getNetworkSpeed(): Promise<NetworkSpeed> {
    try {
        const networkStats = await si.networkStats();
        const now = Date.now();
        let download = 0;
        let upload = 0;

        if (networkStats.length > 0) {
            const totalRx = networkStats.reduce((sum, iface) => sum + iface.rx_bytes, 0);
            const totalTx = networkStats.reduce((sum, iface) => sum + iface.tx_bytes, 0);

            if (lastNetworkStats) {
                const timeDiff = (now - lastNetworkStats.timestamp) / 1000;
                if (timeDiff > 0) {
                    download = (totalRx - lastNetworkStats.rx_bytes) / (1024 * 1024 * timeDiff);
                    upload = (totalTx - lastNetworkStats.tx_bytes) / (1024 * 1024 * timeDiff);
                }
            }

            lastNetworkStats = { rx_bytes: totalRx, tx_bytes: totalTx, timestamp: now };
        }

        return {
            download: Math.max(0, Math.min(download, 1000)), // Cap at 1000 MB/s
            upload: Math.max(0, Math.min(upload, 1000)),
            timestamp: now
        };
    } catch (error) {
        logger.debug('Network stats error:', error);
        return { download: 0, upload: 0, timestamp: Date.now() };
    }
}

async function getSystemStats(): Promise<SystemStats> {
    try {
        const now = Date.now();
        let drives: DriveInfo[] = [];

        // Use cached drives if available and not expired
        if (cachedDrives && (now - cachedDrives.timestamp < DRIVE_CACHE_DURATION)) {
            drives = cachedDrives.drives;
        } else {
            // If cached stats exist, use them while fetching new drive info
            if (cachedStats) {
                drives = cachedStats.drives;
            }
            
            // Get new drive info in the background
            getDriveInfo().then(newDrives => {
                if (newDrives.length > 0) {  // Only update if we got valid drives
                    cachedDrives = {
                        drives: newDrives,
                        timestamp: Date.now()
                    };
                    // If we have a cached stats object, update its drives
                    if (cachedStats) {
                        cachedStats.drives = newDrives;
                    }
                }
            }).catch(error => {
                logger.error('Background drive info update failed:', error);
            });
        }

        // Get network stats
        const network = await getNetworkSpeed();

        // Reset error counter on success
        consecutiveErrors = 0;

        // Create new stats object
        const newStats: SystemStats = {
            drives: drives,
            network,
            counts: {
                downloads: 0,
                queue: 0,
                completed: 0
            }
        };

        // Update cache
        cachedStats = newStats;

        return newStats;
    } catch (error) {
        consecutiveErrors++;
        logger.error(`System stats error (${consecutiveErrors}):`, error);

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            await new Promise(resolve => setTimeout(resolve, ERROR_COOLDOWN));
            consecutiveErrors = 0;
        }

        // Return cached stats if available, otherwise return empty stats
        return cachedStats || {
            drives: [],
            network: { download: 0, upload: 0, timestamp: Date.now() },
            counts: { downloads: 0, queue: 0, completed: 0 }
        };
    }
}

// Modified subscription function with smoother updates
function subscribeToSystemStats(window: BrowserWindow, interval: number = 5000): number {
    const id = subscriberId++;
    
    const sendUpdate = debounce(async () => {
        try {
            if (!window.isDestroyed()) {
                const stats = await getSystemStats();
                window.webContents.send('system-stats-update', { id, stats });
            }
        } catch (error) {
            if (!window.isDestroyed()) {
                logger.error('Failed to send system stats:', error);
                // Don't send error to frontend, use cached data instead
                if (cachedStats) {
                    window.webContents.send('system-stats-update', { 
                        id, 
                        stats: cachedStats 
                    });
                }
            }
        }
    }, 100);

    const timer = setInterval(sendUpdate, Math.max(2000, interval));
    subscribers.set(id, timer);
    
    // Send initial stats
    sendUpdate();
    return id;
}

function unsubscribeFromSystemStats(id: number): boolean {
    const timer = subscribers.get(id);
    if (timer) {
        clearInterval(timer);
        subscribers.delete(id);
        return true;
    }
    return false;
}

// Window management
const createWindow = (): void => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#ffffff',
            height: 48
        },
        backgroundColor: '#0C0C0E',
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// App lifecycle handlers
app.whenReady().then(() => {
    // Create native menu before creating the window
    if (process.platform === 'darwin') {
      createNativeMenu();
    }
    createWindow();
  });

app.on('window-all-closed', () => {
    subscribers.forEach((timer) => clearInterval(timer));
    subscribers.clear();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('dialog:open', async (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return { canceled: true, filePaths: [] };

    try {
        return await dialog.showOpenDialog(window, {
            properties: ['openFile', 'multiSelections', ...options?.properties || []],
            filters: options?.filters || [],
            ...options
        });
    } catch (error) {
        logger.error('Failed to show open dialog:', error);
        return { canceled: true, filePaths: [] };
    }
});

ipcMain.handle('app:getDocumentDir', async (_event, options) => {
    try {
        const documentsPath = app.getPath('documents');
        return options?.defaultPath 
            ? path.join(documentsPath, options.defaultPath)
            : documentsPath;
    } catch (error) {
        logger.error('Failed to get documents directory:', error);
        return '';
    }
});

ipcMain.handle('command:execute', async (event, { command, args }) => {
    try {
        switch (command) {
            case 'media:getInfo':
                return {
                    duration: 0,
                    format: '',
                    bitrate: 0,
                    codec: '',
                    channels: 0,
                    sampleRate: 0,
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

            case 'get_system_stats':
                return await getSystemStats();

            case 'subscribe_to_system_stats':
                const window = BrowserWindow.fromWebContents(event.sender);
                if (!window) throw new Error('No window found');
                return subscribeToSystemStats(window, args?.interval);

            case 'unsubscribe_from_system_stats':
                if (typeof args?.id !== 'number') {
                    throw new Error('Invalid subscription ID');
                }
                return unsubscribeFromSystemStats(args.id);

            default:
                throw new Error(`Unknown command: ${command}`);
        }
    } catch (error) {
        logger.error(`Failed to execute command ${command}:`, error);
        throw error;
    }
});

ipcMain.handle('command:abort', async (_event, { command }) => {
    logger.info(`Aborting command: ${command}`);
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

ipcMain.handle('app:darkMode', (_event) => {
    return process.platform === 'darwin' ? nativeTheme.shouldUseDarkColors : false;
});

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

export default app;