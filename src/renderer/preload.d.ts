/* eslint-disable no-unused-vars */
import { ElectronApi } from 'interfaces/electron.api';

declare global {
    export interface Window {
        electron: ElectronApi;
    }
}

export {};
