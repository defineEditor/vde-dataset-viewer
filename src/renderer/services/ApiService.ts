import {
    ItemDataArray,
    DatasetJsonMetadata,
    DatasetType,
    IOpenFile,
    BasicFilter,
    ColumnMetadata,
    ILocalStore,
    IStore,
    IOpenFileWithMetadata,
    ISettings,
    ITableRow,
    IApiAbout,
    IApiRecord,
    IApiStudy,
    IApiStudyDataset,
    DatasetMode,
    MainTask,
    TaskProgress,
    TableRowValue,
    ValidatorConfig,
    ValidateTask,
    ConvertTask,
    ConvertedFileInfo,
} from 'interfaces/common';
import store from 'renderer/redux/store';
import transformData from 'renderer/services/transformData';
import Filter from 'js-array-filter';
import { mainTaskTypes } from 'misc/constants';
import { setLoadedRecords } from 'renderer/redux/slices/data';

class ApiService {
    // List of opened files with basic information
    private openedFiles: {
        fileId: string;
        name: string;
        mode: 'local' | 'remote';
        path: string;
        type: DatasetType;
    }[] = [];

    // List of opened files metadata
    private openedFilesMetadata: {
        [fileId: string]: DatasetJsonMetadata;
    } = {};

    private openedFilesData: { [fileId: string]: ITableRow[] } = {};

    // Open file
    public openFile = async (
        mode: 'local' | 'remote',
        filePath?: string,
        folderPath?: string,
        apiInfo?: {
            api: IApiRecord;
            study: IApiStudy;
            dataset: IApiStudyDataset;
        },
    ): Promise<IOpenFileWithMetadata> => {
        let fileData: IOpenFile;
        // Check if the file is already open
        if (filePath !== undefined) {
            let foundFileData: IOpenFile | undefined;
            this.openedFiles.forEach((file) => {
                if (file.path === filePath) {
                    foundFileData = {
                        fileId: file.fileId,
                        type: file.type,
                        path: file.path,
                    };
                }
            });
            if (foundFileData !== undefined) {
                // Get metadata
                const metadata = await this.getMetadata(foundFileData.fileId);
                if (metadata === null) {
                    // Error reading metadata
                    return {
                        ...foundFileData,
                        metadata: {} as DatasetJsonMetadata,
                        errorMessage: 'Error reading metadata',
                    };
                }
                return { ...foundFileData, metadata };
            }
        }
        if (mode === 'remote') {
            if (apiInfo === undefined) {
                return {
                    fileId: '',
                    type: 'json',
                    path: '',
                    metadata: {} as DatasetJsonMetadata,
                    errorMessage: 'API info not provided reading metadata',
                };
            }
            fileData = await this.openFileRemote(apiInfo);
        } else {
            fileData = await this.openFileLocal(filePath, folderPath);
        }

        if (fileData.errorMessage) {
            // If error was found do not add it to the list of opened files
            return {
                ...fileData,
                metadata: {} as DatasetJsonMetadata,
                errorMessage: fileData.errorMessage,
            };
        }

        // Check if the file is already open
        const fileIndex = this.openedFiles.findIndex(
            (file) => file.path === fileData.path,
        );
        if (fileIndex !== -1) {
            // Check that fileId is the same (it must be)
            if (this.openedFiles[fileIndex].fileId !== fileData.fileId) {
                throw new Error(
                    'Internal error: New File ID is not matching the old file id',
                );
            }
            this.openedFiles[fileIndex] = {
                fileId: fileData.fileId,
                path: fileData.path,
                type: fileData.type,
                mode,
                name: fileData.path,
            };
        } else {
            this.openedFiles.push({
                fileId: fileData.fileId,
                path: fileData.path,
                type: fileData.type,
                mode,
                name: fileData.path,
            });
        }

        // Get metadata
        const metadata = await this.getMetadata(fileData.fileId);
        if (metadata === null) {
            // Error reading metadata
            return {
                ...fileData,
                metadata: {} as DatasetJsonMetadata,
                errorMessage: 'Error reading metadata',
            };
        }

        return { ...fileData, metadata };
    };

