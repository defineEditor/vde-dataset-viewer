import { DatasetJsonMetadata } from 'interfaces/api';

export interface ISettings {
    viewer: {
        pageSize: number;
        estimateWidthRows: number;
        dynamicRowHeight: boolean;
        maxColWidth: number;
        dateFormat: 'ISO8601' | 'DDMONYEAR';
        roundNumbers: boolean;
        maxPrecision?: number;
        copyFormat: 'tab' | 'csv' | 'json';
    };
    converter: {
        threads: number;
        defaultOutputFormat: 'json' | 'ndjson';
    };
    other: {
        loadingAnimation: 'santa' | 'cat' | 'dog' | 'normal' | 'random';
    };
}

export interface IUiModal {
    type: string;
    props: {
        [key: string]: any;
    };
}

export interface IUiSnackbar {
    type: 'success' | 'error' | 'info' | 'warning' | null;
    message: string | null;
    props?: {
        duration?: number;
    };
}

export interface IUiControl {
    goTo: {
        row: number | null;
        column: string | null;
    };
}

export type AllowedPathnames =
    | '/select'
    | '/viewer'
    | '/api'
    | '/settings'
    | '/about'
    | '/converter';

export interface IUi {
    pathname: AllowedPathnames;
    currentFileId: string;
    currentPage: number;
    modals: IUiModal[];
    snackbar: IUiSnackbar;
    control: IUiControl;
}

export interface IRecentFile {
    name: string;
    label: string;
    path: string;
}

export type DatasetType = 'json' | 'xpt';

export interface IData {
    openedFileIds: {
        [name: string]: {
            name: string;
            label: string;
            type: DatasetType;
        };
    };
    openedFileMetadata: {
        [name: string]: DatasetJsonMetadata;
    };
    recentFiles: IRecentFile[];
}

export interface IStore {
    ui: IUi;
    data: IData;
    settings: ISettings;
}
