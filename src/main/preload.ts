import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
    openFile: (mode: 'local' | 'remote') =>
        ipcRenderer.invoke('main:openFile', mode),
    writeToClipboard: (text: string) =>
        ipcRenderer.invoke('main:writeToClipboard', text),
    closeFile: (fileId: string, mode: 'local' | 'remote') =>
        ipcRenderer.invoke('main:closeFile', fileId, mode),
    getMetadata: (fileId: string) =>
        ipcRenderer.invoke('read:getMetadata', fileId),
    getData: (fileId: string, start: number, length: number, query?: string) =>
        ipcRenderer.invoke(
            'read:getObservations',
            fileId,
            start,
            length,
            query
        ),
    ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]) {
            ipcRenderer.send(channel, args);
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args);
            ipcRenderer.on(channel, subscription);

            return () => ipcRenderer.removeListener(channel, subscription);
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
    },
});
