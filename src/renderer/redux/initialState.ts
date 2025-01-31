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
        maxPrecision: 8,
        copyFormat: 'tab',
    },
    converter: {
        threads: 2,
        dateFormats: [
            'DATE',
            'DDMMYY',
            'MMDDYY',
            'YYMMDD',
            'B8601DA',
            'E8601DA',
        ],
        timeFormats: ['TIME', 'HHMM', 'MMSS', 'E8601TM', 'B8601TM'],
        datetimeFormats: ['DATETIME', 'E8601DT', 'B8601DT'],
        convertSuffixDt: false,
        convertSuffixTm: false,
        convertSuffixDtm: false,
    },
    other: {
        checkForUpdates: true,
        loadingAnimation: 'random',
        inEncoding: 'utf8',
        dragoverAnimation: true,
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
