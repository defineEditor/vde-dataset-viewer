import { dialog, IpcMainInvokeEvent } from 'electron';
import DatasetJson from 'js-stream-dataset-json';
import { DatasetReadStat } from 'js-stream-sas7bdat';
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
} from 'interfaces/common';
import openFile from 'main/openFile';
import fs from 'fs';
import fsPromises from 'fs/promises';
import Filter from 'js-array-filter';
import crypto from 'crypto';
import path from 'path';
import FileWatcher from 'main/managers/fileWatcher';

const getHash = (str: string, lastModified: number): string => {
    const hash = crypto
        .createHash('md5')
        .update(`${str}${lastModified}`)
        .digest('hex');
    return hash;
};

class FileManager {
    private openedFiles: {
        [key: string]: DatasetJson | DatasetXpt | DatasetReadStat;
    } = {};

    private fileWatcher: FileWatcher = new FileWatcher();

    private lockFiles: Map<string, { lockFilePath: string }> = new Map();

    constructor() {
        this.openedFiles = {};
    }

    public getFileId = (
        pathToFile: string,
        lastModified: number,
        fileIdPrefix?: string,
    ): string => {
        // Check if the file is already opened
        const foundFileIds = Object.keys(this.openedFiles).filter((fileId) => {
            const file = this.openedFiles[fileId];
            return (
                file.filePath === pathToFile &&
                (!fileIdPrefix || fileId.startsWith(fileIdPrefix))
            );
        });

        if (foundFileIds.length > 0) {
            return foundFileIds[0];
        }
        // Create a new ID
        const allIds = Object.keys(this.openedFiles);
        let hash: string;
        do {
            const filename = path.parse(pathToFile).name;
            hash = `${filename}_${getHash(path.normalize(pathToFile), lastModified)}`;
            if (fileIdPrefix) {
                hash = `${fileIdPrefix}_${hash}`;
            }
        } while (allIds.includes(hash));
        return hash;
    };

