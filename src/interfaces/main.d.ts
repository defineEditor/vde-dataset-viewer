import { UpdateCheckResult } from 'electron-updater';

interface ICheckUpdateResult {
    newUpdated: boolean;
    update?: UpdateCheckResult['updateInfo'];
    errorMessage?: string;
}

export { ICheckUpdateResult, UpdateCheckResult };
