import {
    DatasetJsonMetadata,
    IHeaderCell,
    ITableData,
    BasicFilter,
    IOpenFileWithMetadata,
    ISettings,
    ITableRow,
} from 'interfaces/common';
import ApiService from 'renderer/services/ApiService';

export const getHeader = (
    metadata: DatasetJsonMetadata,
    settings: ISettings,
): IHeaderCell[] => {
    return metadata.columns.map((item) => {
        if (
            item.displayFormat &&
            settings.viewer.applyDateFormat &&
            ['integer', 'float', 'double', 'decimal'].includes(item.dataType)
        ) {
            // Check if the displayFormat is a date, time, or datetime format
            let numericDatetimeType: 'date' | 'datetime' | 'time' | null = null;

            const updatedDisplayFormat = item.displayFormat
                .toUpperCase()
                .replace(/(.+?)\d*(\.\d*)$/, '$1');

            // Check for numeric variables with date formats
            if (settings.converter.dateFormats.includes(updatedDisplayFormat)) {
                numericDatetimeType = 'date';
            }

            // Check for numeric variables with time formats
            if (settings.converter.timeFormats.includes(updatedDisplayFormat)) {
                numericDatetimeType = 'time';
            }

            // Check for numeric variables with datetime formats
            if (
                settings.converter.datetimeFormats.includes(
                    updatedDisplayFormat,
                )
            ) {
                numericDatetimeType = 'datetime';
            }
            if (numericDatetimeType !== null) {
                return {
                    id: item.name,
                    label: item.label,
                    type: item.dataType,
                    numericDatetimeType,
                };
            }
        }

        return {
            id: item.name,
            label: item.label,
            type: item.dataType,
        };
    });
};

// Get dataset records;
const getData = async (
    apiService: ApiService,
    fileId: string,
    start: number,
    length: number,
    settings: ISettings,
    filterColumns?: string[],
    filterData?: BasicFilter,
): Promise<ITableData | null> => {
    const metadata = await apiService.getMetadata(fileId);
    if (metadata === null || Object.keys(metadata).length === 0) {
        return null;
    }

    const startTime = performance.now();

    const itemData = (await apiService.getObservations(
        fileId,
        start,
        length,
        settings,
        filterColumns,
        filterData,
    )) as ITableRow[];

    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken to fetch data: ${timeTaken / 1000} seconds`);

    const newHeader = getHeader(metadata, settings);

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
    const { fileId, type, path, errorMessage } = result;
    if (errorMessage) {
        // There was an error reading the file or the operation was cancelled
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
