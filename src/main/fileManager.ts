import { dialog } from 'electron';
import DatasetJson from 'js-stream-dataset-json';
import openFile from './openFile';
import { DatasetType } from 'interfaces/common';

class FileManager {
    private openedFiles: { [key: string]: DatasetJson } = {};

    constructor() {
        this.openedFiles = {};
    }

    getFileId(): string {
        const allIds = Object.keys(this.openedFiles);
        for (let i = 0; i <= allIds.length; i += 1) {
            const id = i.toString();
            if (allIds.includes(id) === false) {
                return id;
            }
        }
        return '';
    }

    handleFileOpen = async (
        _event: Electron.IpcMainInvokeEvent,
        mode: 'local' | 'remote'
    ): Promise<{ fileId: string; type: DatasetType } | null> => {
        const newFile = await openFile();
        let type: DatasetType;

        if (newFile === undefined) {
            return null;
        }

        if (mode === 'remote') {
            return { fileId: newFile.path, type: 'json' };
        }

        const fileId = this.getFileId();
        const extension = newFile.path.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'json':
                type = 'json';
                break;
            case 'ndjson':
                type = 'json';
                break;
            case 'xpt':
                type = 'xpt';
                break;
            default:
                dialog.showErrorBox('File Open Error', `File extension not supported: ${newFile.path}`);
                return null;
        }
        let data: DatasetJson;
        try {
            data = new DatasetJson(newFile.path);
        } catch (error) {
            // Show a popup with the error message
            dialog.showErrorBox('File Open Error', `An error occurred while opening the file: ${newFile.path}`);
            return null;
        }
        this.openedFiles[fileId] = data;

        return { fileId, type };
    };

    handleFileClose = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string,
        mode: 'local' | 'remote'
    ): Promise<boolean> => {
        if (mode === 'local') {
            if (this.openedFiles[fileId]) {
                delete this.openedFiles[fileId];
            }
            return true;
        }
        if (mode === 'remote') {
            if (this.openedFiles[fileId]) {
                delete this.openedFiles[fileId];
            }
            return true;
        }

        return false;
    };

    handleGetMetadata = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string
    ) => {
        if (this.openedFiles[fileId]) {
            try {
                const metadata = await this.openedFiles[fileId].getMetadata();
                return metadata;
            } catch (error) {
                dialog.showErrorBox('Metadata Error', `An error occurred while retrieving metadata: ${error.message}`);
                return { helperText: 'Column name or row does not exist' };
            }
        }
        return { helperText: 'Column name or row does not exist' };
    };

    handleGetObservations = async (
        _event: Electron.IpcMainInvokeEvent,
        fileId: string,
        start: number,
        length: number
    ) => {
        if (this.openedFiles[fileId]) {
            try {
                const data = await this.openedFiles[fileId].getData({start, length});
                return data;
            } catch (error) {
                dialog.showErrorBox('Data Error', `An error occurred while retrieving data: ${error.message}`);
                return { helperText: 'Column name or row does not exist' };
            }
        }
        return { helperText: 'Column name or row does not exist' };
    };
}

export default FileManager;
