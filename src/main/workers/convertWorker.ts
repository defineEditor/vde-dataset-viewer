import { ConvertedFileInfo, ConvertTask } from 'interfaces/main';
import DatasetXpt from 'xport-js';
import DatasetJson, { ItemDataArray } from 'js-stream-dataset-json';
import path from 'path';
import { DatasetJsonMetadata, ItemType } from 'interfaces/common';

const processXptMetadata = (
    metadata: DatasetJsonMetadata,
    options: ConvertTask['options'],
    outputName: string,
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
            } else if (timeFormats.includes(updatedDisplayFormat)) {
                newColumn.dataType = 'time';
                newColumn.targetDataType = 'integer';
            } else if (datetimeFormats.includes(updatedDisplayFormat)) {
                newColumn.dataType = 'datetime';
                newColumn.targetDataType = 'integer';
            }
        }
        // Identify using column name suffix
        const { convertSuffixDt, convertSuffixDtm, convertSuffixTm } = options;
        if (
            ['double', 'integer'].includes(newColumn.dataType) &&
            (convertSuffixDt || convertSuffixTm || convertSuffixDtm)
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
                convertSuffixDtm &&
                newColumn.name.toLowerCase().endsWith('dtm')
            ) {
                newColumn.dataType = 'datetime';
                newColumn.targetDataType = 'integer';
            }
        }
        return newColumn;
    });

    const newMetadata = { ...metadata, columns: newColumns };

    // sourceSystem.name can contain '\u0000' symbols, remove them
    if (newMetadata.sourceSystem?.name) {
        newMetadata.sourceSystem.name = newMetadata.sourceSystem.name.replace(
            // eslint-disable-next-line no-control-regex
            /\u0000/g,
            '',
        );
    }
    // Set Dataset-JSON version
    if (options.outputFormat === 'DJ1.1' || options.outputFormat === 'NDJ1.1') {
        newMetadata.datasetJSONVersion = '1.1';
    }

    // ItemOID;
    newMetadata.itemGroupOID = `IG.${newMetadata.name.toUpperCase()}`;

    // FileOID;
    newMetadata.fileOID = outputName;

    return newMetadata;
};

const updateMetadata = (
    currentMetadata: DatasetJsonMetadata,
    options: ConvertTask['options'],
): DatasetJsonMetadata => {
    const { metadata } = options;

    const newMetadata = { ...currentMetadata, ...metadata };

    // Set attributes which are updated in any case;
    newMetadata.datasetJSONCreationDateTime = new Date().toISOString();

    if (options.outputFormat === 'DJ1.1' || options.outputFormat === 'NDJ1.1') {
        newMetadata.datasetJSONVersion = '1.1';
    }

    newMetadata.sourceSystem = {
        name: 'VDE Dataset Converter',
        version: options.appVersion || '',
    };

    // If it was not requested to update the metadata, no further processing is needed
    if (!options.updateMetadata) {
        // Force columns to be the last attribute
        const { columns } = newMetadata;
        const properMetadata: { columns?: object } = { ...newMetadata };
        delete properMetadata.columns;
        properMetadata.columns = columns;
        return properMetadata as DatasetJsonMetadata;
    }

    if (metadata.sourceSystem?.name || metadata.sourceSystem?.version) {
        newMetadata.sourceSystem = {
            ...currentMetadata.sourceSystem,
            ...metadata.sourceSystem,
        };
    }

    // FileOID and ItemGroupOID values are used as prefixes
    if (metadata.fileOID) {
        newMetadata.fileOID = `${metadata.fileOID}.${currentMetadata.fileOID}`;
    }

    if (metadata.itemGroupOID && currentMetadata.itemGroupOID) {
        // Remove default IG prefix
        newMetadata.itemGroupOID = `${currentMetadata.itemGroupOID.replace(/^IG\./, `${metadata.itemGroupOID}.`)}`;
    }

    // The rest of the attributes are just replaced
    if (metadata.studyOID) {
        newMetadata.studyOID = metadata.studyOID;
    }

    if (metadata.originator) {
        newMetadata.originator = metadata.originator;
    }

    if (metadata.metaDataVersionOID) {
        newMetadata.metaDataVersionOID = metadata.metaDataVersionOID;
    }

    if (metadata.metaDataRef) {
        newMetadata.metaDataRef = metadata.metaDataRef;
    }

    if (metadata.dbLastModifiedDateTime) {
        newMetadata.dbLastModifiedDateTime = metadata.dbLastModifiedDateTime;
    }

    // Force columns to be the last attribute
    const { columns } = newMetadata;
    const properMetadata: { columns?: object } = { ...newMetadata };
    delete properMetadata.columns;
    properMetadata.columns = columns;
    return properMetadata as DatasetJsonMetadata;
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
            {
                encoding:
                    options.outEncoding === 'default'
                        ? undefined
                        : options.outEncoding,
            },
        );

        const metadata = await datasetXpt.getMetadata('dataset-json1.1');
        let updatedMetadata = processXptMetadata(metadata, options, outputName);

        // Standard metadata updates;
        updatedMetadata = updateMetadata(updatedMetadata, options);

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
        for await (const obs of datasetXpt.read({
            skipHeader: true,
            encoding:
                options.inEncoding === 'default'
                    ? undefined
                    : options.inEncoding,
        })) {
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

const convertJson = async (
    file: ConvertedFileInfo,
    options: ConvertTask['options'],
    sendMessage: (progress: number) => void,
): Promise<boolean> => {
    try {
        const { destinationDir, prettyPrint } = options;
        const { outputName, fullPath } = file;
        const datasetInput = new DatasetJson(fullPath, {
            encoding:
                options.inEncoding === 'default'
                    ? undefined
                    : options.inEncoding,
        });
        const datasetOutput = new DatasetJson(
            path.join(destinationDir, outputName),
            {
                encoding:
                    options.outEncoding === 'default'
                        ? undefined
                        : options.outEncoding,
                isNdJson: options.outputFormat === 'NDJ1.1',
            },
        );

        const metadata = await datasetInput.getMetadata();

        // Standard metadata updates
        const updatedMetadata = updateMetadata(metadata, options);

        await datasetOutput.write({
            metadata: updatedMetadata,
            action: 'create',
            options: { prettify: prettyPrint },
        });

        const { records } = updatedMetadata;
        let currentRecord = 0;

        let buffer: ItemDataArray[] = [];
        // Read blocks of 10k records
        for await (const obs of datasetInput.readRecords({
            bufferLength: 10000,
        })) {
            buffer.push(obs as ItemDataArray);
            currentRecord++;
            if (currentRecord % 10000 === 0) {
                await datasetOutput.write({
                    data: buffer,
                    action: 'write',
                    options: { prettify: prettyPrint },
                });
                buffer = [];

                sendMessage(currentRecord / records);
            }
        }

        // Write the remaining records
        await datasetOutput.write({
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
        if (file.format === 'json' || file.format === 'ndjson') {
            await convertJson(file, options, sendMessage);
        }
        process.exit();
    },
);
