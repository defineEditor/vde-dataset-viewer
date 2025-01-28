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
        dateFormats: [
            'DATE',
            'DDMMYY',
            'MMDDYY',
            'YYMMDD',
            'B8601DA',
            'B8601DN',
            'E8601DA',
            'E8601DN',
            'NENGO',
            'WORDDATE',
            'WORDDATX',
            'PDJULG',
            'PDJULI',
            'NLDATE',
            'NLDATEL',
        ],
        timeFormats: [
            'TIME',
            'HHMM',
            'HOUR',
            'MMSS',
            'E8601TM',
            'B8601TM',
            'TIMEAMPM',
            'B8601TX',
            'B8601TZ',
            'E8601TX',
            'E8601TZ',
            'B8601LZ',
            'E8601LZ',
            'NLTIME',
            'NLTIMAP',
        ],
        datetimeFormats: [
            'DATETIME',
            'E8601DT',
            'B8601DT',
            'MDYAMPM',
            'DATEAMPM',
            'B8601DX',
            'B8601DZ',
            'B8601LX',
            'E8601DX',
            'E8601DZ',
            'E8601LX',
            'NLDATM',
            'NLDATML',
        ],
        convertSuffixDt: false,
        convertSuffixTm: false,
        convertSuffixDtTm: false,
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
