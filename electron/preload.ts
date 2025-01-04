// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of valid channels for security
const validChannels = [
    'dialog:open',
    'app:getDocumentDir',
    'command:execute',
    'command:abort',
    'media:getInfo',
    'window:minimize',
    'window:maximize',
    'window:close',
    'window:isMaximized'
];

// Validate channel before sending
const validateChannel = (channel: string): boolean => {
    return validChannels.includes(channel);
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: async (channel: string, data: any) => {
            if (validateChannel(channel)) {
                return await ipcRenderer.invoke(channel, data);
            }
            throw new Error(`Invalid channel: ${channel}`);
        },
        on: (channel: string, func: (...args: any[]) => void) => {
            if (validateChannel(channel)) {
                ipcRenderer.on(channel, (_event, ...args) => func(...args));
            }
        },
        once: (channel: string, func: (...args: any[]) => void) => {
            if (validateChannel(channel)) {
                ipcRenderer.once(channel, (_event, ...args) => func(...args));
            }
        }
    }
});