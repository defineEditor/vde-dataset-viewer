/* eslint-disable no-redeclare */
import { DatasetJsonMetadata, ISettings, ITableRow } from 'interfaces/common';
import { ItemDataArray } from 'js-stream-dataset-json';
import {
    sasDateToJsDate,
    sasDatetimeToJsDate,
    formatDateToDDMONYYYY,
    sasTimeToComponents,
} from 'renderer/utils/transformUtils';

function transformData(
    data: ItemDataArray[],
    metadata: DatasetJsonMetadata,
    settings: ISettings,
    start: number,
    type: 'array',
): {
    data: ItemDataArray[];
    isTransformed: boolean;
};

function transformData(
    data: ItemDataArray[],
    metadata: DatasetJsonMetadata,
    settings: ISettings,
    start: number,
    type: 'object',
): {
    data: ITableRow[];
    isTransformed: boolean;
};

function transformData(
    data: ItemDataArray[],
    metadata: DatasetJsonMetadata,
    settings: ISettings,
    start: number,
    type: 'array' | 'object',
): {
    data: ITableRow[] | ItemDataArray[];
    isTransformed: boolean;
} {
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

    const isTransformed =
        colsToRound.length > 0 ||
        numericDateColsToFormat.length > 0 ||
        numericTimeColsToFormat.length > 0 ||
        numericDatetimeColsToFormat.length > 0;

    if (!isTransformed && type === 'array') {
        // Nothing to change
        return { data, isTransformed };
    }

    const newData = data.map((row, index) => {
        const newRow: ITableRow | ItemDataArray = type === 'array' ? [] : {};
        row.forEach((cell, cellIndex) => {
            // Round values
            let newCell = cell;
            if (
                settings.viewer.roundNumbers &&
                cell != null &&
                colsToRound.includes(cellIndex)
            ) {
                newCell = parseFloat(
                    Number(cell).toFixed(settings.viewer.maxPrecision),
                );
            }

            // Convert numeric dates to character format
            if (
                settings.viewer.applyDateFormat &&
                cell != null &&
                numericDateColsToFormat.includes(cellIndex)
            ) {
                // Convert numeric SAS date to character format
                const dateValue = sasDateToJsDate(Number(cell));
                newCell =
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
                newCell = `${hours}:${minutes}:${seconds}`;
            } else if (
                settings.viewer.applyDateFormat &&
                cell != null &&
                numericDatetimeColsToFormat.includes(cellIndex)
            ) {
                // Convert numeric SAS datetime to character format
                const datetimeValue = sasDatetimeToJsDate(Number(cell));
                newCell =
                    settings.viewer.dateFormat === 'DDMONYEAR'
                        ? formatDateToDDMONYYYY(datetimeValue, true)
                        : datetimeValue
                              .toISOString()
                              .replace('T', ' ')
                              .split('.')[0];
            }

            if (type === 'array') {
                newRow[cellIndex] = newCell;
            } else {
                newRow[metadata.columns[cellIndex].name] = newCell;
            }
        });
        if (type === 'object') {
            // Add row number
            newRow['#'] = index + 1 + start;
        }
        return newRow;
    });

    return {
        data: newData as ITableRow[] | ItemDataArray[],
        isTransformed,
    };
}

export default transformData;