    public handleFileOpen = async (
        event: IpcMainInvokeEvent,
        mode: 'local' | 'remote',
        fileSettings: {
            encoding: BufferEncoding | 'default';
            filePath?: string;
            folderPath?: string;
            fileIdPrefix?: string;
            autoReload?: boolean;
            createLockFile?: boolean;
            lockFilePathFilter?: string;
        },
    ): Promise<IOpenFile> => {
        const {
            encoding,
            filePath,
            folderPath,
            fileIdPrefix,
            autoReload,
            createLockFile,
            lockFilePathFilter,
        } = fileSettings;

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

        const fileId = this.getFileId(newFile.path, lastModified, fileIdPrefix);
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
            case 'sav':
                type = 'sav';
                break;
            case 'dta':
                type = 'dta';
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
        let data: DatasetJson | DatasetXpt | DatasetReadStat;
        try {
            if (type === 'xpt') {
                data = new DatasetXpt(newFile.path);
            } else if (['sas7bdat', 'sav', 'dta'].includes(type)) {
                data = new DatasetReadStat(newFile.path);
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

        // Create lock file if requested
        let lockFilePath: string | null = null;
        if (createLockFile && mode === 'local') {
            let shouldCreateLockFile = false;
            if (lockFilePathFilter === '' || lockFilePathFilter === undefined) {
                shouldCreateLockFile = true;
            } else {
                try {
                    const regex = new RegExp(lockFilePathFilter);
                    shouldCreateLockFile = regex.test(newFile.path);
                } catch (error) {
                    dialog.showErrorBox(
                        'Invalid Lock File Path Filter',
                        `The provided lock file path filter is not a valid regular expression: ${(error as Error).message}`,
                    );
                }
            }

            if (shouldCreateLockFile) {
                try {
                    lockFilePath = await this.createLockFile(newFile.path);
                    // Store lock file info
                    this.lockFiles.set(fileId, { lockFilePath });
                } catch (error) {
                    event.sender.send('renderer:snackbarMessage', {
                        type: 'error',
                        message: `Error while creating lock file for ${lockFilePath}: ${(error as Error).message}`,
                    });
                }
            }
        }

        // Setup file watcher if auto-reload is enabled
        if (autoReload && mode === 'local' && event.sender) {
            this.fileWatcher.watchFile(
                fileId,
                newFile.path,
                lastModified,
                event.sender,
            );
        }

        return { fileId, type, path: newFile.path, lastModified };
    };

    private createLockFile = async (filePath: string): Promise<string> => {
        try {
            const directory = path.dirname(filePath);
            const filename = path.basename(filePath);
            const lockFilePath = path.join(directory, `.${filename}.vde.lock`);

            // Write an empty file as a lock indicator
            await fsPromises.writeFile(lockFilePath, '');
            return lockFilePath;
        } catch (error) {
            throw new Error(
                `Failed to create lock file for ${filePath}: ${(error as Error).message}`,
            );
        }
    };

    private removeLockFile = async (lockFilePath: string): Promise<void> => {
        try {
            if (fs.existsSync(lockFilePath)) {
                await fsPromises.unlink(lockFilePath);
            }
        } catch (error) {
            throw new Error(
                `Failed to remove lock file ${lockFilePath}: ${(error as Error).message}`,
            );
        }
    };

    public handleFileClose = async (
        event: IpcMainInvokeEvent,
        fileId: string,
        mode: 'local' | 'remote',
    ): Promise<boolean> => {
        if (mode === 'local') {
            // Stop watching the file
            this.fileWatcher.stopWatching(fileId);

            // Remove lock file if exists
            const lockFile = this.lockFiles.get(fileId);
            if (lockFile) {
                try {
                    await this.removeLockFile(lockFile.lockFilePath);
                    this.lockFiles.delete(fileId);
                } catch (error) {
                    const filePath = lockFile.lockFilePath || '';
                    event.sender.send('renderer:snackbarMessage', {
                        type: 'error',
                        message: `Error while removing lock file for ${filePath}: ${(error as Error).message}`,
                    });
                }
            }

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
        event: IpcMainInvokeEvent,
        fileId: string,
        forceReload?: boolean,
    ): Promise<{
        metadata: DatasetJsonMetadata;
        lastModified: number;
    } | null> => {
        if (this.openedFiles[fileId]) {
            try {
                let metadata: DatasetJsonMetadata;
                if (this.openedFiles[fileId] instanceof DatasetXpt) {
                    metadata =
                        await this.openedFiles[fileId].getMetadata(
                            'dataset-json1.1',
                        );
                } else {
                    metadata =
                        await this.openedFiles[fileId].getMetadata(forceReload);
                }
                // Get last modified time
                let filePath = '';
                filePath = this.openedFiles[fileId].filePath;
                const stats = fs.statSync(filePath);
                const currentMtime = stats.mtime.getTime();

                return {
                    metadata,
                    lastModified: currentMtime,
                };
            } catch (error) {
                const filePath = this.openedFiles[fileId].filePath || '';
                event.sender.send('renderer:snackbarMessage', {
                    type: 'error',
                    message: `Error while retrieving metadata for ${filePath}: ${(error as Error).message}`,
                });
                return null;
            }
        }
        return null;
    };

    public handleGetObservations = async (
        event: IpcMainInvokeEvent,
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: BasicFilter,
        columns?: ColumnMetadata[],
    ): Promise<ItemDataArray[] | null> => {
        if (this.openedFiles[fileId]) {
            try {
                let filter: Filter | BasicFilter | undefined;
                if (filterData !== undefined && columns !== undefined) {
                    if (
                        filterColumns !== undefined &&
                        filterColumns.length > 0
                    ) {
                        // In case of filter columns, the filter will be created inside the read library
                        filter = filterData;
                    } else {
                        filter = new Filter(
                            'dataset-json1.1',
                            columns,
                            filterData,
                        );
                    }
                } else {
                    filter = undefined;
                }
                if (this.openedFiles[fileId] instanceof DatasetXpt) {
                    // For XPT we use full metadata for filter
                    const result = await this.openedFiles[fileId].getData({
                        start,
                        length,
                        type: 'array',
                        filterColumns,
                        filter,
                        roundPrecision: 12,
                    });
                    return result.data as ItemDataArray[];
                }
                const result = await this.openedFiles[fileId].getData({
                    start,
                    length,
                    filterColumns,
                    filter,
                });
                return result.data as ItemDataArray[];
            } catch (error) {
                const filePath = this.openedFiles[fileId].filePath || '';
                event.sender.send('renderer:snackbarMessage', {
                    type: 'error',
                    message: `Error while retrieving data for ${filePath}: ${(error as Error).message}`,
                });
                return null;
            }
        }
        return null;
    };

    public handleGetUniqueValues = async (
        event: IpcMainInvokeEvent,
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
                const filePath = this.openedFiles[fileId].filePath || '';
                event.sender.send('renderer:snackbarMessage', {
                    type: 'error',
                    message: `Error while retrieving unique values for ${filePath}: ${(error as Error).message}`,
                });
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
                    } else if (parsedPath.ext.toLowerCase() === '.sav') {
                        format = 'sav';
                    } else if (parsedPath.ext.toLowerCase() === '.dta') {
                        format = 'dta';
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

    public getWatcherStats(): { [key: string]: string } {
        const watchedFilePaths = this.fileWatcher.getWatchedFilePaths();
        const stats: { [key: string]: string } = {
            totalWatchedFiles: watchedFilePaths.length.toString(),
        };
        watchedFilePaths.forEach((filePath, index) => {
            stats[`watchedFile_${index}`] = filePath;
        });
        // Get errors info
        const watcherErrors = this.fileWatcher.getWatcherErrors();
        let errorIndex = 1;
        watcherErrors.forEach((errorInfo, fileId) => {
            stats[`watcherError_${errorIndex}`] =
                `File: ${fileId} Count: ${errorInfo.count}, Error Times: ${errorInfo.time.join(', ')}`;
            errorIndex++;
        });
        return stats;
    }
}

export default FileManager;
