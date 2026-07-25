import {
    DatasetJsonMetadata,
    ISettings,
    ColumnType,
} from '@/interfaces/common';
import { getHeader } from '@/renderer/utils/readData';

const getColumnTypes = (
    metadata: DatasetJsonMetadata,
    settings: ISettings,
): Record<string, ColumnType> => {
    const types: Record<string, ColumnType> = {};
    const header = getHeader(metadata, settings);
    // Get all columns with formatted dates;
    const dateColumns = header
        .filter((column) => column.numericDatetimeType)
        .map((column) => column.id);
    metadata.columns.forEach((column) => {
        if (column.dataType === 'boolean') {
            types[column.name.toLowerCase()] = 'boolean';
        } else if (
            ['float', 'double', 'integer'].includes(column.dataType) &&
            !dateColumns.includes(column.name)
        ) {
            types[column.name.toLowerCase()] = 'number';
        } else if (
            ['date', 'datetime', 'time'].includes(column.dataType) &&
            !dateColumns.includes(column.name)
        ) {
            types[column.name.toLowerCase()] = 'date';
        } else {
            types[column.name.toLowerCase()] = 'string';
        }
    });
    return types;
};

export default getColumnTypes;
