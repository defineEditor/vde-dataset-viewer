import { UpdateCheckResult } from 'electron-updater';
import { DatasetMetadata } from 'interfaces/datasetJson';
import { mainTaskTypes } from 'misc/constants';

export interface SettingsConverter {
    threads: number;
    dateFormats: string[];
    timeFormats: string[];
    datetimeFormats: string[];
    convertSuffixDt: boolean;
    convertSuffixTm: boolean;
    convertSuffixDtm: boolean;
    csvEpoch: string;
}

export interface SettingsValidator {
    validatorPath: string;
    poolSize: number;
    cachePath: string;
    localRulesPath: string;
}

export interface ICheckUpdateResult {
    newUpdated: boolean;
    update?: UpdateCheckResult['updateInfo'];
    errorMessage?: string;
}

export type OutputFormat = 'DJ1.1' | 'DNJ1.1' | 'DJC1.1' | 'CSV';
export type OutputFileExtension = 'json' | 'ndjson' | 'djsc' | 'csv';

export interface FileInfo {
    fullPath: string;
    folder: string;
    filename: string;
    format: 'xpt' | 'sas7bdat' | OutputFileExtension | '';
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
    defineVersion: string;
    standard: string;
    version: string;
}

export interface ValidateTask {
    type: typeof mainTaskTypes.VALIDATE;
    options: SettingsValidator;
    task: ValidateSubTask;
    configuration?: ValidatorConfig;
    validationDetails?: {
        files: string[];
        folders: string[];
    };
}
export interface ValidateGetInfoResult {
    version: string;
    standards: string[];
    terminology: string[];
}

export interface ProgressInfo {
    id: string;
    progress: number;
    result?: ValidateGetInfoResult;
}

export interface ConverterProcessTask {
    type: ConvertTask['type'];
    id: string;
    file: ConvertedFileInfo;
    options: ConvertTask['options'];
}

export interface ValidatorProcessTask {
    type: ValidateTask['type'];
    id: string;
    options: SettingsValidator;
    configuration?: ValidatorConfig;
    validationDetails?: ValidateTask['validationDetails'];
    outputDir?: string;
}

export type MainProcessTask = ConverterProcessTask | ValidatorProcessTask;

export type MainTask = ConvertTask | ValidateTask;

export { UpdateCheckResult };
