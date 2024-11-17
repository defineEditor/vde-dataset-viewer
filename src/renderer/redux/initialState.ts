import { IData, IStore, IUi, ISettings } from 'interfaces/common';

export const settings: ISettings = {
    pageSize: 10000,
    estimateWidthRows: 500,
};
export const ui: IUi = {
    view: 'select',
    currentFileId: '',
};

export const data: IData = {
    openedFileIds: {},
    recentFiles: [],
};

const initialState: IStore = {
    ui,
    data,
    settings,
};

export default initialState;
