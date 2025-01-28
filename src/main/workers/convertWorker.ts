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
        // Remove display format like $12.
        const newColumn = { ...column };
        if (
            newColumn.displayFormat &&
            /^\\$\d+\.?$/.test(newColumn.displayFormat)
        ) {
            newColumn.displayFormat = '';
        }
        // Remove length for numeric datatypes
        if (['integer', 'float', 'double'].includes(newColumn.dataType)) {
            delete newColumn.length;
        }
        // Identify numeric columns which should be converted to datetime;
        const { dateFormats, timeFormats, datetimeFormats } = options;
        if (newColumn.dataType === 'integer' && newColumn.displayFormat) {
            if (dateFormats.includes(newColumn.displayFormat)) {
                newColumn.dataType = 'date';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            } else if (timeFormats.includes(newColumn.displayFormat)) {
                newColumn.dataType = 'time';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            } else if (datetimeFormats.includes(newColumn.displayFormat)) {
                newColumn.dataType = 'datetime';
                newColumn.targetDataType = 'integer';
                newColumn.displayFormat = '';
            }
        }
        return newColumn;
    });

    const newMetadata = { ...metadata, columns: newColumns };
    return newMetadata;
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
