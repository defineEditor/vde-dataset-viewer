import {
    DatasetJsonMetadata,
    IGeneralTableHeaderCell,
    ITableData,
    DatasetType,
} from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import ApiService from 'renderer/services/ApiService';

// Get dataset records;
const getData = async (
    apiService: ApiService,
    fileId: string,
    start: number,
    pageSize: number,
): Promise<ITableData | null> => {
    const metadata = await apiService.getMetadata(fileId);
    if (Object.keys(metadata).length === 0) {
        return null;
    }

    const itemData = (await apiService.getObservations(
        fileId,
        start,
        pageSize,
    )) as ItemDataArray[];

    const rawHeader = metadata.columns;

    const newHeader: IGeneralTableHeaderCell[] = rawHeader.map((item) => {
        return {
            id: item.name,
            label: item.label,
        };
    });

    return { header: newHeader, metadata, data: itemData };
};

// Open new dataset;
const openNewDataset = async (
    apiService: ApiService,
): Promise<{
    fileId: string;
    metadata: DatasetJsonMetadata;
    type: DatasetType;
    path: string;
} | null> => {
    const result = await apiService.openFile();
    // There was an error reading the file or the operation was cancelled
    if (result === null || result.fileId === '') {
        return null;
    }
    const { fileId, type, path } = result;
    const metadata = await apiService.getMetadata(fileId);
    return { fileId, metadata, type, path };
};

export { getData, openNewDataset };
