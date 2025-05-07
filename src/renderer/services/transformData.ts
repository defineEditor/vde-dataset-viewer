import { DatasetJsonMetadata, ISettings, ITableRow } from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';

// Constants for epoch conversion
// SAS epoch is January 1, 1960
// Unix epoch is January 1, 1970
const SECONDS_PER_DAY = 86400;
const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * 1000;
const DAYS_BETWEEN_EPOCHS = 3653; // Days between 1960-01-01 and 1970-01-01 (10 years + 2 leap days)

// Convert SAS date (days since 1960-01-01) to JavaScript Date
const sasDateToJsDate = (sasDate: number): Date => {
    // Convert SAS date (days since 1960-01-01) to days since Unix epoch (1970-01-01)
    const unixDays = sasDate - DAYS_BETWEEN_EPOCHS;
    // Convert days to milliseconds and create a JavaScript Date
    return new Date(unixDays * MILLISECONDS_PER_DAY);
};

// Convert SAS time (seconds since midnight) to JavaScript Date components
const sasTimeToComponents = (
    sasTime: number,
): { hours: string; minutes: string; seconds: string } => {
    const totalSeconds = Math.round(sasTime);
    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');
    return { hours, minutes, seconds };
};

// Convert SAS datetime (seconds since 1960-01-01) to JavaScript Date
const sasDatetimeToJsDate = (sasDatetime: number): Date => {
    // Convert SAS datetime (seconds since 1960-01-01) to milliseconds since Unix epoch
    const unixMilliseconds =
        (sasDatetime - DAYS_BETWEEN_EPOCHS * SECONDS_PER_DAY) * 1000;
    return new Date(unixMilliseconds);
};

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
    settings: ISettings,
    start: number,
): ITableRow[] => {
    // Inital rows;
    // If the data is rounded, round the numbers
    const colsToRound: number[] = [];
    if (settings.viewer.roundNumbers) {
        metadata.columns.forEach((column, index) => {
            if (['float', 'double', 'decimal'].includes(column.dataType)) {
                colsToRound.push(index);
            }
        });
    }
    const dateColsToFormat: number[] = [];
    if (settings.viewer.dateFormat !== 'ISO8601') {
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
    if (settings.viewer.dateFormat !== 'ISO8601') {
        metadata.columns.forEach((column, index) => {
            if (
                column.dataType === 'datetime' &&
                ['integer', 'decimal'].includes(column.targetDataType || '')
            ) {
                datetimeColsToFormat.push(index);
            }
        });
    }

    // Add support for numeric variables with date formats
    const numericDateColsToFormat: number[] = [];
    if (settings.viewer.applyDateFormat) {
        metadata.columns.forEach((column, index) => {
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                column.displayFormat &&
                settings.converter.dateFormats.includes(column.displayFormat)
            ) {
                numericDateColsToFormat.push(index);
            }
        });
    }

    // Add support for numeric variables with time formats
    const numericTimeColsToFormat: number[] = [];
    if (settings.viewer.applyDateFormat) {
        metadata.columns.forEach((column, index) => {
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                column.displayFormat &&
                settings.converter.timeFormats.includes(column.displayFormat)
            ) {
                numericTimeColsToFormat.push(index);
            }
        });
    }

    // Add support for numeric variables with datetime formats
    const numericDatetimeColsToFormat: number[] = [];
    if (settings.viewer.applyDateFormat) {
        metadata.columns.forEach((column, index) => {
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                column.displayFormat &&
                settings.converter.datetimeFormats.includes(
                    column.displayFormat,
                )
            ) {
                numericDatetimeColsToFormat.push(index);
            }
        });
    }

    return data.map((row, index) => {
        const newRow: ITableRow = {};
        row.forEach((cell, cellIndex) => {
            if (
                settings.viewer.roundNumbers &&
                cell != null &&
                colsToRound.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] = parseFloat(
                    Number(cell).toFixed(settings.viewer.maxPrecision),
                );
            } else if (
                settings.viewer.dateFormat !== 'ISO8601' &&
                cell != null &&
                dateColsToFormat.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] =
                    formatDateToDDMONYYYY(new Date(cell as string));
            } else if (
                settings.viewer.dateFormat !== 'ISO8601' &&
                cell != null &&
                datetimeColsToFormat.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] =
                    formatDateToDDMONYYYY(new Date(cell as string), true);
            } else if (
                settings.viewer.applyDateFormat &&
                cell != null &&
                numericDateColsToFormat.includes(cellIndex)
            ) {
                // Convert numeric SAS date to character format
                const dateValue = sasDateToJsDate(Number(cell));
                newRow[metadata.columns[cellIndex].name] =
                    settings.viewer.dateFormat === 'DDMONYEAR'
                        ? formatDateToDDMONYYYY(dateValue)
                        : dateValue.toISOString().split('T')[0];
            } else if (
                settings.viewer.applyDateFormat &&
                cell != null &&
                numericTimeColsToFormat.includes(cellIndex)
            ) {
                // Convert numeric SAS time to character format
                const { hours, minutes, seconds } = sasTimeToComponents(
                    Number(cell),
                );
                newRow[metadata.columns[cellIndex].name] =
                    `${hours}:${minutes}:${seconds}`;
            } else if (
                settings.viewer.applyDateFormat &&
                cell != null &&
                numericDatetimeColsToFormat.includes(cellIndex)
            ) {
                // Convert numeric SAS datetime to character format
                const datetimeValue = sasDatetimeToJsDate(Number(cell));
                newRow[metadata.columns[cellIndex].name] =
                    settings.viewer.dateFormat === 'DDMONYEAR'
                        ? formatDateToDDMONYYYY(datetimeValue, true)
                        : datetimeValue
                              .toISOString()
                              .replace('T', ' ')
                              .split('.')[0];
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
