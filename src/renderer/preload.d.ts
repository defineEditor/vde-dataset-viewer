/* eslint-disable no-unused-vars */
import { Channels } from 'main/preload';
import {
    DatasetType,
    DatasetJsonMetadata,
    ItemDataArray,
    BasicFilter,
    ColumnMetadata,
    ILocalStore,
    ICheckUpdateResult,
    IFetchResponse,
} from 'interfaces/common';

declare global {
    interface Window {
        electron: {
            openFile: (
                mode: 'local' | 'remote',
                fileSettings?: {
                    encoding: BufferEncoding;
                    filePath?: string;
                    folderPath?: string;
                },
            ) => Promise<{
                fileId: string;
                type: DatasetType;
                path: string;
            } | null>;
            closeFile: (
                fileId: string,
                mode: 'local' | 'remote',
            ) => Promise<boolean>;
            getMetadata: (
                fileId: string,
            ) => Promise<DatasetJsonMetadata | null>;
            getData: (
                fileId: string,
                start: number,
                length: number,
                filterColumns?: string[],
                filterData?: BasicFilter,
                columns?: ColumnMetadata[],
            ) => Promise<ItemDataArray[] | null>;
            fetch: (
                input: RequestInfo | URL,
                init?: RequestInit,
            ) => Promise<IFetchResponse>;
            saveLocalStore: (localStore: ILocalStore) => void;
            loadLocalStore: () => Promise<ILocalStore>;
            onSaveStore: (callback: () => Promise<void>) => void;
            isWindows: boolean;
            checkForUpdates: () => Promise<ICheckUpdateResult>;
            downloadUpdate: () => Promise<boolean>;
            ipcRenderer: {
                sendMessage(channel: Channels, args: unknown[]): void;
                on(
                    channel: string,
                    func: (...args: unknown[]) => void,
                ): (() => void) | undefined;
                once(channel: string, func: (...args: unknown[]) => void): void;
            };
            writeToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

export {};
