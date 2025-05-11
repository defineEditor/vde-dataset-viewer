import { DatasetJsonMetadata, ISettings, ITableRow } from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import {
    sasDateToJsDate,
    sasDatetimeToJsDate,
    formatDateToDDMONYYYY,
    sasTimeToComponents,
} from 'renderer/utils/transformUtils';

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

    const numericDateColsToFormat: number[] = [];
    const numericTimeColsToFormat: number[] = [];
    const numericDatetimeColsToFormat: number[] = [];
    if (settings.viewer.applyDateFormat) {
        metadata.columns.forEach((column, index) => {
            if (!column.displayFormat) {
                return;
            }

            const updatedDisplayFormat = column.displayFormat
                .toUpperCase()
                .replace(/(.+?)\d*(\.\d*)?$/, '$1');

            // Check for numeric variables with date formats
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                settings.converter.dateFormats.includes(updatedDisplayFormat)
            ) {
                numericDateColsToFormat.push(index);
            }

            // Check for numeric variables with time formats
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                settings.converter.timeFormats.includes(updatedDisplayFormat)
            ) {
                numericTimeColsToFormat.push(index);
            }

            // Check for numeric variables with datetime formats
            if (
                ['integer', 'float', 'double', 'decimal'].includes(
                    column.dataType,
                ) &&
                settings.converter.datetimeFormats.includes(
                    updatedDisplayFormat,
                )
            ) {
                numericDatetimeColsToFormat.push(index);
            }
        });
    }

    return data.map((row, index) => {
        const newRow: ITableRow = {};
        row.forEach((cell, cellIndex) => {
            // Round values
            if (
                settings.viewer.roundNumbers &&
                cell != null &&
                colsToRound.includes(cellIndex)
            ) {
                newRow[metadata.columns[cellIndex].name] = parseFloat(
                    Number(cell).toFixed(settings.viewer.maxPrecision),
                );
            }

            // Convert numeric dates to character format
            if (
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
