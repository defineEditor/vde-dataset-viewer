/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import {
    clipboard,
    IpcMainInvokeEvent,
    screen,
    BrowserWindow,
    WebContents,
} from 'electron';
import path from 'path';

const resolveHtmlPath = (htmlFileName: string) => {
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || 1212;
        const url = new URL(`http://localhost:${port}`);
        url.pathname = htmlFileName;
        return url.href;
    }
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
};

const writeToClipboard = (_event: IpcMainInvokeEvent, text: string) => {
    clipboard.writeText(text);
    return true;
};

// Function to resize window to half screen and position it
const resizeWindow = (
    position: 'top' | 'bottom' | 'left' | 'right',
    webContents: WebContents,
): Promise<void> => {
    return new Promise((resolve) => {
        const window = BrowserWindow.fromWebContents(webContents);
        if (!window) {
            resolve();
            return;
        }

        const display = screen.getPrimaryDisplay();
        const { workArea } = display;

        let bounds: { x: number; y: number; width: number; height: number };

        switch (position) {
            case 'top':
                bounds = {
                    x: workArea.x,
                    y: workArea.y,
                    width: workArea.width,
                    height: Math.floor(workArea.height / 2),
                };
                break;
            case 'bottom':
                bounds = {
                    x: workArea.x,
                    y: workArea.y + Math.floor(workArea.height / 2),
                    width: workArea.width,
                    height: Math.floor(workArea.height / 2),
                };
                break;
            case 'left':
                bounds = {
                    x: workArea.x,
                    y: workArea.y,
                    width: Math.floor(workArea.width / 2),
                    height: workArea.height,
                };
                break;
            case 'right':
                bounds = {
                    x: workArea.x + Math.floor(workArea.width / 2),
                    y: workArea.y,
                    width: Math.floor(workArea.width / 2),
                    height: workArea.height,
                };
                break;
            default:
                resolve();
                return;
        }

        // If window is maximized, restore it first
        if (window.isMaximized()) {
            window.restore();
        }
        window.setBounds(bounds);
        resolve();
    });
};

export { writeToClipboard, resolveHtmlPath, resizeWindow };
