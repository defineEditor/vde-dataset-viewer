import {
    ItemGroupData,
    ItemDataArray,
    DatasetJsonMetadata,
    DatasetType,
    Filter,
    ILocalStore,
    IStore,
} from 'interfaces/common';
import DatasetJson from 'js-stream-dataset-json';
import store from 'renderer/redux/store';

interface IOpenFile {
    fileId: string;
    type: DatasetType;
    path: string;
    datasetNames?: string[];
}

class ApiService {
    // Open file
    public openFile = async (mode: 'local' | 'remote'): Promise<IOpenFile> => {
        if (mode === 'remote') {
            return this.openFileRemote();
        }
        return this.openFileLocal();
    };

    private openFileLocal = async (): Promise<IOpenFile> => {
        // Read encoding from state
        const encoding = store.getState().settings.other.inEncoding;
        const response = await window.electron.openFile('local', { encoding });
        if (response === null) {
            return { fileId: '', type: 'json', path: '' };
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
        mode: 'local' | 'remote',
        fileId: string,
    ): Promise<DatasetJsonMetadata> => {
        if (mode === 'remote') {
            return this.getMetadataRemote(fileId, '');
        }
        return this.getMetadataLocal(fileId);
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
        mode: 'local' | 'remote',
        fileId: string,
        start: number,
        length: number,
        filterColumns?: string[],
        filterData?: Filter,
    ): Promise<ItemDataArray[]> => {
        if (mode === 'remote') {
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

    // Load local store
    public loadLocalStore = async (): Promise<ILocalStore> => {
        const result = await window.electron.loadLocalStore();
        return result;
    };

    // Save local store
    public saveLocalStore = async ({ reduxStore }: { reduxStore: IStore }) => {
        window.electron.saveLocalStore({ reduxStore });
    };
}

export default ApiService;