    private openFileLocal = async (
        filePath?: string,
        folderPath?: string,
    ): Promise<IOpenFile> => {
        // Read encoding from state
        const encoding = store.getState().settings.other.inEncoding;
        const response = await window.electron.openFile('local', {
            encoding,
            filePath,
            folderPath,
        });
        if (response === null) {
            return {
                fileId: '',
                type: 'json',
                path: '',
                errorMessage: 'Failed to open the file',
            };
        }
        return response;
    };

    private openFileRemote = async (apiInfo: {
        api: IApiRecord;
        study: IApiStudy;
        dataset: IApiStudyDataset;
    }): Promise<IOpenFile> => {
        // At this stage it is already know that the dataset exists
        const result: IOpenFile = {
            fileId: `${apiInfo.api.id}-${apiInfo.study.studyOID}-${apiInfo.dataset.itemGroupOID}`,
            type: 'json',
            path: `${apiInfo.api.address}${apiInfo.dataset.href}`,
        };
        return result;
    };

    // Get dataset metadata
    public getMetadata = async (
        fileId: string,
    ): Promise<DatasetJsonMetadata | null> => {
        const file = this.openedFiles.find(
            (fileItem) => fileItem.fileId === fileId,
        );
        if (file === undefined) {
            throw new Error(
                'Trying to read metadata from the file which is not opened',
            );
        }
        // Check if the metadata is already loaded
        if (this.openedFilesMetadata[fileId] !== undefined) {
            return this.openedFilesMetadata[fileId];
        }
        let metadata: DatasetJsonMetadata | null;
        if (file.mode === 'remote') {
            metadata = await this.getMetadataRemote(fileId);
        } else {
            metadata = await this.getMetadataLocal(fileId);
        }
        if (metadata === null) {
            return null;
        }

        // Save metadata
        this.openedFilesMetadata[fileId] = metadata;

        return metadata;
    };

    private getMetadataLocal = async (
        fileId: string,
    ): Promise<DatasetJsonMetadata | null> => {
        const result = await window.electron.getMetadata(fileId);
        return result;
    };

    private getMetadataRemote = async (
        fileId: string,
    ): Promise<DatasetJsonMetadata | null> => {
        let result: DatasetJsonMetadata | null;
        const file = this.openedFiles.find((item) => item.fileId === fileId);

        if (file === undefined) {
            return null;
        }

        const requestOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        };
        const requestResponse = await window.electron.fetch(
            `${file.path}?metadata=true`,
            requestOptions,
        );

