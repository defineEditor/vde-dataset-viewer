/* eslint-disable no-unused-vars */
import { Channels } from 'main/preload';
import {
    DatasetType,
    DatasetJsonMetadata,
    ItemDataArray,
    Filter,
    ILocalStore,
} from 'interfaces/common';

declare global {
    interface Window {
        electron: {
            openFile: (
                mode: 'local' | 'remote',
                fileSettings?: { encoding: BufferEncoding },
            ) => Promise<{
                fileId: string;
                type: DatasetType;
                path: string;
            } | null>;
            closeFile: (
                fileId: string,
                mode: 'local' | 'remote',
            ) => Promise<boolean>;
            getMetadata: (fileId: string) => DatasetJsonMetadata;
            getData: (
                fileId: string,
                start: number,
                length: number,
                filterColumns?: string[],
                filterData?: Filter,
            ) => ItemDataArray[];
            saveLocalStore: (localStore: ILocalStore) => void;
            loadLocalStore: () => Promise<ILocalStore>;
            onSaveStore: (callback: () => Promise<void>) => void;
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
