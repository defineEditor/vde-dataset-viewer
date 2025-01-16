import { UpdateCheckResult } from 'electron-updater';

export interface ICheckUpdateResult {
    newUpdated: boolean;
    update?: UpdateCheckResult['updateInfo'];
    errorMessage?: string;
}

export interface FileInfo {
    fullPath: string;
    folder: string;
    filename: string;
    format: string;
    size: number;
    lastModified: number;
    datasetJsonVersion?: string;
}

export { UpdateCheckResult };
