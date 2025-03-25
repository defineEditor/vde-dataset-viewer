import { dialog, IpcMainInvokeEvent } from 'electron';
import DatasetJson from 'js-stream-dataset-json';
import DatasetXpt from 'xport-js';
import {
    DatasetType,
    BasicFilter,
    IOpenFile,
    ColumnMetadata,
    DatasetJsonMetadata,
    FileInfo,
} from 'interfaces/common';
import openFile from 'main/openFile';
import fs from 'fs';
import Filter from 'js-array-filter';
import crypto from 'crypto';
import path from 'path';

const getHash = (str: string): string => {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('md5')
        .update(`${str}${timestamp}`)
        .digest('hex');
    return hash;
};

class FileManager {
    private openedFiles: { [key: string]: DatasetJson | DatasetXpt } = {};

    constructor() {
        this.openedFiles = {};
    }

    public getFileId = (pathToFile: string): string => {
        // Check if the file is already opened
        const foundFileIds = Object.keys(this.openedFiles).filter((fileId) => {
            const file = this.openedFiles[fileId];
            if (file instanceof DatasetJson) {
                return file.filePath === pathToFile;
            }
            if (file instanceof DatasetXpt) {
                return file.pathToFile === pathToFile;
            }
            return false;
        });

        if (foundFileIds.length > 0) {
            return foundFileIds[0];
        }
        // Craete a new ID
        const allIds = Object.keys(this.openedFiles);
        let hash: string;
        do {
            const filename = path.parse(pathToFile).name;
            hash = `${filename}_${getHash(path.normalize(pathToFile))}`;
        } while (allIds.includes(hash));
        return hash;
    };

    public handleFileOpen = async (
        _event: IpcMainInvokeEvent,
        mode: 'local' | 'remote',
        fileSettings: {
            encoding: BufferEncoding | 'default';
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

        const fileId = this.getFileId(newFile.path);
        const extension = newFile.path.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'json':
                type = 'json';
                break;
            case 'ndjson':
                type = 'json';
                break;
            case 'dsjc':
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
        let data: DatasetJson | DatasetXpt;
        try {
            if (type === 'xpt' || encoding === 'default') {
                data = new DatasetXpt(newFile.path);
            } else {
                data = new DatasetJson(newFile.path, {
                    encoding,
                });
            }
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

    public handleFileClose = async (
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

    public handleGetMetadata = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
    ) => {
        if (this.openedFiles[fileId]) {
            try {
                let metadata: DatasetJsonMetadata;
                if (this.openedFiles[fileId] instanceof DatasetXpt) {
                    metadata =
                        await this.openedFiles[fileId].getMetadata(
                            'dataset-json1.1',
                        );
                } else {
                    metadata = await this.openedFiles[fileId].getMetadata();
                }
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

    public handleGetObservations = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: BasicFilter,
        columns?: ColumnMetadata[],
    ) => {
        if (this.openedFiles[fileId]) {
            try {
                let filter: Filter | undefined;
                if (filterData !== undefined && columns !== undefined) {
                    filter = new Filter('dataset-json1.1', columns, filterData);
                } else {
                    filter = undefined;
                }
                if (this.openedFiles[fileId] instanceof DatasetXpt) {
                    return await this.openedFiles[fileId].getData({
                        start,
                        length,
                        filterColumns,
                        filter,
                        roundPrecision: 12,
                    });
                }
                // TODO: strange TS issue, it requires filter to be undefined
                return await this.openedFiles[fileId].getData({
                    start,
                    length,
                    filterColumns,
                    filter: filter as undefined,
                });
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

    public handleGetUniqueValues = async (
        _event: IpcMainInvokeEvent,
        fileId: string,
        columns: string[],
        limit?: number,
        addCount?: boolean,
    ) => {
        if (this.openedFiles[fileId] instanceof DatasetJson) {
            try {
                return await this.openedFiles[fileId].getUniqueValues({
                    columns,
                    limit,
                    addCount,
                });
            } catch (error) {
                dialog.showErrorBox(
                    'Data Error',
                    `An error occurred while retrieving unique values: ${(error as Error).message}`,
                );
                return null;
            }
        }
        return null;
    };

    public openFileDialog = async (
        _event: IpcMainInvokeEvent,
        options: {
            multiple?: boolean;
            initialFolder?: string;
            filters?: { name: string; extensions: string[] }[];
        },
    ): Promise<FileInfo[] | null> => {
        try {
            const { multiple, initialFolder, filters } = options;
            let startFolder = initialFolder;
            // Check if initialFolder exists;
            if (initialFolder !== undefined) {
                if (fs.existsSync(initialFolder) === false) {
                    startFolder = undefined;
                }
            }

            const properties: Array<'openFile' | 'multiSelections'> = [
                'openFile',
            ];
            if (multiple) {
                properties.push('multiSelections');
            }
            const result = await dialog.showOpenDialog({
                properties,
                defaultPath: startFolder,
                filters,
            });
            if (result.canceled) {
                return [];
            }
            return result.filePaths.map((filePath) => {
                const parsedPath = path.parse(filePath);
                // Get data of the last modification and size of the file
                const stats = fs.statSync(filePath);
                let format: 'xpt' | 'json' | 'ndjson';
                if (parsedPath.ext.toLowerCase() === '.xpt') {
                    format = 'xpt';
                } else if (parsedPath.ext.toLowerCase() === '.json') {
                    format = 'json';
                } else if (parsedPath.ext.toLowerCase() === '.ndjson') {
                    format = 'ndjson';
                } else {
                    throw new Error('File extension not supported');
                }
                return {
                    filename: parsedPath.base,
                    fullPath: filePath,
                    folder: parsedPath.dir,
                    format,
                    size: stats.size,
                    lastModified: stats.mtime.getTime(),
                };
            });
        } catch (error) {
            return null;
        }
    };

    public openDirectoryDialog = async (
        _event: IpcMainInvokeEvent,
        initialFolder: string | null,
    ): Promise<string | null> => {
        try {
            let startFolder =
                initialFolder === null ? undefined : initialFolder;
            // Check if initialFolder exists;
            if (initialFolder !== null) {
                if (fs.existsSync(initialFolder) === false) {
                    startFolder = undefined;
                }
            }

            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                defaultPath: startFolder,
            });
            if (result.canceled) {
                return '';
            }
            return result.filePaths[0];
        } catch (error) {
            return null;
        }
    };
}

export default FileManager;
