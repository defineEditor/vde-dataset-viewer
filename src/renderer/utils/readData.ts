import {
    DatasetJsonMetadata,
    IGeneralTableHeaderCell,
    ITableData,
    Filter,
    IOpenFileWithMetadata,
} from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import ApiService from 'renderer/services/ApiService';

// Get dataset records;
const getData = async (
    apiService: ApiService,
    fileId: string,
    start: number,
    length: number,
    filterColumns?: string[],
    filterData?: Filter,
): Promise<ITableData | null> => {
    const metadata = await apiService.getMetadata(fileId);
    if (Object.keys(metadata).length === 0) {
        return null;
    }

    const itemData = (await apiService.getObservations(
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
            type: item.dataType,
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
    filePath?: string,
    folderPath?: string,
): Promise<IOpenFileWithMetadata> => {
    const result = await apiService.openFile(mode, filePath, folderPath);
    // There was an error reading the file or the operation was cancelled
    const { fileId, type, path, errorMessage } = result;
    if (errorMessage) {
        return {
            fileId,
            metadata: {} as DatasetJsonMetadata,
            type,
            path,
            errorMessage,
        };
    }
    return result;
};

export { getData, openNewDataset };
