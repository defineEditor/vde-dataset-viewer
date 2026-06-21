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
import FileManager from 'main/managers/fileManager';
import getMemoryInfo from 'renderer/utils/getMemoryInfo';

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

const getDeveloperInfo = async (fileManager: FileManager) => {
    // Get main process memory usage info
    const mainInfo = await getMemoryInfo('main');
    // Watchers info
    const watchersInfo = fileManager.getWatcherStats();
    return { ...mainInfo, ...watchersInfo };
};

// Parse command line arguments
const parseArgs = (
    args: string[],
    isPackaged: boolean,
): {
    filePath: string | null;
    compareFiles: { path1: string; path2: string } | null;
    disableGpu: boolean | null;
    userDataDir: string | null;
} => {
    const startIdx = isPackaged ? 1 : 2;
    const optionArgIdxs: number[] = [];
    let filePath: string | null = null;
    let compareFiles: { path1: string; path2: string } | null = null;
    let userDataDir: string | null = null;
    let disableGpu: boolean | null = null;

    // Check for --disable-gpu
    const disableGpuIdx = args.indexOf('--disable-gpu');
    if (disableGpuIdx !== -1) {
        optionArgIdxs.push(disableGpuIdx);
        disableGpu = true;
    }

    // Check for --user-data-dir
    const userDataIdx = args.findIndex(
        (a) => a.startsWith('--user-data-dir=') || a === '--user-data-dir',
    );
    if (userDataIdx !== -1) {
        optionArgIdxs.push(userDataIdx);
        const arg = args[userDataIdx];
        const eqIdx = arg.indexOf('=');
        if (eqIdx !== -1) {
            userDataDir = arg.slice(eqIdx + 1);
        } else if (args.length > userDataIdx + 1) {
            optionArgIdxs.push(userDataIdx + 1);
            userDataDir = args[userDataIdx + 1];
        }
    }

    // Check for --compare
    const compareIndex = args.indexOf('--compare');
    if (compareIndex !== -1 && args.length > compareIndex + 2) {
        optionArgIdxs.push(compareIndex);
        // Skip parameter arguments
        for (
            let i = compareIndex + 1;
            i < args.length && compareFiles === null;
            i++
        ) {
            // Skip parameter arguments
            if (
                !args[i].startsWith('-') &&
                args[i + 1] &&
                !args[i + 1].startsWith('-') &&
                !optionArgIdxs.includes(i) &&
                !optionArgIdxs.includes(i + 1)
            ) {
                compareFiles = {
                    path1: args[i],
                    path2: args[i + 1],
                };
            }
        }
    } else if (args.length > startIdx) {
        for (let i = startIdx; i < args.length && filePath === null; i++) {
            // Skip parameter arguments
            if (!args[i].startsWith('-') && !optionArgIdxs.includes(i)) {
                filePath = args[i];
            }
        }
    }

    return { filePath, compareFiles, disableGpu, userDataDir };
};

export {
    writeToClipboard,
    resolveHtmlPath,
    resizeWindow,
    getDeveloperInfo,
    parseArgs,
};
