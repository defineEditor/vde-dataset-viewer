export interface ISettings {
    pageSize: number;
    estimateWidthRows: number;
}
export interface IUi {
    view: 'select' | 'view';
    currentFileId: string;
}

export interface IRecentFile {
    name: string;
    label: string;
    path: string;
}

export interface IData {
    openedFileIds: {
        [name: string]: {
            name: string;
            label: string;
        };
    };
    recentFiles: IRecentFile[];
}

export interface IStore {
    ui: IUi;
    data: IData;
    settings: ISettings;
}