        if ([200, 204].includes(requestResponse.status)) {
            result = requestResponse.response as unknown as DatasetJsonMetadata;
        } else {
            result = null;
        }
        return result;
    };

    // Get dataset data
    public getObservations = async (
        fileId: string,
        start: number,
        length: number,
        settings: ISettings,
        filterColumns?: string[],
        filterData?: BasicFilter,
    ): Promise<ITableRow[]> => {
        const file = this.openedFiles.find(
            (fileItem) => fileItem.fileId === fileId,
        );
        if (file === undefined) {
            throw new Error(
                'Trying to read metadata from the file which is not opened',
            );
        }

        // Get metadata
        const metadata = await this.getMetadata(fileId);
        if (metadata === null) {
            return [];
        }

        let result: ItemDataArray[] | null;
        if (file.mode === 'remote') {
            result = await this.getObservationsRemote(
                fileId,
                start,
                length,
                filterData,
                metadata.columns,
            );
        } else {
            result = await this.getObservationsLocal(
                fileId,
                start,
                length,
                filterColumns,
                filterData,
                metadata.columns,
            );
        }

        if (result === null) {
            return [];
        }

        // Transform data
        const transformedData = transformData(
            result,
            metadata,
            settings,
            start,
        );

        // TODO: small datasets can be kept without resettings
        this.openedFilesData = {};
        this.openedFilesData[fileId] = transformedData;

        store.dispatch(
            setLoadedRecords({ fileId, records: transformedData.length }),
        );

        return this.openedFilesData[fileId];
    };

    private getObservationsLocal = async (
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: BasicFilter,
        columns?: ColumnMetadata[],
    ) => {
        const result = await window.electron.getData(
            fileId,
            start,
            length,
            filterColumns,
            filterData,
            columns,
        );
        return result;
    };

    private getObservationsRemote = async (
        fileId: string,
        offset?: number,
        limit?: number,
        filterData?: BasicFilter,
        columns?: ColumnMetadata[],
    ): Promise<ItemDataArray[] | null> => {
        let result: ItemDataArray[] | null;
        const file = this.openedFiles.find((item) => item.fileId === fileId);

        if (file === undefined) {
            return null;
        }

        const requestOptions = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        };

        let url: string = `${file.path}`;
        const params: string[] = [];
        if (limit !== undefined) {
            params.push(`limit=${limit}`);
        }
        if (offset !== undefined) {
            params.push(`offset=${offset}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const requestResponse = await window.electron.fetch(
            url,
            requestOptions,
        );

        if ([200, 204].includes(requestResponse.status)) {
            result = requestResponse.response
                .rows as unknown as ItemDataArray[];
        } else {
            result = null;
        }

        if (
            filterData !== undefined &&
            columns !== undefined &&
            result !== null
        ) {
            const filter = new Filter('dataset-json1.1', columns, filterData);
            result = filter.filterDataframe(result);
        }
        return result;
    };

    public getUniqueValues = async (
        fileId: string,
        columnIds: string[],
        limit?: number,
        addCount: boolean = false,
        getAllValues: boolean = false,
    ): Promise<{
        [columnId: string]: {
            values: TableRowValue[];
            counts: { [value: string]: number };
        };
    }> => {
        // Check if the data is already loaded and no filter is needed
        const result = {};
        columnIds.forEach((columnId) => {
            result[columnId] = {
                values: [],
                counts: {},
            };
        });

        const fullyLoaded = this.isFullyLoaded(fileId);

        if (fullyLoaded || getAllValues === false) {
            columnIds.forEach((columnId) => {
                const uniqueValues = this.openedFilesData[fileId]
                    .map((row) => row[columnId])
                    .filter(
                        (value, index, self) => self.indexOf(value) === index,
                    );
                result[columnId] = {
                    values: uniqueValues,
                    counts: {},
                };
            });
            // Get counts if needed
            if (addCount) {
                columnIds.forEach((columnId) => {
                    const counts = {};
                    this.openedFilesData[fileId].forEach((row) => {
                        const rawValue = row[columnId];
                        const value =
                            rawValue === null ? 'null' : String(rawValue);
                        if (counts[value] === undefined) {
                            counts[value] = 1;
                        } else {
                            counts[value] += 1;
                        }
                    });
                    // Sort by counts
                    result[columnId].counts = Object.fromEntries(
                        Object.entries(counts).sort(
                            ([, a], [, b]): number =>
                                (b as number) - (a as number),
                        ),
                    );
                });
            }
            if (limit !== undefined) {
                columnIds.forEach((columnId) => {
                    result[columnId].values = result[columnId].values.slice(
                        0,
                        limit,
                    );
                    result[columnId].counts = Object.fromEntries(
                        Object.entries(result[columnId].counts).slice(0, limit),
                    );
                });
            }
        }

        if (!fullyLoaded && getAllValues) {
            // Get unique values from the file
            const file = this.openedFiles.find(
                (fileItem) => fileItem.fileId === fileId,
            );
            if (file === undefined) {
                throw new Error(
                    'Trying to get unique values from the file which is not opened',
                );
            }
            const uniqueValues = await window.electron.getUniqueValues(
                fileId,
                columnIds,
                limit,
                addCount,
            );
            if (uniqueValues === null) {
                return result;
            }
            return uniqueValues;
        }

        return result;
    };

    // Close file
    public close = async (fileId: string): Promise<boolean> => {
        const file = this.openedFiles.find(
            (fileItem) => fileItem.fileId === fileId,
        );
        if (file === undefined) {
            throw new Error('Trying to close file which is not opened');
        }
        if (this.openedFilesMetadata[fileId] !== undefined) {
            delete this.openedFilesMetadata[fileId];
        }
        if (this.openedFilesData[fileId] !== undefined) {
            delete this.openedFilesData[fileId];
        }
        const fileIndex = this.openedFiles.findIndex(
            (openFile) => openFile.fileId === fileId,
        );
        if (fileIndex !== -1) {
            this.openedFiles.splice(fileIndex, 1);
        }
        if (file.mode === 'remote') {
            return this.closeRemote(fileId);
        }
        return this.closeLocal(fileId);
    };

    private closeLocal = async (fileId: string): Promise<boolean> => {
        const result = await window.electron.closeFile(fileId, 'local');
        return result;
    };

    private closeRemote = async (fileId: string): Promise<boolean> => {
        try {
            const requestOptions = {
                method: 'DELETE',
            };
            const requestResponse = await fetch(
                `http://localhost:8000/jsons/${fileId}`,
                requestOptions,
            );
            if ([200, 204].includes(requestResponse.status)) {
                // Closed succussfully
                return true;
            }
        } catch (error) {
            // Handle exception
        }
        return false;
    };

    // Get all opened files
    public getOpenedFiles = (
        fileId?: string,
    ): {
        fileId: string;
        name: string;
        label: string;
        mode: DatasetMode;
        nCols: number;
        records: number;
        type: DatasetType;
        path: string;
    }[] => {
        // If fileId is not specified return all opened files
        return this.openedFiles
            .filter((file) => (fileId ? file.fileId === fileId : true))
            .map((file) => {
                const metadata = this.openedFilesMetadata[file.fileId];
                return {
                    fileId: file.fileId,
                    name: metadata?.name,
                    label: metadata?.label || '',
                    mode: file.mode,
                    nCols: metadata?.columns.length || 0,
                    records: metadata?.records || 0,
                    type: file.type,
                    path: file.path,
                };
            });
    };

    // Check if a file is fully loaded
    public isFullyLoaded = (fileId: string): boolean => {
        if (this.openedFilesMetadata[fileId] === undefined) {
            throw new Error(
                'Trying to check if file is fully loaded and it is not opened',
            );
        }

        return (
            this.openedFilesMetadata[fileId].records ===
            this.openedFilesData[fileId]?.length
        );
    };

    public getOpenedFileMetadata = (fileId: string): DatasetJsonMetadata => {
        if (this.openedFilesMetadata[fileId] === undefined) {
            throw new Error(
                'Trying to read metadata from the file which is not opened',
            );
        }
        return this.openedFilesMetadata[fileId];
    };

    public getOpenedFileData = (fileId: string): ITableRow[] => {
        if (this.openedFilesData[fileId] === undefined) {
            throw new Error(
                'Trying to read data from the file which is not opened',
            );
        }
        return this.openedFilesData[fileId];
    };

    // Load local store
    public loadLocalStore = async (): Promise<ILocalStore> => {
        const result = await window.electron.loadLocalStore();
        return result;
    };

    // Save local store
    public saveLocalStore = async ({ reduxStore }: { reduxStore: IStore }) => {
        window.electron.saveLocalStore({ reduxStore });
    };

    // Check for updates
    public checkUpdates = async () => {
        const result = await window.electron.checkForUpdates();
        return result;
    };

    // Download update
    public downloadUpdate = async () => {
        const result = await window.electron.downloadUpdate();
        return result;
    };

    // Select files
    public openFileDialog = async (options?: {
        multiple?: boolean;
        initialFolder?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
    }) => {
        const {
            multiple = false,
            initialFolder,
            filters = [{ name: 'All Files', extensions: ['*'] }],
        } = options || {};
        const result = await window.electron.openFileDialog({
            multiple,
            initialFolder,
            filters,
        });
        return result;
    };

    public openDirectoryDialog = async (
        initialFolder: string | null = null,
    ) => {
        const result = await window.electron.openDirectoryDialog(initialFolder);
        return result;
    };

    public getApiAbout = async (
        apiRecord: IApiRecord,
    ): Promise<IApiAbout | null> => {
        let result: IApiAbout | null;

        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            };
            const requestResponse = await window.electron.fetch(
                `${apiRecord.address}/about`,
                requestOptions,
            );

            if ([200, 204].includes(requestResponse.status)) {
                result = requestResponse.response as unknown as IApiAbout;
            } else {
                result = null;
            }
        } catch (error) {
            result = null;
        }
        return result;
    };

    public getApiStudies = async (
        apiRecord: IApiRecord,
    ): Promise<IApiStudy[] | null> => {
        let result: IApiStudy[] | null;

        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            };
            const requestResponse = await window.electron.fetch(
                `${apiRecord.address}/studies`,
                requestOptions,
            );

            if ([200, 204].includes(requestResponse.status)) {
                result = requestResponse.response as unknown as IApiStudy[];
            } else {
                result = null;
            }
        } catch (error) {
            result = null;
        }
        return result;
    };

    public getApiDatasets = async (
        api: IApiRecord,
        study: IApiStudy,
    ): Promise<IApiStudyDataset[] | null> => {
        let result: IApiStudyDataset[] | null;

        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            };
            const requestResponse = await window.electron.fetch(
                `${api.address}${study.href}/datasets`,
                requestOptions,
            );

            if ([200, 204].includes(requestResponse.status)) {
                result = requestResponse.response
                    .datasets as unknown as IApiStudyDataset[];
            } else {
                result = null;
            }
        } catch (error) {
            result = null;
        }
        return result;
    };

    public startTask = async (task: MainTask) => {
        const result = await window.electron.startTask(task);
        return result;
    };

    public subscriteToTaskProgress = (
        callback: (info: TaskProgress) => void,
    ) => {
        window.electron.onTaskProgress(callback);
    };

    public cleanTaskProgressListeners = () => {
        window.electron.cleanTaskProgressListeners();
    };

    public getAppVersion = async (): Promise<string> => {
        const result = await window.electron.getAppVersion();
        return result;
    };

    public startValidation = async ({
        fileId,
        configuration,
        settings,
    }: {
        fileId: string;
        configuration: ValidatorConfig;
        settings: ISettings;
    }): Promise<boolean | { error: string }> => {
        // Get the information about the file
        const file = this.openedFiles.find(
            (fileItem) => fileItem.fileId === fileId,
        );

        if (file === undefined) {
            throw new Error(
                'Trying to start validation on the file which is not opened',
            );
        }

        // Check if conversion is needed;
        const format = file.path.replace(/.*\.\w+/, '$1');

        let conversionTask: ConvertTask | null = null;

        if (format === 'ndjson' || format === 'sas7bdat') {
            // Form a conversion task
            const outputFormat = 'DJ1.1';
            const destinationDir = '__TEMP__';

            const fileInfo: ConvertedFileInfo = {
                fullPath: file.path,
                folder: '',
                filename: file.name,
                format,
                size: 0,
                lastModified: Date.now(),
                datasetJsonVersion: '',
                outputName: `${file.name}.json`,
            };

            conversionTask = {
                type: mainTaskTypes.CONVERT,
                files: [fileInfo],
                idPrefix: 'validator',
                options: {
                    prettyPrint: false,
                    inEncoding: settings.other.inEncoding,
                    outEncoding: settings.other.inEncoding,
                    outputFormat,
                    destinationDir,
                    updateMetadata: false,
                    metadata: {},
                    ...settings.converter,
                },
            };
        }

        // Form a validation task
        const validationTask: ValidateTask = {
            type: mainTaskTypes.VALIDATE,
            options: settings.validator,
            task: 'validate',
            idPrefix: 'validator',
            configuration,
            validationDetails: {
                files: [
                    conversionTask
                        ? conversionTask.options.destinationDir +
                          conversionTask.files[0].outputName
                        : file.path,
                ],
                folders: [],
            },
        };

        // If conversion task is present, execute it first and then validation
        if (conversionTask) {
            const conversionResult = await this.startTask(conversionTask);
            if (conversionResult === true) {
                const validationResult = this.startTask(validationTask);
                return validationResult;
            }

            return conversionResult;
        }
        const validationResult = this.startTask(validationTask);
        return validationResult;
    };
}

export default ApiService;
