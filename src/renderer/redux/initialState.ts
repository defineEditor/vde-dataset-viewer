import { IData, IStore, IUi, ISettings } from 'interfaces/common';

export const settings: ISettings = {
    pageSize: 10000,
    estimateWidthRows: 500,
};
export const ui: IUi = {
    view: 'select',
    currentFileId: '',
    currentPage: 0,
    modals: [],
    snackbar: {
        type: null,
        message: null,
        props: {},
    },
    control: {
        goTo: {
            row: null,
            column: null,
        },
    },
};

export const data: IData = {
    openedFileIds: {},
    openedFileMetadata: {},
    recentFiles: [],
};

const initialState: IStore = {
    ui,
    data,
    settings,
};

export default initialState;
