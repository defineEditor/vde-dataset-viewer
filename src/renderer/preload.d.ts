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
    FileInfo,
    MainTask,
    TableRowValue,
    TaskProgress,
} from 'interfaces/common';

declare global {
    interface Window {
        electron: {
            openFile: (
                mode: 'local' | 'remote',
                fileSettings?: {
                    encoding: BufferEncoding | 'default';
                    filePath?: string;
                    folderPath?: string;
                },
            ) => Promise<{
                fileId: string;
                type: DatasetType;
                path: string;
                lastModified: number;
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
            getUniqueValues: (
                fileId: string,
                columnIds: string[],
                limit?: number,
                addCount?: boolean,
            ) => Promise<{
                [columnId: string]: {
                    values: TableRowValue[];
                    counts: { [name: string]: number };
                };
            } | null>;
            pathForFile: (file: File) => string;
            fetch: (
                input: RequestInfo | URL,
                init?: RequestInit,
            ) => Promise<IFetchResponse>;
            saveLocalStore: (localStore: ILocalStore) => void;
            loadLocalStore: () => Promise<ILocalStore>;
            onSaveStore: (callback: () => Promise<void>) => void;
            onFileOpen: (callback: (filePath: string) => void) => void;
            removeFileOpenListener: () => void;
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
            startTask: (task: MainTask) => Promise<boolean | { error: string }>;
            onTaskProgress: (callback: (info: TaskProgress) => void) => void;
            cleanTaskProgressListeners: () => void;
            openFileDialog: (options: {
                multiple?: boolean;
                initialFolder?: string;
                filters?: { name: string; extensions: string[] }[];
            }) => Promise<FileInfo[] | null>;
            openDirectoryDialog: (
                initialFolder: string | null,
            ) => Promise<string>;
            deleteValidationReport: (fileName: string) => Promise<boolean>;
            getAppVersion: () => Promise<string>;
            isWindows: boolean;
        };
    }
}

export {};
