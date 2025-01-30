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
    convertSuffixDtTm: boolean;
}

export interface ICheckUpdateResult {
    newUpdated: boolean;
    update?: UpdateCheckResult['updateInfo'];
    errorMessage?: string;
}

export type OutputFormat = 'DJ1.1' | 'NDJ1.1';

export interface FileInfo {
    fullPath: string;
    folder: string;
    filename: string;
    format: 'xpt' | 'json' | 'ndjson';
    size: number;
    lastModified: number;
    datasetJsonVersion?: string;
}

export interface ConvertedFileInfo extends FileInfo {
    outputName: string;
}

export interface ConvertTaskOptions extends SettingsConverter {
    prettyPrint: boolean;
    outputFormat: OutputFormat;
    destinationDir: string;
    metadata: Partial<DatasetMetadata>;
}

export interface ConvertTask {
    type: typeof mainTaskTypes.CONVERT;
    files: ConvertedFileInfo[];
    options: ConvertTaskOptions;
}

export interface ProgressInfo {
    id: string;
    progress: number;
}

export type MainTask = ConvertTask;

export { UpdateCheckResult };
