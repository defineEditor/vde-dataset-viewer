import { BasicFilter, IApiStudy, IApiStudyDataset } from 'interfaces/api';
import {
    ICheckUpdateResult,
    SettingsConverter,
    SettingsValidator,
    ValidatorConfig,
    ValidationReport,
} from 'interfaces/main';
import { ParsedValidationReport } from 'interfaces/core.report';
import { modals, ModalType, AllowedPathnames } from 'misc/constants';
import { ConversionConfig } from 'interfaces/converter';

export interface IMask {
    name: string;
    id: string;
    columns: string[];
    sticky?: boolean;
}

export type ClipboardCopyFormat = 'tab' | 'csv' | 'json';

export interface SettingsViewer {
    pageSize: number;
    estimateWidthRows: number;
    dynamicRowHeight: boolean;
    maxColWidth: number;
    dateFormat: 'ISO8601' | 'DDMONYEAR';
    roundNumbers: boolean;
    maxPrecision?: number;
    applyDateFormat: boolean;
    copyFormat: ClipboardCopyFormat;
    showTypeIcons: boolean;
    copyWithHeaders: boolean;
}

export interface ISettings {
    viewer: SettingsViewer;
    converter: SettingsConverter;
    validator: SettingsValidator;
    other: {
        checkForUpdates: boolean;
        loadingAnimation: 'santa' | 'cat' | 'dog' | 'normal' | 'random';
        inEncoding:
            | 'default'
            | 'utf8'
            | 'utf16le'
            | 'base64'
            | 'ucs2'
            | 'latin1'
            | 'ascii';
        dragoverAnimation: boolean;
        disableUiAnimation: boolean;
    };
}

export interface IUiModalBase {
    type: ModalType;
}

export interface IUiModalAppUpdate extends IUiModalBase {
    type: typeof modals.APPUPDATE;
    data: ICheckUpdateResult;
}

export interface IUiModalGeneral extends IUiModalBase {
    type:
        | typeof modals.GOTO
        | typeof modals.DATASETINFO
        | typeof modals.FILTER
        | typeof modals.VARIABLEINFO
        | typeof modals.MASK
        | typeof modals.VALIDATOR;
    data: {};
}

export interface IUiModalEditApi extends IUiModalBase {
    type: typeof modals.EDITAPI;
    data: {
        apiId: string;
    };
}

export interface IUiModalMessage extends IUiModalBase {
    type: typeof modals.ERROR;
    data: { message: string };
}

export interface IUiModalVariableInfo extends IUiModalBase {
    type: typeof modals.VARIABLEINFO;
    data: { columnId: string };
}

export interface IUiModalFilter extends IUiModalBase {
    type: typeof modals.FILTER;
    filterType: 'dataset' | 'report';
}

export type IUiModal =
    | IUiModalAppUpdate
    | IUiModalFilter
    | IUiModalVariableInfo
    | IUiModalGeneral
    | IUiModalEditApi
    | IUiModalMessage;

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
        cellSelection: boolean;
    };
    select: {
        row: number | null;
        column: string | null;
    };
}

export interface IUiViewer {
    datasetInfoTab: 0 | 1;
    validatorTab: 'validation' | 'results' | 'issues';
    filterInputMode: 'manual' | 'interactive';
    sidebarOpen: boolean;
    showIssues: boolean;
    filteredIssues: string[];
}

export interface IUiValidation {
    validationProgress: number;
    status: 'not started' | 'validating' | 'completed';
    conversionProgress: number | null;
    dateCompleted: number | null;
}

export interface IUiValidationPage {
    currentTab: 'validation' | 'results' | 'report';
    currentReportTab:
        | 'overview'
        | 'summary'
        | 'details'
        | 'rules'
        | 'configuration';
    currentReportId: string | null;
    showOnlyDatasetsWithIssues: boolean;
    reportSummaryType: 'datasets' | 'issues';
}

export interface IUi {
    pathname: AllowedPathnames;
    currentFileId: string;
    currentPage: number;
    zoomLevel: number;
    viewer: IUiViewer;
    modals: IUiModal[];
    snackbar: IUiSnackbar;
    control: IUiControl;
    validation: { [validationId: string]: IUiValidation };
    validationPage: IUiValidationPage;
}

export interface IRecentFile {
    name: string;
    label: string;
    path: string;
}

export interface ConverterData {
    configuration: ConversionConfig;
    destinationDir: string;
    sourceDir: string;
}

export interface ValidatorData {
    info: {
        version: string;
        standards: string[];
        terminology: string[];
    };
    reports: { [id: string]: ValidationReport };
    reportData: { [id: string]: ParsedValidationReport };
    reportFilters: {
        [id: string]: BasicFilter | null;
    };
    lastReportSaveFolder: string;
    configuration: ValidatorConfig;
}

export interface IData {
    loadedRecords: {
        [name: string]: number;
    };
    recentFolders: string[];
    recentFiles: IRecentFile[];
    openDatasets: {
        [name: string]: {
            filter: BasicFilter | null;
        };
    };
    filterData: {
        currentFilter: BasicFilter | null;
        recentFilters: {
            filter: BasicFilter;
            datasetName: string;
            date: number;
        }[];
        lastOptions: BasicFilter['options'];
        lastType: 'manual' | 'ui';
    };
    maskData: {
        currentMask: IMask | null;
        savedMasks: IMask[];
    };
    converter: ConverterData;
    validator: ValidatorData;
}

export interface IApiRecord {
    id: string;
    address: string;
    key: string;
    name: string;
    lastAccessDate: number;
}

export interface IApi {
    apiRecords: { [key: string]: IApiRecord };
    currentApiId: string | null;
    currentStudyId: string | null;
    currentDatasetId: string | null;
    studies: { [key: string]: IApiStudy };
    datasets: { [key: string]: IApiStudyDataset };
}

export interface IStore {
    ui: IUi;
    data: IData;
    api: IApi;
    settings: ISettings;
}
