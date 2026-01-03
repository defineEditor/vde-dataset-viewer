import {
    IData,
    IStore,
    IUi,
    ISettings,
    IApi,
    ConverterData,
    ValidatorData,
    CompareData,
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
        copyWithHeaders: false,
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
        xptRoundPrecision: 12,
        sas7bdatUpcaseDatasetNames: true,
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
        reportTemplate: '',
    },
    define: {
        stylesheetShowComments: false,
    },
};
export const ui: IUi = {
    pathname: paths.SELECT,
    currentFileId: '',
    zoomLevel: 0,
    viewer: {
        datasetInfoTab: 0,
        validatorTab: 'validation',
        filterInputMode: 'manual',
        sidebarOpen: false,
        bottomSection: 'dataset',
    },
    modals: [],
    snackbar: {
        type: null,
        message: null,
        props: {},
    },
    control: {},
    validation: {},
    validationPage: {
        currentTab: 'validation',
        currentReportTab: 'summary',
        currentReportId: null,
        showOnlyDatasetsWithIssues: false,
        reportSummaryType: 'datasets',
    },
    dataSettings: {},
    define: {
        currentFileId: null,
        isDefineLoading: false,
        currentTab: 'overview',
        selectedItemGroupOid: null,
        selectedVariableOid: null,
        searchTerm: '',
        scrollPosition: {},
    },
    compare: {
        currentCompareId: '',
        startCompare: false,
        fileBase: null,
        fileComp: null,
        view: 'horizontal',
        resultTab: 'data',
        info: {},
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
        defineXmlPath: '',
        validateXml: true,
        defineVersion: '',
        standard: '',
        ctPackages: [],
        version: '',
        rules: [],
        excludedRules: [],
    },
    selectedFiles: [],
    reports: {},
    reportData: {},
    reportFilters: {},
    lastReportSaveFolder: '',
};

const compare: CompareData = {
    data: {},
    recentCompares: [],
};

export const data: IData = {
    loadedRecords: {},
    recentFolders: [],
    recentFiles: [],
    filterData: {
        currentFilter: {},
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
    compare,
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
