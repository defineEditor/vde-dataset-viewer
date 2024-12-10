/* eslint-disable no-unused-vars */
import { Channels } from 'main/preload';
import {
    DatasetType,
    DatasetJsonMetadata,
    ItemDataArray,
} from 'interfaces/common';

declare global {
    interface Window {
        electron: {
            openFile: (mode: 'local' | 'remote') => Promise<{
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
                query?: string,
            ) => ItemDataArray[];
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
