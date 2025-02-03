/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    IpcMainInvokeEvent,
} from 'electron';
import StoreManager from 'main/storeManager';
import { resolveHtmlPath, writeToClipboard } from 'main/util';
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import { checkForUpdates, downloadUpdate } from 'main/appUpdate';
import FileManager from 'main/fileManager';
import NetManager from 'main/netManager';
import TaskManager from 'main/taskManager';
import { MainTask } from 'interfaces/main';

let mainWindow: BrowserWindow | null = null;

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

const createWindow = async () => {
    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: false,
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.maximize();
            mainWindow.showInactive();
        }
    });

    mainWindow.on('close', async (event) => {
        event.preventDefault();
        if (mainWindow) {
            ipcMain.once('main:storeSaved', () => {
                if (mainWindow) {
                    mainWindow.destroy();
                }
            });
            mainWindow.webContents.send('renderer:saveStore');
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });
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
    .then(() => {
        const fileManager = new FileManager();
        const storeManager = new StoreManager();
        const netManager = new NetManager();
        const taskManager = new TaskManager();
        ipcMain.handle('main:openFile', fileManager.handleFileOpen);
        ipcMain.handle('main:fetch', netManager.fetch);
        ipcMain.handle('main:closeFile', fileManager.handleFileClose);
        ipcMain.handle('main:writeToClipboard', writeToClipboard);
        ipcMain.handle('main:checkForUpdates', checkForUpdates);
        ipcMain.handle('main:downloadUpdate', downloadUpdate);
        ipcMain.handle('read:getMetadata', fileManager.handleGetMetadata);
        ipcMain.handle(
            'read:getObservations',
            fileManager.handleGetObservations,
        );
        ipcMain.handle('store:save', storeManager.save);
        ipcMain.handle('store:load', storeManager.load);
        ipcMain.handle('main:openFileDialog', fileManager.openFileDialog);
        ipcMain.handle(
            'main:openDirectoryDialog',
            fileManager.openDirectoryDialog,
        );
        ipcMain.handle(
            'main:startTask',
            (_event: IpcMainInvokeEvent, task: MainTask) => {
                if (mainWindow === null) {
                    return Promise.resolve(false);
                }
                return taskManager.handleTask(task, mainWindow);
            },
        );
        ipcMain.handle('main:getVersion', (_event: IpcMainInvokeEvent) => {
            return app.getVersion();
        });
        createWindow();
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow();
        });
    })
    .catch(console.log);
