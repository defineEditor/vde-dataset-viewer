import { IData, IStore, IUi, ISettings, IApi } from 'interfaces/common';
import { paths } from 'misc/constants';

export const settings: ISettings = {
    viewer: {
        pageSize: 10000,
        estimateWidthRows: 1000,
        dynamicRowHeight: false,
        maxColWidth: 100,
        dateFormat: 'ISO8601',
        roundNumbers: false,
        copyFormat: 'tab',
    },
    converter: {
        threads: 2,
        defaultOutputFormat: 'json',
    },
    other: {
        checkForUpdates: true,
        loadingAnimation: 'random',
        inEncoding: 'utf8',
    },
};
export const ui: IUi = {
    pathname: paths.SELECT,
    currentFileId: '',
    currentPage: 0,
    viewer: {
        datasetInfoTab: 0,
        filterInputMode: 'manual',
    },
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
    loadedRecords: {},
    recentFolders: [],
    recentFiles: [],
    filterData: {
        currentFilter: null,
        recentFilters: [],
        lastOptions: { caseInsensitive: true },
        lastType: 'manual',
    },
};

export const api: IApi = {
    apiRecords: {},
    currentApiId: null,
    currentStudyId: null,
    currentDatasetId: null,
    studies: {},
    datasets: {},
};

const initialState: IStore = {
    ui,
    data,
    settings,
    api,
};

export default initialState;
