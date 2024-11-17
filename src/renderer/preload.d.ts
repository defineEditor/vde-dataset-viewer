import DatasetJson from 'js-stream-dataset-json';
import { Channels } from 'main/preload';

declare global {
    interface Window {
        electron: {
            openFile: (mode: 'local' | 'remote') => Promise<string>;
            closeFile: (
                fileId: string,
                mode: 'local' | 'remote'
            ) => Promise<boolean>;
            getMetadata: (
                fileId: string
            ) => ReturnType<InstanceType<typeof DatasetJson>['getMetadata']>;
            getData: (
                fileId: string,
                start: number,
                length: number,
                query?: string
            ) => ReturnType<InstanceType<typeof DatasetJson>['getData']>;
            ipcRenderer: {
                sendMessage(channel: Channels, args: unknown[]): void;
                on(
                    channel: string,
                    func: (...args: unknown[]) => void
                ): (() => void) | undefined;
                once(channel: string, func: (...args: unknown[]) => void): void;
            };
        };
    }
}

export {};
