import { UpdateCheckResult } from 'electron-updater';
import { mainTaskTypes } from 'misc/constants';

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
    format: string;
    size: number;
    lastModified: number;
    datasetJsonVersion?: string;
}

export interface ConvertedFileInfo extends FileInfo {
    outputName: string;
}

export interface ConvertTask {
    type: typeof mainTaskTypes.CONVERT;
    files: ConvertedFileInfo[];
    options: {
        threads: number;
        prettyPrint: boolean;
        outputFormat: OutputFormat;
    };
}

export interface ProgressInfo {
    id: string;
    progress: number;
}

export type MainTask = ConvertTask;

export { UpdateCheckResult };
