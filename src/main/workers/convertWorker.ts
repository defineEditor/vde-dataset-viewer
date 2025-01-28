import { ConvertedFileInfo, ConvertTask } from 'interfaces/main';
import DatasetXpt from 'xport-js';
import DatasetJson, { ItemDataArray } from 'js-stream-dataset-json';
import path from 'path';
import { DatasetJsonMetadata, ItemType } from 'interfaces/common';

const processXptMetadata = (
    metadata: DatasetJsonMetadata,
    options: ConvertTask['options'],
): DatasetJsonMetadata => {
    const newColumns = metadata.columns.map((column) => {
        const newColumn = { ...column };

        // Make ItemOID more unique
        if (newColumn.itemOID === newColumn.name) {
            newColumn.itemOID = `IT.${metadata.name.toUpperCase()}.${newColumn.name}`;
        }

        // Remove display format like $12.
        if (
            newColumn.displayFormat &&
            /^\$\d+\.?$/.test(newColumn.displayFormat)
        ) {
            delete newColumn.displayFormat;
        }
        // Remove length for numeric datatypes
        if (['integer', 'float', 'double'].includes(newColumn.dataType)) {
            delete newColumn.length;
        }
        // Identify numeric columns which should be converted to datetime;
        // Identify using displayFormat
        const { dateFormats, timeFormats, datetimeFormats } = options;
        if (
            ['double', 'integer'].includes(newColumn.dataType) &&
            newColumn.displayFormat
        ) {
            // Remove w.d part from display format
            const updatedDisplayFormat = newColumn.displayFormat.replace(
                /^(.*?)\d+\.?\d*$/,
                '$1',
            );
            if (dateFormats.includes(updatedDisplayFormat)) {
                newColumn.dataType = 'date';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            } else if (timeFormats.includes(updatedDisplayFormat)) {
                newColumn.dataType = 'time';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            } else if (datetimeFormats.includes(updatedDisplayFormat)) {
                newColumn.dataType = 'datetime';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            }
        }
        // Indeentify using column name suffix
        const { convertSuffixDt, convertSuffixDtTm, convertSuffixTm } = options;
        if (
            ['double', 'integer'].includes(newColumn.dataType) &&
            (convertSuffixDt || convertSuffixTm || convertSuffixDtTm)
        ) {
            if (
                convertSuffixDt &&
                newColumn.name.toLowerCase().endsWith('dt')
            ) {
                newColumn.dataType = 'date';
                newColumn.targetDataType = 'integer';
            } else if (
                convertSuffixTm &&
                newColumn.name.toLowerCase().endsWith('tm')
            ) {
                newColumn.dataType = 'time';
                newColumn.targetDataType = 'integer';
            } else if (
                convertSuffixDtTm &&
                newColumn.name.toLowerCase().endsWith('dtm')
            ) {
                newColumn.dataType = 'datetime';
                newColumn.targetDataType = 'integer';
            }
        }
        return newColumn;
    });

    const newMetadata = { ...metadata, columns: newColumns };
    return newMetadata;
};

const convertXptDateTime = (value: number, type: ItemType): string => {
    if (value === null || Number.isNaN(value)) return '';

    const xptEpoch = new Date('1960-01-01T00:00:00.000Z');
    let date: Date;

    switch (type) {
        case 'date':
            // XPT dates are days since 1960-01-01
            date = new Date(xptEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            return date.toISOString().split('T')[0];
        case 'time':
            // XPT times are seconds since midnight
            date = new Date(value * 1000);
            return date.toISOString().split('T')[1].split('.')[0];
        case 'datetime':
            // XPT datetimes are seconds since 1960-01-01
            date = new Date(xptEpoch.getTime() + value * 1000);
            return date.toISOString();
        default:
            return String(value);
    }
};

const convertXpt = async (
    file: ConvertedFileInfo,
    options: ConvertTask['options'],
    sendMessage: (progress: number) => void,
): Promise<boolean> => {
    try {
        const { destinationDir, prettyPrint } = options;
        const { outputName, fullPath } = file;
        const datasetXpt = new DatasetXpt(fullPath);
        const datasetJson = new DatasetJson(
            path.join(destinationDir, outputName),
        );

        const metadata = await datasetXpt.getMetadata('dataset-json1.1');
        const updatedMetadata = processXptMetadata(metadata, options);

        await datasetJson.write({
            metadata: updatedMetadata,
            action: 'create',
            options: { prettify: prettyPrint },
        });

        // Identify the datetime columns which should be converted
        const dtIndexes = updatedMetadata.columns.reduce(
            (acc, column, index) => {
                if (['datetime', 'date', 'time'].includes(column.dataType)) {
                    acc.push({ index, dataType: column.dataType });
                }
                return acc;
            },
            [] as Array<{ index: number; dataType: ItemType }>,
        );

        const { records } = updatedMetadata;
        let currentRecord = 0;

        let buffer: ItemDataArray[] = [];
        // Read blocks of 10k records
        for await (const obs of datasetXpt.read({ skipHeader: true })) {
            // Convert datetime values if needed
            if (dtIndexes.length > 0) {
                const row = obs as ItemDataArray;
                dtIndexes.forEach(({ index, dataType }) => {
                    row[index] = convertXptDateTime(
                        row[index] as number,
                        dataType,
                    );
                });
            }
            buffer.push(obs as ItemDataArray);
            currentRecord++;
            if (currentRecord % 10000 === 0) {
                await datasetJson.write({
                    data: buffer,
                    action: 'write',
                    options: { prettify: prettyPrint },
                });
                buffer = [];

                sendMessage(currentRecord / records);
            }
        }

        // Write the remaining records
        await datasetJson.write({
            data: buffer,
            action: 'finalize',
            options: { prettify: prettyPrint },
        });

        // Send the final message informing that the conversion is done
        sendMessage(1);

        return true;
    } catch (error) {
        return false;
    }
};

process.parentPort.once(
    'message',
    async (messageData: {
        data: {
            processId: string;
            file: ConvertedFileInfo;
            options: ConvertTask['options'];
        };
    }) => {
        const { data } = messageData;
        const { processId, file, options } = data;

        const sendMessage = (progress: number) => {
            process.parentPort.postMessage({
                id: processId,
                progress,
            });
        };

        if (file.format === 'xpt') {
            await convertXpt(file, options, sendMessage);
        }
        process.exit();
    },
);
