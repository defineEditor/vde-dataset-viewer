import { DatasetJsonMetadata, ISettings, ITableRow } from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';

const formatDateToDDMONYYYY = (date: Date, addTime?: boolean): string => {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const monthNames = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
    ];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear().toString();
    if (addTime) {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }
    return `${day}${month}${year}`;
};

const transformData = (
    data: ItemDataArray[],
    metadata: DatasetJsonMetadata,
    settings: ISettings['viewer'],
    start: number,
): ITableRow[] => {
    // Inital rows;
    // If the data is rounded, round the numbers
    const colsToRound: number[] = [];
    if (settings.roundNumbers) {
        metadata.columns.forEach((column, index) => {
            if (['float', 'double', 'decimal'].includes(column.dataType)) {
                colsToRound.push(index);
            }
        });
    }
    const dateColsToFormat: number[] = [];
    if (settings.dateFormat !== 'ISO8601') {
        metadata.columns.forEach((column, index) => {
            if (
                column.dataType === 'date' &&
                ['integer', 'decimal'].includes(column.targetDataType || '')
            ) {
                dateColsToFormat.push(index);
            }
        });
    }
    const datetimeColsToFormat: number[] = [];
    if (settings.dateFormat !== 'ISO8601') {
        metadata.columns.forEach((column, index) => {
            if (
                column.dataType === 'datetime' &&
                ['integer', 'decimal'].includes(column.targetDataType || '')
            ) {
                datetimeColsToFormat.push(index);
            }
        });
    }
    return data.map((row, index) => {
        const newRow: ITableRow = {};
        row.forEach((cell, cellIndex) => {
            if (
                settings.roundNumbers &&
                cell != null &&
                colsToRound.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] = parseFloat(
                    Number(cell).toFixed(settings.maxPrecision),
                );
            } else if (
                settings.dateFormat !== 'ISO8601' &&
                cell != null &&
                dateColsToFormat.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] =
                    formatDateToDDMONYYYY(new Date(cell as string));
            } else if (
                settings.dateFormat !== 'ISO8601' &&
                cell != null &&
                datetimeColsToFormat.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] =
                    formatDateToDDMONYYYY(new Date(cell as string), true);
            } else {
                newRow[metadata.columns[cellIndex].name] = cell;
            }
        });
        // Add row number
        newRow['#'] = index + 1 + start;
        return newRow;
    });
};

export default transformData;
