import {
    DataType,
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
    ParsedValidationReport,
    ValidationReportCompare,
    NewWindowProps,
} from 'interfaces/common';

export type Channels = 'ipc-vde';

export interface ElectronApi {
    openFile: (
        mode: 'local' | 'remote',
        fileSettings?: {
            encoding: BufferEncoding | 'default';
            filePath?: string;
            folderPath?: string;
        },
    ) => Promise<{
        fileId: string;
        type: DataType;
        path: string;
        lastModified: number;
    } | null>;
    closeFile: (fileId: string, mode: 'local' | 'remote') => Promise<boolean>;
    getMetadata: (fileId: string) => Promise<DatasetJsonMetadata | null>;
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
    onFileOpen: (
        callback: (filePath: string, props?: NewWindowProps) => void,
    ) => void;
    removeFileOpenListener: () => void;
    checkForUpdates: () => Promise<ICheckUpdateResult>;
    downloadUpdate: () => Promise<boolean>;
    writeToClipboard: (text: string) => Promise<boolean>;
    startTask: (task: MainTask) => Promise<boolean | { error: string }>;
    onTaskProgress: (callback: (info: TaskProgress) => void) => void;
    cleanTaskProgressListeners: () => void;
    openFileDialog: (options: {
        multiple?: boolean;
        initialFolder?: string;
        filters?: { name: string; extensions: string[] }[];
    }) => Promise<FileInfo[] | null>;
    openDirectoryDialog: (initialFolder: string | null) => Promise<string>;
    getFilesInfo: (filePaths: string[]) => Promise<FileInfo[]>;
    deleteValidationReport: (fileName: string) => Promise<boolean>;
    getValidationReport: (
        fileName: string,
    ) => Promise<ParsedValidationReport | null>;
    downloadValidationReport: (
        fileName: string,
        initialFolder?: string,
    ) => Promise<string | false>;
    compareValidationReports: (
        fileNameBase: string,
        fileNameComp: string,
    ) => Promise<ValidationReportCompare | null>;
    showValidationLog: (logFileName: string) => Promise<boolean>;
    getAppVersion: () => Promise<string>;
    openInNewWindow: (
        filePath: string,
        position?: 'top' | 'bottom' | 'left' | 'right',
        props?: NewWindowProps,
    ) => Promise<void>;
    isWindows: boolean;
    resizeWindow: (
        position: 'top' | 'bottom' | 'left' | 'right',
    ) => Promise<void>;
    setZoom: (zoomLevel: number) => Promise<void>;
    getZoom: () => Promise<number>;
}
