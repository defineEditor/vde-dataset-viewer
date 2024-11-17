import {
    ItemGroupData,
    ItemDataArray,
    DatasetJsonData,
    DatasetJsonMetadata,
} from 'interfaces/common';
import DatasetJson from 'js-stream-dataset-json';

class ApiService {
    private mode: 'local' | 'remote';

    constructor(mode: 'local' | 'remote') {
        this.mode = mode;
    }

    // Open file
    public openFile = async (): Promise<{
        fileId: string;
        datasetNames?: string[];
    }> => {
        if (this.mode === 'remote') {
            return this.openFileRemote();
        }
        return this.openFileLocal();
    };

    private openFileLocal = async (): Promise<{
        fileId: string;
    }> => {
        const fileId: string = await window.electron.openFile('local');
        const result = { fileId };
        return result;
    };

    private openFileRemote = async (): Promise<{
        fileId: string;
        datasetNames: string[];
    }> => {
        let result = { fileId: '', datasetNames: [] };
        try {
            // Get the file path
            let fileId = '';
            let datasetNames = [];
            const filePath: string = await window.electron.openFile('remote');
            // Request to open the file
            if (filePath !== undefined) {
                // Check if the dataset is already open
                let openFiles: {
                    [name: string]: { name: string; path: string };
                } = {};
                const openFilesResp = await fetch(
                    'http://localhost:8000/jsons'
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
                        requestOptions
                    );
                    if ([200, 204].includes(requestResponse.status)) {
                        fileId = await requestResponse.text();
                    }
                }
                if (fileId !== '') {
                    // Get the list of datasets
                    const requestResponseGet = await fetch(
                        `http://localhost:8000/jsons/${fileId}/datasets`,
                        { method: 'GET' }
                    );
                    if ([200, 204].includes(requestResponseGet.status)) {
                        datasetNames = await requestResponseGet.json();
                    }
                    result = { fileId, datasetNames };
                }
            }
        } catch {
            // Handle exception
        }
        return result;
    };

    // Get dataset metadata
    public getMetadata = async (
        fileId: string
    ): Promise<DatasetJsonMetadata> => {
        let result: DatasetJsonMetadata;
        if (this.mode === 'remote') {
            result = await this.getMetadataRemote(fileId, '');
        }
        result = await this.getMetadataLocal(fileId);
        return result;
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
                { method: 'GET' }
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
        query = ''
    ): Promise<DatasetJsonData> => {
        if (this.mode === 'remote') {
            return this.getObservationsRemote(
                fileId,
                '',
                Math.trunc(start / length) + 1,
                length,
                query
            );
        }
        return this.getObservationsLocal(fileId, start, length);
    };

    private getObservationsLocal = async (
        fileId: string,
        start: number,
        length: number
    ) => {
        const result = await window.electron.getData(fileId, start, length);
        return result;
    };

    private getObservationsRemote = async (
        fileId: string,
        datasetName: string,
        page: number,
        pageSize: number,
        query = ''
    ) => {
        let result;
        try {
            const requestOptions = {
                method: 'GET',
            };
            const requestResponse = await fetch(
                `http://localhost:8000/jsons/${fileId}/datasets/${datasetName}/observations?page=${page}&page_size=${pageSize}&query=${query}`,
                requestOptions
            );
            if ([200, 204].includes(requestResponse.status)) {
                result =
                    (await requestResponse.json()) as unknown as Array<ItemDataArray>;
            }
        } catch (error) {
            // Handle exception
        }
        return result as unknown as ReturnType<
            Awaited<InstanceType<typeof DatasetJson>['getData']>
        >;
    };

    // Close file
    public close = async (fileId: string): Promise<boolean> => {
        if (this.mode === 'remote') {
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
                requestOptions
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
}

export default ApiService;
