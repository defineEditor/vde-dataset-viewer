import { UpdateCheckResult } from 'electron-updater';
import { DatasetMetadata } from 'interfaces/datasetJson';
import { mainTaskTypes } from 'misc/constants';
import { IssueSummaryItem } from './core.report';

export interface SettingsConverter {
    threads: number;
    dateFormats: string[];
    timeFormats: string[];
    datetimeFormats: string[];
    convertSuffixDt: boolean;
    convertSuffixTm: boolean;
    convertSuffixDtm: boolean;
    csvEpoch: string;
    xptRoundPrecision: number;
    sas7bdatUpcaseDatasetNames: boolean;
}

export interface SettingsValidator {
    validatorPath: string;
    poolSize: number;
    cachePath: string;
    localRulesPath: string;
    reportTemplate: string;
}

export interface ICheckUpdateResult {
    newUpdated: boolean;
    update?: UpdateCheckResult['updateInfo'];
    errorMessage?: string;
}

export type OutputFormat = 'DJ1.1' | 'DNJ1.1' | 'DJC1.1' | 'CSV';
export type OutputFileExtension = 'json' | 'ndjson' | 'dsjc' | 'csv';
export type InputFileExtension =
    | 'xpt'
    | 'sas7bdat'
    | 'json'
    | 'ndjson'
    | 'dsjc';

export interface FileInfo {
    fullPath: string;
    folder: string;
    filename: string;
    format: InputFileExtension | OutputFileExtension | '';
    size: number;
    lastModified: number;
    datasetJsonVersion?: string;
}

export interface ConvertedFileInfo extends FileInfo {
    outputName: string;
}

export interface ConvertTaskOptions extends SettingsConverter {
    prettyPrint: boolean;
    inEncoding:
        | 'default'
        | 'utf8'
        | 'utf16le'
        | 'base64'
        | 'ucs2'
        | 'latin1'
        | 'ascii';
    outEncoding:
        | 'default'
        | 'utf8'
        | 'utf16le'
        | 'base64'
        | 'ucs2'
        | 'latin1'
        | 'ascii';
    outputFormat: OutputFormat;
    destinationDir: string;
    updateMetadata: boolean;
    metadata: Partial<DatasetMetadata>;
    appVersion?: string;
}

export interface ConvertTask {
    id: string;
    type: typeof mainTaskTypes.CONVERT;
    files: ConvertedFileInfo[];
    options: ConvertTaskOptions;
}

export type ValidateSubTask = 'validate' | 'getInfo';

export interface ValidatorConfig {
    whodrugPath: string;
    meddraPath: string;
    loincPath: string;
    medrtPath: string;
    uniiPath: string;
    snomedVersion: string;
    snomedUrl: string;
    snomedEdition: string;
    customStandard: boolean;
    defineXmlPath: string;
    validateXml: boolean;
    defineVersion: string;
    standard: string;
    ctPackages: string[];
    version: string;
    rules: string[];
}

export interface ValidateTask {
    id: string;
    type: typeof mainTaskTypes.VALIDATE;
    options: SettingsValidator;
    task: ValidateSubTask;
    configuration?: ValidatorConfig;
    validationDetails?: {
        files: string[];
        originalFiles: string[];
        folders: string[];
    };
}

export interface ConverterProcessTask {
    type: ConvertTask['type'];
    id: string;
    webContentsId: string;
    file: ConvertedFileInfo;
    options: ConvertTask['options'];
}

export interface ValidatorProcessTask {
    type: ValidateTask['type'];
    id: string;
    webContentsId: string;
    options: SettingsValidator;
    configuration?: ValidatorConfig;
    validationDetails?: ValidateTask['validationDetails'];
    outputDir?: string;
}

export type MainProcessTask = ConverterProcessTask | ValidatorProcessTask;

export type MainTask = ConvertTask | ValidateTask;

export { UpdateCheckResult };

export interface ValidateGetInfoResult {
    version: string;
    standards: string[];
    terminology: string[];
}
export interface ConverterTaskProgress {
    type: typeof mainTaskTypes.CONVERT;
    id: string;
    progress: number;
    fullPath: string;
    fileName: string;
    error?: string;
}

export interface ValidationRunReport {
    id: string;
    date: number;
    files: { file: string; lastModified: number }[];
    output: string;
    logFileName: string | null;
    config: ValidatorConfig;
    command: string;
    summary: {
        uniqueIssues: number;
        totalIssues: number;
        newIssues?: number;
        changes?: ValidationReportCompare['counts'] | null;
        resolvedIssues?: number;
        changedIssues?: number;
    };
}

export interface ValidatorTaskProgress {
    type: typeof mainTaskTypes.VALIDATE;
    id: string;
    progress: number;
    result?: ValidateGetInfoResult | ValidationRunReport;
    error?: string;
}

export type TaskProgress = ValidatorTaskProgress | ConverterTaskProgress;

export interface ValidationReportCompare {
    counts: {
        newIssues: number;
        changedIssues: number;
        resolvedIssues: number;
        skippedIssues: number;
        byDataset?: {
            [dataset: string]: {
                newIssues: string[];
                changedIssues: string[];
                resolvedIssues: string[];
                skippedIssues: string[];
            };
        };
        byIssue?: {
            [core_id: string]: {
                newDatasets: string[];
                changedDatasets: string[];
                resolvedDatasets: string[];
                skippedDatasets: string[];
            };
        };
    };
}

export interface NewWindowProps {
    goTo?: {
        row?: number;
        column?: string;
    };
    issues?: {
        filteredIssues: string[];
        reportId: string;
    };
}
