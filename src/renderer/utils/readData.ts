import {
    DatasetJsonMetadata,
    IGeneralTableHeaderCell,
    ITableData,
    DatasetType,
    Filter,
} from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import ApiService from 'renderer/services/ApiService';

// Get dataset records;
const getData = async (
    apiService: ApiService,
    mode: 'local' | 'remote',
    fileId: string,
    start: number,
    length: number,
    filterColumns?: string[],
    filterData?: Filter,
): Promise<ITableData | null> => {
    const metadata = await apiService.getMetadata(mode, fileId);
    if (Object.keys(metadata).length === 0) {
        return null;
    }

    const itemData = (await apiService.getObservations(
        mode,
        fileId,
        start,
        length,
        filterColumns,
        filterData,
    )) as ItemDataArray[];

    const rawHeader = metadata.columns;

    const newHeader: IGeneralTableHeaderCell[] = rawHeader.map((item) => {
        return {
            id: item.name,
            label: item.label,
        };
    });

    return {
        header: newHeader,
        metadata,
        data: itemData,
        appliedFilter: filterData || null,
    };
};

// Open new dataset;
const openNewDataset = async (
    apiService: ApiService,
    mode: 'local' | 'remote',
): Promise<{
    fileId: string;
    metadata: DatasetJsonMetadata;
    type: DatasetType;
    path: string;
} | null> => {
    const result = await apiService.openFile(mode);
    // There was an error reading the file or the operation was cancelled
    if (result === null || result.fileId === '') {
        return null;
    }
    const { fileId, type, path } = result;
    const metadata = await apiService.getMetadata(mode, fileId);
    return { fileId, metadata, type, path };
};

export { getData, openNewDataset };
