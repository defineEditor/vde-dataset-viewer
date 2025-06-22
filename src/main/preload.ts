import {
    contextBridge,
    ipcRenderer,
    IpcRendererEvent,
    webUtils,
} from 'electron';
import {
    BasicFilter,
    ColumnMetadata,
    ILocalStore,
    FileInfo,
    MainTask,
    TableRowValue,
    TaskProgress,
} from 'interfaces/common';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
    openFile: (
        mode: 'local' | 'remote',
        fileSettings: {
            encoding: BufferEncoding;
            filePath?: string;
            folderPath?: string;
        } = { encoding: 'utf8' },
    ) => ipcRenderer.invoke('main:openFile', mode, fileSettings),
    writeToClipboard: (text: string) =>
        ipcRenderer.invoke('main:writeToClipboard', text),
    closeFile: (fileId: string, mode: 'local' | 'remote') =>
        ipcRenderer.invoke('main:closeFile', fileId, mode),
    getMetadata: (fileId: string) =>
        ipcRenderer.invoke('read:getMetadata', fileId),
    getData: (
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: BasicFilter,
        columns?: ColumnMetadata[],
    ) =>
        ipcRenderer.invoke(
            'read:getObservations',
            fileId,
            start,
            length,
            filterColumns,
            filterData,
            columns,
        ),
    getUniqueValues: (
        fileId: string,
        columnIds: string[],
        limit?: number,
        addCount?: boolean,
    ): Promise<{
        [columnId: string]: {
            values: TableRowValue[];
            counts: { [name: string]: number };
        };
    } | null> => {
        return ipcRenderer.invoke(
            'read:getUniqueValues',
            fileId,
            columnIds,
            limit,
            addCount,
        );
    },
    saveLocalStore: (localStore: ILocalStore) =>
        ipcRenderer.invoke('store:save', localStore),
    loadLocalStore: (): Promise<ILocalStore> =>
        ipcRenderer.invoke('store:load'),
    checkForUpdates: () => ipcRenderer.invoke('main:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('main:downloadUpdate'),
    onSaveStore: (callback: () => Promise<void>) => {
        ipcRenderer.on('renderer:saveStore', async () => {
            await callback();
            ipcRenderer.send('main:storeSaved');
        });
    },
    onFileOpen: (callback: (filePath: string) => void) => {
        ipcRenderer.on(
            'renderer:openFile',
            (_event: IpcRendererEvent, filePath: string) => {
                callback(filePath);
            },
        );
    },
    removeFileOpenListener: () => {
        ipcRenderer.removeAllListeners('renderer:openFile');
    },
    pathForFile: (file: File) => webUtils.getPathForFile(file),
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        ipcRenderer.invoke('main:fetch', input, init),
    openFileDialog: (options: {
        multiple?: boolean;
        initialFolder?: string;
        filters?: { name: string; extensions: string[] }[];
    }): Promise<FileInfo[] | null> =>
        ipcRenderer.invoke('main:openFileDialog', options),
    openDirectoryDialog: (
        initialFolder: string | null,
    ): Promise<string | null> =>
        ipcRenderer.invoke('main:openDirectoryDialog', initialFolder),
    isWindows: process.platform === 'win32',
    startTask: (task: MainTask) => ipcRenderer.invoke('main:startTask', task),
    onTaskProgress: (callback: (info: TaskProgress) => void) => {
        ipcRenderer.on(
            'renderer:taskProgress',
            async (_event: IpcRendererEvent, info: TaskProgress) => {
                callback(info);
            },
        );
    },
    cleanTaskProgressListeners: () => {
        ipcRenderer.removeAllListeners('renderer:taskProgress');
    },
    getAppVersion: () => ipcRenderer.invoke('main:getVersion'),
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
