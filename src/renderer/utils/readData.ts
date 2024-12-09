import {
    DatasetJsonMetadata,
    IGeneralTableHeaderCell,
    ITableData,
    DatasetType,
} from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import ApiService from 'renderer/services/ApiService';

/*
const BUFFER_SIZE = 10000;
const PAGE_SIZE = 1000;
const PAGE_BUFFER = 4;
const readAdditionalData = async ({
    currentPage,
    rowsPerPage,
    data,
    setData,
    header,
    fileId,
}: {
    currentPage: number;
    rowsPerPage: number;
    data: IData;
    setData: React.Dispatch<React.SetStateAction<IData>>;
    header: IGeneralTableHeaderCell[];
    fileId: string;
}) => {
    // Check if is is needed to read the next or the previous records or no records at all;
    let type: 'next' | 'prev';
    if (Math.max(0, currentPage - PAGE_BUFFER) * rowsPerPage < data.startRow) {
        // Case when it is needed to read the previous records
        type = 'prev';
    } else if (
        Math.max(0, currentPage + PAGE_BUFFER) * rowsPerPage >
        data.endRow
    ) {
        // Case when it is needed to read the following records
        type = 'next';
    } else {
        return;
    }

    // The page which will be requested
    const startPage =
        Math.floor(
            ((currentPage + (type === 'prev' ? -PAGE_BUFFER : PAGE_BUFFER)) *
                rowsPerPage) /
                PAGE_SIZE
        ) + 1;

    const newDataRaw = await apiService.getObservations(
        fileId,
        startPage,
        PAGE_SIZE
    );

    if (newDataRaw === undefined) {
        return;
    }

    let newObservations = newDataRaw;

    let oldObservations = data.observations;

    let newStartRow = 0;
    let newEndRow = 0;
    if (type === 'prev') {
        newStartRow = (startPage - 1) * rowsPerPage;
        // Determine if new records overlap with already loaded records
        if ((startPage - 1) * PAGE_SIZE >= data.startRow) {
            // Overlap
            if (newStartRow + BUFFER_SIZE < data.endRow) {
                // Remove some observations from the old data
                newEndRow = newStartRow + BUFFER_SIZE;
                oldObservations = oldObservations.slice(
                    0,
                    newStartRow - data.startRow
                );
            } else {
                newEndRow = data.endRow;
            }
        } else {
            // No overlap
            newEndRow = startPage * PAGE_SIZE;
            oldObservations = [];
        }
        newObservations = newObservations.concat(oldObservations);
    } else if (type === 'next') {
        // Case when it is needed to read the following records
        newEndRow = startPage * PAGE_SIZE;
        // Determine if new records overlap with already loaded records
        if ((startPage - 1) * PAGE_SIZE <= data.endRow) {
            // Overlap
            if (newEndRow - BUFFER_SIZE > data.startRow) {
                // Remove some observations from the old data
                newStartRow = newEndRow - BUFFER_SIZE;
                oldObservations = oldObservations.slice(
                    newStartRow - data.startRow
                );
            } else {
                newStartRow = data.startRow;
            }
        } else {
            // No overlap
            newStartRow = (startPage - 1) * rowsPerPage;
            oldObservations = [];
        }
        newObservations = oldObservations.concat(newObservations);
    }

    setData({
        observations: newObservations,
        startRow: newStartRow,
        endRow: newEndRow,
    });
};
*/

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
} | null> => {
    const result = await apiService.openFile();
    // There was an error reading the file
    if (result === null) {
        return null;
    }
    const { fileId, type } = result;
    const metadata = await apiService.getMetadata(fileId);
    return { fileId, metadata, type };
};

export { getData, openNewDataset };
