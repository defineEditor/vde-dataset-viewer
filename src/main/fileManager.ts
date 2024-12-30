import { dialog, IpcMainInvokeEvent } from 'electron';
import DatasetJson from 'js-stream-dataset-json';
import { DatasetType, Filter, IOpenFile } from 'interfaces/common';
import openFile from 'main/openFile';
import fs from 'fs';

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
        _event: IpcMainInvokeEvent,
        mode: 'local' | 'remote',
        fileSettings: {
            encoding: BufferEncoding;
            filePath?: string;
            folderPath?: string;
        },
    ): Promise<IOpenFile> => {
        const { encoding, filePath, folderPath } = fileSettings;

        if (folderPath) {
            // Check if specified folder exists;
            if (fs.existsSync(folderPath) === false) {
                return {
                    fileId: '',
                    type: 'json',
                    path: '',
                    errorMessage: 'Folder not found',
                };
            }
        }

        let newFile: Record<string, string> | undefined;
        if (filePath) {
            // Check file exists;
            if (fs.existsSync(filePath) === false) {
                return {
                    fileId: '',
                    type: 'json',
                    path: '',
                    errorMessage: 'File not found',
                };
            }
            newFile = { path: filePath };
        } else {
            newFile = await openFile(folderPath);
        }

        let type: DatasetType;

        if (newFile === undefined) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: 'cancelled',
            };
        }

        if (mode === 'remote') {
            return { fileId: newFile.path, type: 'json', path: newFile.path };
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
                return {
                    fileId: '',
                    type: 'json',
                    path: '',
                    errorMessage: 'File extension not supported',
                };
        }
        let data: DatasetJson;
        try {
            data = new DatasetJson(newFile.path, {
                encoding,
            });
        } catch (error) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: `An error occurred while opening the file ${newFile.path}: ${(error as Error).message}`,
            };
        }
        this.openedFiles[fileId] = data;

        return { fileId, type, path: newFile.path };
    };

    handleFileClose = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
        mode: 'local' | 'remote',
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

    handleGetMetadata = async (_event: IpcMainInvokeEvent, fileId: string) => {
        if (this.openedFiles[fileId]) {
            try {
                const metadata = await this.openedFiles[fileId].getMetadata();
                return metadata;
            } catch (error) {
                dialog.showErrorBox(
                    'Metadata Error',
                    `An error occurred while retrieving metadata: ${(error as Error).message}`,
                );
                return null;
            }
        }
        return null;
    };

    handleGetObservations = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: Filter[],
    ) => {
        if (this.openedFiles[fileId]) {
            try {
                const data = await this.openedFiles[fileId].getData({
                    start,
                    length,
                    filterColumns,
                    filterData,
                });
                return data;
            } catch (error) {
                dialog.showErrorBox(
                    'Data Error',
                    `An error occurred while retrieving data: ${(error as Error).message}`,
                );
                return null;
            }
        }
        return null;
    };
}

export default FileManager;
