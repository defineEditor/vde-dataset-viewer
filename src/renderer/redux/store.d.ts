import { DatasetJsonMetadata } from 'interfaces/api';

export interface ISettings {
    pageSize: number;
    estimateWidthRows: number;
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

export interface IUi {
    view: 'select' | 'view';
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
