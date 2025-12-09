/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    IpcMainInvokeEvent,
} from 'electron';
import StoreManager from 'main/managers/storeManager';
import { resolveHtmlPath, writeToClipboard, resizeWindow } from 'main/util';
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import { checkForUpdates, downloadUpdate } from 'main/appUpdate';
import FileManager from 'main/managers/fileManager';
import NetManager from 'main/managers/netManager';
import TaskManager from 'main/managers/taskManager';
import ReportManager from 'main/managers/reportManager';
import DefineXmlManager from 'main/managers/defineXmlManager';
import { MainTask, NewWindowProps } from 'interfaces/main';

let mainWindow: BrowserWindow | null = null;
let fileToOpen: string | null = null;
const openedWindows = new Set<BrowserWindow>();

// Get file path from command line arguments
function getFilePathFromArgs(args: string[]): string | null {
    // Skip the first arg on packaged apps (it's the app path)
    const startIdx = app.isPackaged ? 1 : 2;

    for (let i = startIdx; i < args.length; i++) {
        const arg = args[i];
        // Check if this arg is a file path that exists
        if (arg && !arg.startsWith('-')) {
            return arg;
        }
    }
    return null;
}

// Store command line arguments for later use
fileToOpen = getFilePathFromArgs(process.argv);

// Handle file opening from "Open With" on start
const gotTheLock = app.requestSingleInstanceLock();

const reportsDirectory = path.join(
    app.getPath('userData'),
    'validationReports',
);

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine) => {
        // In case the second instance is opened, focus the current window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Check for file paths in command line arguments
            const filePath = getFilePathFromArgs(commandLine);
            if (filePath) {
                mainWindow.webContents.send('renderer:openFile', filePath);
            }
        }
    });

    // Handle file opening when app is already running
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        if (mainWindow) {
            mainWindow.webContents.send('renderer:openFile', filePath);
        } else {
            fileToOpen = filePath;
        }
    });
}

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
    require('electron-debug')();
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

app.whenReady()
    .then(async () => {
        if (isDebug) {
            try {
                const [redux, react] = await installExtension([
                    REDUX_DEVTOOLS,
                    REACT_DEVELOPER_TOOLS,
                ]);
                console.log(`Added Extensions:  ${redux.name}, ${react.name}`);
            } catch (err) {
                console.log('An error occurred: ', err);
            }
        }
    })
    .catch((err) => {
        console.log('An error occurred: ', err);
    });

const createWindow = async (
    filePath?: string | null,
    position?: 'top' | 'bottom' | 'left' | 'right',
    props?: NewWindowProps,
): Promise<BrowserWindow | null> => {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };

    let newWindow: BrowserWindow | null = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    openedWindows.add(newWindow);

    newWindow.loadURL(resolveHtmlPath('index.html'));

    newWindow.on('ready-to-show', () => {
        if (!newWindow) {
            throw new Error('"newWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            newWindow.minimize();
        } else if (position) {
            resizeWindow(position, newWindow.webContents);
            newWindow.showInactive();
        } else {
            newWindow.maximize();
            newWindow.showInactive();
        }

        // Open file if one was provided
        if (filePath) {
            newWindow.webContents.send('renderer:openFile', filePath, props);
        }
    });

    newWindow.on('close', async (event) => {
        event.preventDefault();
        if (newWindow && newWindow === mainWindow) {
            ipcMain.once('main:storeSaved', () => {
                if (newWindow) {
                    newWindow.destroy();
                }
            });
            newWindow.webContents.send('renderer:saveStore');
        } else if (newWindow) {
            newWindow.destroy();
        }
    });

    newWindow.on('closed', () => {
        if (newWindow) {
            openedWindows.delete(newWindow);
            if (mainWindow === newWindow) {
                // Set next window as main if available
                const nextWindow = openedWindows.values().next().value || null;
                mainWindow = nextWindow || null;
            }
            newWindow = null;
        }
    });

    // Open urls in the user's browser
    newWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    return newWindow;
};

// Function to handle opening dataset in new window
const handleOpenInNewWindow = async (
    _event: IpcMainInvokeEvent,
    filePath: string,
    position?: 'top' | 'bottom' | 'left' | 'right',
    props?: NewWindowProps,
): Promise<void> => {
    createWindow(filePath, position, props);
};

// Function to handle resizing and positioning the current window
const handleResizeWindow = async (
    event: IpcMainInvokeEvent,
    position: 'top' | 'bottom' | 'left' | 'right',
): Promise<void> => {
    if (!event.sender) {
        return Promise.resolve();
    }
    return resizeWindow(position, event.sender);
};

// Function to handle zoom level setting
const handleSetZoom = async (
    event: IpcMainInvokeEvent,
    zoomLevel: number,
): Promise<void> => {
    if (!event.sender) {
        return Promise.resolve();
    }
    event.sender.setZoomLevel(zoomLevel);
    return Promise.resolve();
};

