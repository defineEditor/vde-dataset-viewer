import { UpdateCheckResult } from 'electron-updater';
import { mainTaskTypes } from 'misc/constants';
import { SettingsConverter } from 'interfaces/common';

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
    format: 'xpt' | 'json';
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
