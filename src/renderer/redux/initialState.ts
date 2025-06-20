import {
    IData,
    IStore,
    IUi,
    ISettings,
    IApi,
    ConverterData,
    ValidatorData,
} from 'interfaces/common';
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
        applyDateFormat: true,
        showTypeIcons: false,
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
        csvEpoch: '1960-01-01',
    },
    other: {
        checkForUpdates: true,
        loadingAnimation: 'random',
        inEncoding: 'utf8',
        dragoverAnimation: true,
        disableUiAnimation: false,
    },
    validator: {
        validatorPath: '',
        poolSize: 4,
        cachePath: '',
        localRulesPath: '',
    },
};
export const ui: IUi = {
    pathname: paths.SELECT,
    currentFileId: '',
    currentPage: 0,
    viewer: {
        datasetInfoTab: 0,
        validatorTab: 0,
        filterInputMode: 'manual',
        sidebarOpen: false,
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
            cellSelection: false,
        },
        select: {
            row: null,
            column: null,
        },
    },
};

export const converter: ConverterData = {
    configuration: {
        options: {
            prettyPrint: false,
            inEncoding: 'default',
            outEncoding: 'default',
            renameFiles: false,
            renamePattern: '',
            renameReplacement: '',
        },
        updateMetadata: false,
        metadata: {},
        outputFormat: 'DJ1.1',
    },
    destinationDir: '',
    sourceDir: '',
};

export const validator: ValidatorData = {
    info: {
        version: '',
        standards: [],
        terminology: [],
    },
    configuration: {
        whodrugPath: '',
        meddraPath: '',
        loincPath: '',
        medrtPath: '',
        uniiPath: '',
        snomedVersion: '',
        snomedUrl: '',
        snomedEdition: '',
        customStandard: false,
        defineVersion: '',
        standard: '',
        version: '',
    },
};

export const data: IData = {
    loadedRecords: {},
    recentFolders: [],
    recentFiles: [],
    openDatasets: {},
    filterData: {
        currentFilter: null,
        recentFilters: [],
        lastOptions: { caseInsensitive: true },
        lastType: 'manual',
    },
    maskData: {
        currentMask: null,
        savedMasks: [
            {
                id: 'mask-example-1',
                name: 'Subject Identifiers',
                columns: ['STUDYID', 'SUBJID', 'USUBJID'],
            },
        ],
    },
    converter,
    validator,
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
