import { dialog, IpcMainInvokeEvent } from 'electron';
import DatasetJson from 'js-stream-dataset-json';
import DatasetSas7bdat from 'js-stream-sas7bdat';
import DatasetXpt from 'xport-js';
import {
    DataType,
    BasicFilter,
    IOpenFile,
    ColumnMetadata,
    DatasetJsonMetadata,
    FileInfo,
    InputFileExtension,
    ItemDataArray,
    DatasetDiff,
    CompareOptions,
    CompareSettings,
} from 'interfaces/common';
import openFile from 'main/openFile';
import fs from 'fs';
import fsPromises from 'fs/promises';
import Filter from 'js-array-filter';
import crypto from 'crypto';
import path from 'path';
import { compareData, compareMetadata } from './utils/compareDatasets';

const getHash = (str: string): string => {
    const timestamp = Date.now();
    const hash = crypto
        .createHash('md5')
        .update(`${str}${timestamp}`)
        .digest('hex');
    return hash;
};

class FileManager {
    private openedFiles: {
        [key: string]: DatasetJson | DatasetXpt | DatasetSas7bdat;
    } = {};

    constructor() {
        this.openedFiles = {};
    }

    public getFileId = (pathToFile: string): string => {
        // Check if the file is already opened
        const foundFileIds = Object.keys(this.openedFiles).filter((fileId) => {
            const file = this.openedFiles[fileId];
            if (
                file instanceof DatasetJson ||
                file instanceof DatasetSas7bdat
            ) {
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
                    lastModified: 0,
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
                    lastModified: 0,
                };
            }
            newFile = { path: filePath };
        } else {
            newFile = await openFile(folderPath);
        }

        let type: DataType;

        if (newFile === undefined) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: 'cancelled',
                lastModified: 0,
            };
        }

        if (mode === 'remote') {
            return {
                fileId: newFile.path,
                type: 'json',
                path: newFile.path,
                lastModified: 0,
            };
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
            case 'sas7bdat':
                type = 'sas7bdat';
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
                    lastModified: 0,
                };
        }
        let data: DatasetJson | DatasetXpt | DatasetSas7bdat;
        try {
            if (type === 'xpt') {
                data = new DatasetXpt(newFile.path);
            } else if (type === 'sas7bdat') {
                data = new DatasetSas7bdat(newFile.path);
            } else {
                const updatedEncoding: BufferEncoding =
                    encoding === 'default' ? 'utf8' : encoding;
                data = new DatasetJson(newFile.path, {
                    encoding: updatedEncoding,
                });
            }
        } catch (error) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: `An error occurred while opening the file ${newFile.path}: ${(error as Error).message}`,
                lastModified: 0,
            };
        }
        this.openedFiles[fileId] = data;

        // Get last modified time
        let lastModified = 0;
        try {
            const stats = fs.statSync(newFile.path);
            lastModified = stats.mtime.getTime();
        } catch (error) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: `An error occurred while opening the file ${newFile.path}: ${(error as Error).message}`,
                lastModified: 0,
            };
        }

        return { fileId, type, path: newFile.path, lastModified };
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
    ): Promise<ItemDataArray[] | null> => {
        if (this.openedFiles[fileId]) {
            try {
                let filter: Filter | undefined;
                if (filterData !== undefined && columns !== undefined) {
                    filter = new Filter('dataset-json1.1', columns, filterData);
                } else {
                    filter = undefined;
                }
                if (this.openedFiles[fileId] instanceof DatasetXpt) {
                    return (await this.openedFiles[fileId].getData({
                        start,
                        length,
                        type: 'array',
                        filterColumns,
                        filter,
                        roundPrecision: 12,
                    })) as ItemDataArray[];
                }
                // TODO: strange TS issue, it requires filter to be undefined
                return (await this.openedFiles[fileId].getData({
                    start,
                    length,
                    filterColumns,
                    filter: filter as undefined,
                })) as ItemDataArray[];
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
        if (this.openedFiles[fileId]) {
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
        event: IpcMainInvokeEvent,
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

            return this.getFilesInfo(event, result.filePaths);
        } catch (error) {
            return null;
        }
    };

    // Open directory dialog
    public openFolder = async (
        _event: IpcMainInvokeEvent,
        options: {
            multiple?: boolean;
            initialFolder?: string;
        },
    ): Promise<string[] | null> => {
        try {
            const { initialFolder, multiple } = options;
            let startFolder = initialFolder;
            // Check if initialFolder exists;
            if (initialFolder !== undefined) {
                if (fs.existsSync(initialFolder) === false) {
                    startFolder = undefined;
                }
            }
            const properties: Array<'openDirectory' | 'multiSelections'> = [
                'openDirectory',
            ];
            if (multiple) {
                properties.push('multiSelections');
            }
            const result = await dialog.showOpenDialog({
                properties,
                defaultPath: startFolder,
            });
            if (result.canceled) {
                return [];
            }
            return result.filePaths;
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

    public getFilesInfo = async (
        _event: IpcMainInvokeEvent,
        filePaths: string[],
    ): Promise<FileInfo[]> => {
        const filesInfoPromises = filePaths.map(
            async (filePath): Promise<FileInfo> => {
                const parsedPath = path.parse(filePath);
                if (fs.existsSync(filePath)) {
                    // Get data of the last modification and size of the file
                    const stats = await fsPromises.stat(filePath);
                    let format: InputFileExtension | '';
                    if (parsedPath.ext.toLowerCase() === '.xpt') {
                        format = 'xpt';
                    } else if (parsedPath.ext.toLowerCase() === '.json') {
                        format = 'json';
                    } else if (parsedPath.ext.toLowerCase() === '.sas7bdat') {
                        format = 'sas7bdat';
                    } else if (parsedPath.ext.toLowerCase() === '.ndjson') {
                        format = 'ndjson';
                    } else if (parsedPath.ext.toLowerCase() === '.dsjc') {
                        format = 'dsjc';
                    } else {
                        format = '';
                    }
                    return {
                        filename: parsedPath.base,
                        fullPath: filePath,
                        folder: parsedPath.dir,
                        format,
                        size: stats.size,
                        lastModified: stats.mtime.getTime(),
                    };
                }
                return {
                    filename: parsedPath.base,
                    fullPath: filePath,
                    folder: parsedPath.dir,
                    format: '',
                    size: -1,
                    lastModified: -1,
                };
            },
        );
        const filesInfo = await Promise.all(filesInfoPromises);
        return filesInfo;
    };

    handleCompareDatasets = async (
        _event: IpcMainInvokeEvent,
        basePath: string,
        comparePath: string,
        options: CompareOptions,
        settings: CompareSettings,
    ): Promise<DatasetDiff | { error: string }> => {
        const { encoding, bufferSize } = settings;
        // Open base and compare files
        const baseFileInfo = await this.handleFileOpen(_event, 'local', {
            encoding,
            filePath: basePath,
        });
        if (baseFileInfo.errorMessage) {
            return { error: baseFileInfo.errorMessage };
        }
        const compareFileInfo = await this.handleFileOpen(_event, 'local', {
            encoding,
            filePath: comparePath,
        });
        if (compareFileInfo.errorMessage) {
            return { error: compareFileInfo.errorMessage };
        }

        // Base and compare metadata;
        const baseMeta = await this.handleGetMetadata(
            _event,
            baseFileInfo.fileId,
        );
        if (baseMeta === null) {
            return { error: 'Failed to retrieve base file metadata' };
        }
        const compMeta = await this.handleGetMetadata(
            _event,
            compareFileInfo.fileId,
        );
        if (compMeta === null) {
            return { error: 'Failed to retrieve compare file metadata' };
        }
        // Read and compare blocks of data
        const dataDiff: DatasetDiff['data'] = {
            addedRows: [],
            deletedRows: [],
            modifiedRows: [],
            summary: {
                firstDiffRow: null,
                lastDiffRow: null,
                totalDiffs: 0,
                maxDiffReached: false,
                maxColDiffReached: [],
            },
        };

        const metadataDiff: DatasetDiff['metadata'] = compareMetadata(
            baseMeta,
            compMeta,
        );

        for (
            let start = 0;
            start < Math.min(baseMeta.records, compMeta.records);
            start += bufferSize
        ) {
            // eslint-disable-next-line no-await-in-loop
            const baseData = await this.handleGetObservations(
                _event,
                baseFileInfo.fileId,
                start,
                bufferSize,
            );
            if (baseData === null) {
                return { error: 'Failed to retrieve base file data' };
            }
            // eslint-disable-next-line no-await-in-loop
            const compData = await this.handleGetObservations(
                _event,
                compareFileInfo.fileId,
                start,
                bufferSize,
            );
            if (compData === null) {
                return { error: 'Failed to retrieve compare file data' };
            }

            // Compare data blocks
            const blockDiff = compareData(
                baseData,
                compData,
                baseMeta,
                compMeta,
                dataDiff.summary,
                start,
                options,
            );

            dataDiff.addedRows.push(...blockDiff.addedRows);
            dataDiff.deletedRows.push(...blockDiff.deletedRows);
            dataDiff.modifiedRows.push(...blockDiff.modifiedRows);

            dataDiff.summary = blockDiff.summary;
        }

        return { metadata: metadataDiff, data: dataDiff };
    };
}

export default FileManager;