// Function to handle getting current zoom level
const handleGetZoom = async (event: IpcMainInvokeEvent): Promise<number> => {
    if (!event.sender) {
        return Promise.resolve(0);
    }
    return event.sender.getZoomLevel();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady()
    .then(async () => {
        const fileManager = new FileManager();
        const storeManager = new StoreManager();
        const netManager = new NetManager();
        const reportManager = new ReportManager(reportsDirectory);
        const taskManager = new TaskManager({ reportsDirectory });
        const defineXmlManager = new DefineXmlManager();
        ipcMain.handle('main:openFile', fileManager.handleFileOpen);
        ipcMain.handle('main:fetch', netManager.fetch);
        ipcMain.handle('main:closeFile', fileManager.handleFileClose);
        ipcMain.handle('main:writeToClipboard', writeToClipboard);
        ipcMain.handle('main:checkForUpdates', checkForUpdates);
        ipcMain.handle('main:downloadUpdate', downloadUpdate);
        ipcMain.handle('main:openInNewWindow', handleOpenInNewWindow);
        ipcMain.handle('main:resizeWindow', handleResizeWindow);
        ipcMain.handle('main:setZoom', handleSetZoom);
        ipcMain.handle('main:getZoom', handleGetZoom);
        ipcMain.handle(
            'main:deleteValidationReport',
            reportManager.deleteValidationReport,
        );
        ipcMain.handle(
            'main:getValidationReport',
            reportManager.getValidationReport,
        );
        ipcMain.handle(
            'main:downloadValidationReport',
            reportManager.downloadValidationReport,
        );
        ipcMain.handle(
            'main:compareValidationReports',
            reportManager.compareValidationReports,
        );
        ipcMain.handle(
            'main:showValidationLog',
            reportManager.showValidationLog,
        );
        ipcMain.handle('read:getMetadata', fileManager.handleGetMetadata);
        ipcMain.handle(
            'read:getObservations',
            fileManager.handleGetObservations,
        );
        ipcMain.handle(
            'read:getUniqueValues',
            fileManager.handleGetUniqueValues,
        );
        ipcMain.handle('store:save', storeManager.save);
        ipcMain.handle('store:load', storeManager.load);
        ipcMain.handle('main:openFileDialog', fileManager.openFileDialog);
        ipcMain.handle(
            'main:openDirectoryDialog',
            fileManager.openDirectoryDialog,
        );
        ipcMain.handle('main:getFilesInfo', fileManager.getFilesInfo);
        ipcMain.handle('main:openDefineXml', defineXmlManager.openDefineXml);
        ipcMain.handle(
            'main:getDefineXmlContent',
            defineXmlManager.getDefineXmlContent,
        );
        ipcMain.handle('main:closeDefineXml', defineXmlManager.closeDefineXml);
        ipcMain.handle(
            'main:startTask',
            (event: IpcMainInvokeEvent, task: MainTask) => {
                if (!event.sender) {
                    return Promise.resolve(false);
                }
                return taskManager.handleTask(task, event.sender);
            },
        );
        ipcMain.handle('main:getVersion', (_event: IpcMainInvokeEvent) => {
            return app.getVersion();
        });
        ipcMain.handle('main:openInDefaultApplication', (_event, filePath) => {
            // If it is PDF file, open in a new window within the app
            if (
                filePath
                    .replace(/(.*)(#.*$)/, '$1')
                    .toLowerCase()
                    .endsWith('.pdf')
            ) {
                const newWindow: BrowserWindow | null = new BrowserWindow({
                    show: false,
                    autoHideMenuBar: true,
                });

                openedWindows.add(newWindow);

                newWindow.loadURL(`file://${filePath}`);
                newWindow.on('ready-to-show', () => {
                    if (!newWindow) {
                        throw new Error('"newWindow" is not defined');
                    }
                    newWindow.maximize();
                    newWindow.showInactive();
                });
                return '';
            }
            return shell.openPath(filePath);
        });
        ipcMain.handle('main:searchInPage', (_event, searchTerm) => {
            if (_event.sender) {
                _event.sender.findInPage(searchTerm);
            }
        });
        ipcMain.handle('main:searchInPageNext', (_event, searchTerm) => {
            if (_event.sender) {
                _event.sender.findInPage(searchTerm, {
                    forward: true,
                    findNext: true,
                });
            }
        });
        ipcMain.handle('main:searchInPagePrevious', (_event, searchTerm) => {
            if (_event.sender) {
                _event.sender.findInPage(searchTerm, {
                    forward: false,
                    findNext: true,
                });
            }
        });
        ipcMain.handle('main:clearSearchResults', (_event) => {
            if (_event.sender) {
                _event.sender.stopFindInPage('clearSelection');
            }
        });
        mainWindow = await createWindow(fileToOpen);
        app.on('activate', async () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) {
                mainWindow = await createWindow(fileToOpen);
            }
        });
    })
    .catch(console.log);
