import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { BasicFilter, ColumnMetadata, ILocalStore } from 'interfaces/common';

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
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        ipcRenderer.invoke('main:fetch', input, init),
    isWindows: process.platform === 'win32',
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
