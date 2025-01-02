import {
    ItemGroupData,
    ItemDataArray,
    DatasetJsonMetadata,
    DatasetType,
    IOpenFile,
    Filter,
    ILocalStore,
    IStore,
    IOpenFileWithMetadata,
} from 'interfaces/common';
import DatasetJson from 'js-stream-dataset-json';
import store from 'renderer/redux/store';

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

    // Open file
    public openFile = async (
        mode: 'local' | 'remote',
        filePath?: string,
        folderPath?: string,
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
                return { ...foundFileData, metadata };
            }
        }
        if (mode === 'remote') {
            fileData = await this.openFileRemote();
        } else {
            fileData = await this.openFileLocal(filePath, folderPath);
        }

        if (fileData.errorMessage) {
            // If error was found do not add it to the list of opened files
            return { ...fileData, metadata: {} as DatasetJsonMetadata };
        }

        this.openedFiles.push({
            fileId: fileData.fileId,
            path: fileData.path,
            type: fileData.type,
            mode,
            name: fileData.path,
        });

        // Get metadata
        const metadata = await this.getMetadata(fileData.fileId);

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

    private openFileRemote = async (): Promise<IOpenFile> => {
        let result: IOpenFile = {
            fileId: '',
            type: 'json',
            path: '',
            datasetNames: [],
        };
        try {
            // Get the file path
            let fileId = '';
            let datasetNames = [];
            const response = await window.electron.openFile('remote');
            if (response === null) {
                throw new Error('Error opening the file');
            }
            const filePath = response.fileId;
            // Request to open the file
            if (filePath !== undefined) {
                // Check if the dataset is already open
                let openFiles: {
                    [name: string]: { name: string; path: string };
                } = {};
                const openFilesResp = await fetch(
                    'http://localhost:8000/jsons',
                );
                if ([200, 204].includes(openFilesResp.status)) {
                    openFiles = (await openFilesResp.json()) as unknown as {
                        [name: string]: { name: string; path: string };
                    };
                }

                const isOpened = Object.keys(openFiles).some((id) => {
                    const file = openFiles[id];
                    if (file.path === filePath) {
                        fileId = id;
                        return true;
                    }
                    return false;
                });

                if (!isOpened) {
                    const requestOptions = {
                        method: 'POST',
                        body: JSON.stringify({ path: filePath }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    };
                    const requestResponse = await fetch(
                        'http://localhost:8000/jsons',
                        requestOptions,
                    );
                    if ([200, 204].includes(requestResponse.status)) {
                        fileId = await requestResponse.text();
                    }
                }
                if (fileId !== '') {
                    // Get the list of datasets
                    const requestResponseGet = await fetch(
                        `http://localhost:8000/jsons/${fileId}/datasets`,
                        { method: 'GET' },
                    );
                    if ([200, 204].includes(requestResponseGet.status)) {
                        datasetNames = await requestResponseGet.json();
                    }
                    result = {
                        fileId,
                        type: 'json',
                        datasetNames,
                        path: filePath,
                    };
                }
            }
        } catch {
            // Handle exception
        }
        return result;
    };

    // Get dataset metadata
    public getMetadata = async (
        fileId: string,
    ): Promise<DatasetJsonMetadata> => {
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
        let metadata: DatasetJsonMetadata;
        if (file.mode === 'remote') {
            metadata = await this.getMetadataRemote(fileId, '');
        } else {
            metadata = await this.getMetadataLocal(fileId);
        }

        // Save metadata
        this.openedFilesMetadata[fileId] = metadata;

        return metadata;
    };

    private getMetadataLocal = async (fileId: string) => {
        const result = await window.electron.getMetadata(fileId);
        return result;
    };

    private getMetadataRemote = async (fileId: string, datasetName: string) => {
        let result;
        try {
            const requestResponse = await fetch(
                `http://localhost:8000/jsons/${fileId}/datasets/${datasetName}/metadata`,
                { method: 'GET' },
            );
            if ([200, 204].includes(requestResponse.status)) {
                result =
                    (await requestResponse.json()) as unknown as ItemGroupData;
            }
        } catch {
            // Handle exception
        }
        return {
            itemGroupMetadata: result,
            dataMetadata: {},
        } as unknown as ReturnType<
            InstanceType<typeof DatasetJson>['getMetadata']
        >;
    };

    // Get dataset data
    public getObservations = async (
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: Filter,
    ): Promise<ItemDataArray[]> => {
        const file = this.openedFiles.find(
            (fileItem) => fileItem.fileId === fileId,
        );
        if (file === undefined) {
            throw new Error(
                'Trying to read metadata from the file which is not opened',
            );
        }
        if (file.mode === 'remote') {
            return this.getObservationsRemote(
                fileId,
                '',
                Math.trunc(start / length) + 1,
                length,
                filterColumns,
                filterData,
            );
        }
        return this.getObservationsLocal(
            fileId,
            start,
            length,
            filterColumns,
            filterData,
        );
    };

    private getObservationsLocal = async (
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: Filter,
    ) => {
        const result = await window.electron.getData(
            fileId,
            start,
            length,
            filterColumns,
            filterData,
        );
        return result;
    };

    private getObservationsRemote = async (
        fileId: string,
        datasetName: string,
        page: number,
        pageSize: number,
        _filterColumns?: string[],
        _filterData?: Filter,
    ) => {
        let result;
        try {
            const requestOptions = {
                method: 'GET',
            };
            const requestResponse = await fetch(
                `http://localhost:8000/jsons/${fileId}/datasets/${datasetName}/observations?page=${page}&page_size=${pageSize}`,
                requestOptions,
            );
            if ([200, 204].includes(requestResponse.status)) {
                result =
                    (await requestResponse.json()) as unknown as Array<ItemDataArray>;
            }
        } catch (error) {
            // Handle exception
        }
        return result as ItemDataArray[];
    };

    // Close file
    public close = async (
        mode: 'local' | 'remote',
        fileId: string,
    ): Promise<boolean> => {
        if (this.openedFilesMetadata[fileId] !== undefined) {
            delete this.openedFilesMetadata[fileId];
        }
        const fileIndex = this.openedFiles.findIndex(
            (file) => file.fileId === fileId,
        );
        if (fileIndex !== -1) {
            this.openedFiles.splice(fileIndex, 1);
        }
        if (mode === 'remote') {
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
    public getOpenedFiles = (): {
        fileId: string;
        name: string;
        label: string;
        nCols: number;
        records: number;
    }[] => {
        return this.openedFiles.map((file) => {
            const metadata = this.openedFilesMetadata[file.fileId];
            return {
                fileId: file.fileId,
                name: metadata?.name,
                label: metadata?.label || '',
                nCols: metadata?.columns.length || 0,
                records: metadata?.records || 0,
            };
        });
    };

    public getOpenedFileMetadata = (fileId: string): DatasetJsonMetadata => {
        return this.openedFilesMetadata[fileId];
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
}

export default ApiService;
