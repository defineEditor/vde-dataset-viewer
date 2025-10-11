import {
    contextBridge,
    ipcRenderer,
    IpcRendererEvent,
    webUtils,
} from 'electron';
import { TaskProgress, NewWindowProps } from 'interfaces/common';
import { ElectronApi, Channels } from 'interfaces/electron.api';

const openFile: ElectronApi['openFile'] = (mode, fileSettings) =>
    ipcRenderer.invoke('main:openFile', mode, fileSettings);

const writeToClipboard: ElectronApi['writeToClipboard'] = (text) =>
    ipcRenderer.invoke('main:writeToClipboard', text);

const closeFile: ElectronApi['closeFile'] = (fileId, mode) =>
    ipcRenderer.invoke('main:closeFile', fileId, mode);

const getMetadata: ElectronApi['getMetadata'] = (fileId) =>
    ipcRenderer.invoke('read:getMetadata', fileId);

const getData: ElectronApi['getData'] = (
    fileId,
    start,
    length,
    filterColumns,
    filterData,
    columns,
) =>
    ipcRenderer.invoke(
        'read:getObservations',
        fileId,
        start,
        length,
        filterColumns,
        filterData,
        columns,
    );

const getUniqueValues: ElectronApi['getUniqueValues'] = (
    fileId,
    columnIds,
    limit,
    addCount,
) =>
    ipcRenderer.invoke(
        'read:getUniqueValues',
        fileId,
        columnIds,
        limit,
        addCount,
    );

const saveLocalStore: ElectronApi['saveLocalStore'] = (localStore) =>
    ipcRenderer.invoke('store:save', localStore);

const loadLocalStore: ElectronApi['loadLocalStore'] = () =>
    ipcRenderer.invoke('store:load');

const checkForUpdates: ElectronApi['checkForUpdates'] = () =>
    ipcRenderer.invoke('main:checkForUpdates');

const downloadUpdate: ElectronApi['downloadUpdate'] = () =>
    ipcRenderer.invoke('main:downloadUpdate');

const onSaveStore: ElectronApi['onSaveStore'] = (callback) => {
    ipcRenderer.on('renderer:saveStore', async () => {
        await callback();
        ipcRenderer.send('main:storeSaved');
    });
};

const onFileOpen: ElectronApi['onFileOpen'] = (callback) => {
    ipcRenderer.on(
        'renderer:openFile',
        (
            _event: IpcRendererEvent,
            filePath: string,
            props?: NewWindowProps,
        ) => {
            callback(filePath, props);
        },
    );
};

const removeFileOpenListener: ElectronApi['removeFileOpenListener'] = () => {
    ipcRenderer.removeAllListeners('renderer:openFile');
};

const pathForFile: ElectronApi['pathForFile'] = (file) =>
    webUtils.getPathForFile(file);

const fetch: ElectronApi['fetch'] = (input, init) =>
    ipcRenderer.invoke('main:fetch', input, init);

const openFileDialog: ElectronApi['openFileDialog'] = (options) =>
    ipcRenderer.invoke('main:openFileDialog', options);

const openDirectoryDialog: ElectronApi['openDirectoryDialog'] = (
    initialFolder,
) => ipcRenderer.invoke('main:openDirectoryDialog', initialFolder);

const getFilesInfo: ElectronApi['getFilesInfo'] = (filePaths) =>
    ipcRenderer.invoke('main:getFilesInfo', filePaths);

const deleteValidationReport: ElectronApi['deleteValidationReport'] = (
    fileName,
) => ipcRenderer.invoke('main:deleteValidationReport', fileName);

const compareValidationReports: ElectronApi['compareValidationReports'] = (
    fileNameBase,
    fileNameComp,
) =>
    ipcRenderer.invoke(
        'main:compareValidationReports',
        fileNameBase,
        fileNameComp,
    );

const showValidationLog: ElectronApi['showValidationLog'] = (logFileName) =>
    ipcRenderer.invoke('main:showValidationLog', logFileName);

const getValidationReport: ElectronApi['getValidationReport'] = (fileName) =>
    ipcRenderer.invoke('main:getValidationReport', fileName);

const downloadValidationReport: ElectronApi['downloadValidationReport'] = (
    fileName,
    initialFolder,
) =>
    ipcRenderer.invoke(
        'main:downloadValidationReport',
        fileName,
        initialFolder,
    );

const isWindows: ElectronApi['isWindows'] = process.platform === 'win32';

const startTask: ElectronApi['startTask'] = (task) =>
    ipcRenderer.invoke('main:startTask', task);

const onTaskProgress: ElectronApi['onTaskProgress'] = (callback) => {
    ipcRenderer.on(
        'renderer:taskProgress',
        async (_event: IpcRendererEvent, info: TaskProgress) => {
            callback(info);
        },
    );
};

const cleanTaskProgressListeners: ElectronApi['cleanTaskProgressListeners'] =
    () => {
        ipcRenderer.removeAllListeners('renderer:taskProgress');
    };

const getAppVersion: ElectronApi['getAppVersion'] = () =>
    ipcRenderer.invoke('main:getVersion');

const openInNewWindow: ElectronApi['openInNewWindow'] = (
    filePath,
    position,
    props,
) => ipcRenderer.invoke('main:openInNewWindow', filePath, position, props);

const resizeWindow: ElectronApi['resizeWindow'] = (position) =>
    ipcRenderer.invoke('main:resizeWindow', position);

const setZoom: ElectronApi['setZoom'] = (zoomLevel) =>
    ipcRenderer.invoke('main:setZoom', zoomLevel);

const getZoom: ElectronApi['getZoom'] = () =>
    ipcRenderer.invoke('main:getZoom');

contextBridge.exposeInMainWorld('electron', {
    openFile,
    writeToClipboard,
    closeFile,
    getMetadata,
    getData,
    getUniqueValues,
    saveLocalStore,
    loadLocalStore,
    checkForUpdates,
    downloadUpdate,
    onSaveStore,
    onFileOpen,
    removeFileOpenListener,
    pathForFile,
    fetch,
    openFileDialog,
    openDirectoryDialog,
    getFilesInfo,
    deleteValidationReport,
    compareValidationReports,
    showValidationLog,
    getValidationReport,
    downloadValidationReport,
    isWindows,
    startTask,
    onTaskProgress,
    cleanTaskProgressListeners,
    getAppVersion,
    openInNewWindow,
    resizeWindow,
    setZoom,
    getZoom,
    ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]) {
            ipcRenderer.send(channel, args);
        },
        on(channel: Channels, func: (..._args: unknown[]) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => ipcRenderer.removeListener(channel, subscription);
        },
        once(channel: Channels, func: (..._args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
    },
});
