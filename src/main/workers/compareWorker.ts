import Filter from 'js-array-filter';
import DatasetJson from 'js-stream-dataset-json';
import { DatasetReadStat } from 'js-stream-sas7bdat';
import DatasetXpt from 'xport-js';
import {
    CompareProcessTask,
    DatasetDiff,
    DatasetJsonMetadata,
    ItemDataArray,
    ItemDescription,
    ItemType,
    CompareSettings,
    MetadataDiff,
    DataDiff,
    DataDiffRow,
    DatasetMetadata,
    BasicFilter,
    ColumnMetadata,
} from '@interfaces/common';

const transformData = (
    data: ItemDataArray[],
    metadata: DatasetJsonMetadata,
): ItemDataArray[] => {
    // Replace character null values with missing value
    const newData = data.map((row) => {
        const newRow = [...row];
        row.forEach((val, idx) => {
            if (
                val === null &&
                ['string'].includes(metadata.columns[idx].dataType)
            ) {
                newRow[idx] = '';
            }
        });
        return newRow;
    });
    // Find all datetime columns with integer target data type
    const datetimeIdxs: number[] = [];
    const dateIdxs: number[] = [];
    const timeIdxs: number[] = [];
    const decimalIdxs: number[] = [];
    metadata.columns.forEach((column, index) => {
        if (column.targetDataType === 'integer') {
            if (column.dataType === 'datetime') {
                datetimeIdxs.push(index);
            } else if (column.dataType === 'date') {
                dateIdxs.push(index);
            } else if (column.dataType === 'time') {
                timeIdxs.push(index);
            }
        } else if (column.dataType === 'decimal') {
            decimalIdxs.push(index);
        }
    });

    // Transform data
    return newData.map((row) => {
        const newRow = [...row];
        datetimeIdxs.forEach((idx) => {
            const val = row[idx];
            if (val !== null && val !== '' && typeof val === 'string') {
                const jsDate = new Date(val);
                const jsTime = jsDate.getTime();
                if (Number.isNaN(jsTime)) {
                    newRow[idx] = null;
                } else {
                    // Convert to SAS datetime (days since 1960-01-01)
                    const sasDatetime = Math.round(jsTime / 1000) + 315619200;
                    newRow[idx] = sasDatetime;
                }
            }
        });
        dateIdxs.forEach((idx) => {
            const val = row[idx];
            if (val !== null && val !== '' && typeof val === 'string') {
                const jsDate = new Date(val);
                const jsTime = jsDate.getTime();
                if (Number.isNaN(jsTime)) {
                    newRow[idx] = null;
                } else {
                    // Convert to SAS date (days since 1960-01-01)
                    const sasDate = Math.floor(jsTime / 86400000) + 3653;
                    newRow[idx] = sasDate;
                }
            }
        });
        timeIdxs.forEach((idx) => {
            const val = row[idx];
            if (val !== null && val !== '' && typeof val === 'string') {
                const timeComponents = val.split(':').map(Number);
                if (
                    timeComponents.length === 3 &&
                    timeComponents.every((comp) => !Number.isNaN(comp))
                ) {
                    const sasTime =
                        timeComponents[0] * 3600 +
                        timeComponents[1] * 60 +
                        timeComponents[2];
                    newRow[idx] = sasTime;
                } else {
                    newRow[idx] = null;
                }
            }
        });
        decimalIdxs.forEach((idx) => {
            const val = row[idx];
            if (val !== null && val !== '' && typeof val === 'string') {
                const numVal = Number(val);
                if (Number.isNaN(numVal)) {
                    newRow[idx] = null;
                } else {
                    newRow[idx] = numVal;
                }
            }
        });
        return newRow;
    });
};

const compareMetadata = (
    base: DatasetMetadata,
    compare: DatasetMetadata,
    options: CompareSettings,
    dataTypes?: {
        baseType: 'sas' | 'json';
        compType: 'sas' | 'json';
    },
): MetadataDiff => {
    const { ignoreColumnCase, ignorePattern } = options;
    // Metadata Comparison
    const metadataDiff: MetadataDiff = {
        commonCols: [],
        missingInBase: [],
        missingInCompare: [],
        attributeDiffs: {},
        positionDiffs: {},
        dsAttributeDiffs: {},
    };

    // Dataset Attributes
    if (base.label !== compare.label) {
        metadataDiff.dsAttributeDiffs.label = {
            base: base.label,
            compare: compare.label,
        };
    }

    if (base.records !== compare.records) {
        metadataDiff.dsAttributeDiffs.records = {
            base: base.records,
            compare: compare.records,
        };
    }

    if (base.name !== compare.name) {
        metadataDiff.dsAttributeDiffs.name = {
            base: base.name || '',
            compare: compare.name || '',
        };
    }

    // Column Analysis
    const baseCols = new Map(
        base.columns
            .filter((column) => {
                if (!ignorePattern) return true;
                return !new RegExp(`${ignorePattern}`, 'i').test(column.name);
            })
            .map((c, i) => [c.name, { desc: c, index: i }]),
    );
    const compareCols = new Map(
        compare.columns
            .filter((column) => {
                if (!ignorePattern) return true;
                return !new RegExp(`${ignorePattern}`, 'i').test(column.name);
            })
            .map((c, i) => [c.name, { desc: c, index: i }]),
    );

    const allColNames = [...baseCols.keys(), ...compareCols.keys()].filter(
        (name, index, array) => index === array.indexOf(name),
    );
    if (ignoreColumnCase) {
        // Remove duplicates when ignoring case
        const duplicateNames: string[] = [];
        const lowerCaseNames = allColNames.map((name) => name.toLowerCase());
        lowerCaseNames.forEach((key, index) => {
            if (lowerCaseNames.indexOf(key) !== index) {
                duplicateNames.push(allColNames[index]);
            }
        });
        duplicateNames.sort().reverse();
        duplicateNames.forEach((key) =>
            allColNames.splice(allColNames.indexOf(key), 1),
        );
    }
    const commonCols: string[] = [];

    for (const name of allColNames) {
        let inBase = baseCols.get(name);
        let inCompare = compareCols.get(name);
        if (ignoreColumnCase && (!inBase || !inCompare)) {
            // Find matching column names ignoring case
            const baseKey = Array.from(baseCols.keys()).find(
                (colName) => colName.toLowerCase() === name.toLowerCase(),
            );
            const compareKey = Array.from(compareCols.keys()).find(
                (colName) => colName.toLowerCase() === name.toLowerCase(),
            );
            if (baseKey) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                inBase = baseCols.get(baseKey)!;
            } else {
                inBase = undefined;
            }
            if (compareKey) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                inCompare = compareCols.get(compareKey)!;
            } else {
                inCompare = undefined;
            }
        }

        if (!inBase && inCompare) {
            metadataDiff.missingInBase.push(name);
        } else if (inBase && !inCompare) {
            metadataDiff.missingInCompare.push(name);
        } else if (inBase && inCompare) {
            commonCols.push(name);
            // Position Diff
            if (inBase.index !== inCompare.index) {
                metadataDiff.positionDiffs[name] = {
                    base: inBase.index + 1,
                    compare: inCompare.index + 1,
                };
            }

            // Attribute Diff
            const attrDiffs: {
                [attr: string]: {
                    base: string | number;
                    compare: string | number;
                };
            } = {};
            const attrs: (keyof ItemDescription)[] = [
                'label',
                'dataType',
                'length',
                'displayFormat',
            ];

            const differentDataTypes = dataTypes
                ? dataTypes.baseType !== dataTypes.compType
                : false;

            if (!differentDataTypes) {
                attrs.push('targetDataType');
            }

            let jsonDataType: string | null = null;
            let sasDataType: string | null = null;
            if (differentDataTypes) {
                jsonDataType =
                    dataTypes?.baseType === 'json'
                        ? inBase.desc.dataType
                        : inCompare.desc.dataType;
                sasDataType =
                    dataTypes?.baseType === 'sas'
                        ? inBase.desc.dataType
                        : inCompare.desc.dataType;
            }
            for (const attr of attrs) {
                // When comparing different data types (SAS vs JSON),
                // SAS data type is always double for numbers
                // Length is no defined for JSON numeric types and for decimal it has a different meaning
                if (
                    inBase.desc[attr] !== inCompare.desc[attr] &&
                    !(
                        attr === 'dataType' &&
                        sasDataType === 'double' &&
                        jsonDataType !== null &&
                        [
                            'integer',
                            'float',
                            'double',
                            'decimal',
                            'date',
                            'datetime',
                            'time',
                        ].includes(jsonDataType)
                    ) &&
                    !(
                        differentDataTypes &&
                        attr === 'length' &&
                        sasDataType === 'double' &&
                        jsonDataType !== null &&
                        [
                            'integer',
                            'float',
                            'double',
                            'decimal',
                            'date',
                            'datetime',
                            'time',
                        ].includes(jsonDataType)
                    )
                ) {
                    attrDiffs[attr as string] = {
                        base: inBase.desc[attr] || '',
                        compare: inCompare.desc[attr] || '',
                    };
                }
            }

            if (Object.keys(attrDiffs).length > 0) {
                metadataDiff.attributeDiffs[name] = attrDiffs;
            }
        }
    }

    metadataDiff.commonCols = commonCols;

    return metadataDiff;
};

const compareGroupValues = (
    a: ItemDataArray[number],
    b: ItemDataArray[number],
): number => {
    if (a === b) return 0;
    if (a === null) return -1;
    if (b === null) return 1;
    if (typeof a === 'number' && typeof b === 'number') {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
    const sa = String(a);
    const sb = String(b);
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
};

const getGroupKey = (row: ItemDataArray, groupIdx: number[]): ItemDataArray =>
    groupIdx.map((idx) => row[idx]);

const compareGroupKeys = (a: ItemDataArray, b: ItemDataArray): number => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const cmp = compareGroupValues(a[i], b[i]);
        if (cmp !== 0) return cmp;
    }
    if (a.length < b.length) return -1;
    if (a.length > b.length) return 1;
    return 0;
};

export const compareData = (
    base: ItemDataArray[],
    compare: ItemDataArray[],
    baseMeta: DatasetMetadata,
    compareMeta: DatasetMetadata,
    summaryInit: DatasetDiff['summary'],
    options: CompareSettings,
    rowShiftBase: number = 0,
    rowShiftCompare: number = 0,
): { data: DataDiff; summary: Partial<DatasetDiff['summary']> } => {
    const {
        tolerance = 1e-12,
        maxDiffCount,
        maxColumnDiffCount,
        ignoreColumnCase,
        ignoreWhiteSpaces,
        ignoreValueCase,
        ignorePattern,
    } = options;

    // Column Maps
    const baseCols = new Map(
        baseMeta?.columns
            .map((c, i): [string, { desc: ItemDescription; index: number }] => {
                if (ignoreColumnCase) {
                    return [c.name.toLowerCase(), { desc: c, index: i }];
                }
                return [c.name, { desc: c, index: i }];
            })
            .filter(
                (
                    columnObj: [
                        string,
                        { desc: ItemDescription; index: number },
                    ],
                ) =>
                    !ignorePattern ||
                    !new RegExp(`${ignorePattern}`, 'i').test(columnObj[0]),
            ) ?? [],
    );
    const compareCols = new Map(
        compareMeta?.columns
            .map((c, i): [string, { desc: ItemDescription; index: number }] => {
                if (ignoreColumnCase) {
                    return [c.name.toLowerCase(), { desc: c, index: i }];
                }
                return [c.name, { desc: c, index: i }];
            })
            .filter(
                (
                    columnObj: [
                        string,
                        { desc: ItemDescription; index: number },
                    ],
                ) =>
                    !ignorePattern ||
                    !new RegExp(`${ignorePattern}`, 'i').test(columnObj[0]),
            ) ?? [],
    );

    const allCols = [...baseCols.keys(), ...compareCols.keys()].filter(
        (name, index, array) => index === array.indexOf(name),
    );

    const commonCols: string[] = allCols.filter((name) => {
        return baseCols.has(name) && compareCols.has(name);
    });

    // Track columns that reached max diff count
    const columnDiffCounts = new Map<string, number>();
    const maxColDiffReached: string[] = summaryInit?.maxColDiffReached ?? [];

    // Data Comparison
    const dataDiff: DataDiff = {
        deletedRows: [],
        addedRows: [],
        modifiedRows: [],
    };

    // Helper to compare values
    const areValuesEqual = (
        val1: ItemDataArray[number],
        val2: ItemDataArray[number],
        type: ItemType,
    ): boolean => {
        if (val1 === val2) return true;
        if (val1 === null || val2 === null) return false;

        const isNumeric = ['integer', 'float', 'double', 'decimal'].includes(
            type,
        );
        // TODO - I think we don't need to check typeof here, as it is either null or number
        if (isNumeric && typeof val1 === 'number' && typeof val2 === 'number') {
            return Math.abs(val1 - val2) <= tolerance;
        }
        if (typeof val1 === 'string' && typeof val2 === 'string') {
            if (ignoreValueCase && ignoreWhiteSpaces) {
                return val1.trim().toLowerCase() === val2.trim().toLowerCase();
            }
            if (ignoreValueCase) {
                return val1.toLowerCase() === val2.toLowerCase();
            }
            if (ignoreWhiteSpaces) {
                return val1.trim() === val2.trim();
            }
            return val1 === val2;
        }
        return val1 === val2;
    };

    // Helper to compare a row
    const compareRow = (
        baseRow: ItemDataArray,
        compRow: ItemDataArray,
        baseIdx: number,
        compareIdx: number,
    ): DataDiffRow | null => {
        const diffs: {
            [columnName: string]: [
                ItemDataArray[number],
                ItemDataArray[number],
            ];
        } = {};
        let hasDiff = false;

        commonCols
            .filter((colName) => !maxColDiffReached.includes(colName))
            .forEach((colName) => {
                const baseCol = baseCols.get(colName);
                const baseColIdx = baseCol!.index;
                const type = baseCol!.desc.dataType;
                const baseName = baseCol!.desc.name;
                const compareColIdx = compareCols.get(colName)!.index;

                const val1 = baseRow[baseColIdx];
                const val2 = compRow[compareColIdx];

                if (!areValuesEqual(val1, val2, type)) {
                    diffs[baseName] = [val1, val2];
                    hasDiff = true;

                    if (maxColumnDiffCount > 0) {
                        const currentCount = columnDiffCounts.get(colName) || 0;
                        columnDiffCounts.set(colName, currentCount + 1);
                        if (currentCount + 1 >= maxColumnDiffCount) {
                            maxColDiffReached.push(colName);
                            // If all columns have reached max, set maxDiffReached
                            if (
                                maxColDiffReached.length === commonCols.length
                            ) {
                                summaryInit.maxDiffReached = true;
                            }
                        }
                    }
                }
            });

        if (hasDiff) {
            return {
                rowBase: baseIdx + rowShiftBase,
                rowCompare: compareIdx + rowShiftCompare,
                diff: diffs,
            };
        }
        return null;
    };

    let maxDiffReached = summaryInit?.maxDiffReached || false;
    let firstDiffRow: number | null = null;
    let lastDiffRow: number | null = null;

    const runLineByLine = () => {
        const maxRows = Math.max(base.length, compare.length);
        let diffCount = 0;

        for (let i = 0; i < maxRows && !maxDiffReached; i++) {
            let hasDiff = false;
            if (i < base.length && i < compare.length) {
                const diff = compareRow(base[i], compare[i], i, i);
                if (diff) {
                    hasDiff = true;
                    dataDiff.modifiedRows.push(diff);
                }
            } else if (i >= base.length) {
                // Added row
                hasDiff = true;
                const diff: DataDiffRow = {
                    rowBase: null,
                    rowCompare: i + rowShiftCompare,
                };
                dataDiff.addedRows.push(diff);
            } else if (i >= compare.length) {
                // Deleted row
                hasDiff = true;
                const diff: DataDiffRow = {
                    rowBase: i + rowShiftBase,
                    rowCompare: null,
                };
                dataDiff.deletedRows.push(diff);
            }
            if (hasDiff) {
                diffCount++;
                if (firstDiffRow === null) {
                    firstDiffRow = i + rowShiftBase;
                }
                lastDiffRow = i + rowShiftBase;
            }

            if (maxDiffCount > 0 && diffCount >= maxDiffCount) {
                maxDiffReached = true;
            }
        }
    };

    runLineByLine();

    // Get summary
    const newFirstLow =
        firstDiffRow !== null
            ? Math.min(firstDiffRow, summaryInit?.firstDiffRow || Infinity)
            : summaryInit?.firstDiffRow || null;
    const newLastLow =
        lastDiffRow !== null
            ? Math.max(summaryInit?.lastDiffRow || -Infinity, lastDiffRow)
            : summaryInit?.lastDiffRow || null;
    const totalDiffs =
        dataDiff.deletedRows.length + dataDiff.modifiedRows.length;
    const newTotalDiffs = (summaryInit?.totalDiffs || 0) + totalDiffs;

    const summary = {
        firstDiffRow: newFirstLow,
        lastDiffRow: newLastLow,
        totalDiffs: newTotalDiffs,
        maxDiffReached,
        maxColDiffReached,
    };

    return { data: dataDiff, summary };
};

const openFile = (filePath: string, encoding: BufferEncoding | 'default') => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    let data: DatasetJson | DatasetXpt | DatasetReadStat;
    try {
        if (extension === 'xpt') {
            data = new DatasetXpt(filePath);
        } else if (
            ['sas7bdat', 'sav', 'dta', 'zsav', 'por'].includes(extension || '')
        ) {
            data = new DatasetReadStat(filePath);
        } else {
            const updatedEncoding: BufferEncoding =
                encoding === 'default' ? 'utf8' : encoding;
            data = new DatasetJson(filePath, {
                encoding: updatedEncoding,
            });
        }
        return data;
    } catch (error) {
        throw new Error(
            `An error occurred while opening the file ${filePath}: ${(error as Error).message}`,
        );
    }
};

const getMetadata = async (
    file: DatasetJson | DatasetXpt | DatasetReadStat,
): Promise<DatasetJsonMetadata> => {
    if (file instanceof DatasetXpt) {
        return file.getMetadata('dataset-json1.1');
    }
    return file.getMetadata();
};

const getData = async (
    file: DatasetJson | DatasetXpt | DatasetReadStat,
    start: number,
    length: number,
    columns: ColumnMetadata[],
    options: CompareSettings,
    filterData: BasicFilter | null,
): Promise<{ data: ItemDataArray[]; lastRow: number; endReached: boolean }> => {
    let filter: Filter | undefined;
    if (filterData !== null && columns !== undefined) {
        filter = new Filter('dataset-json1.1', columns, filterData);
    } else {
        filter = undefined;
    }
    if (file instanceof DatasetXpt) {
        return (await file.getData({
            start,
            length,
            type: 'array',
            roundPrecision: Math.max(
                12,
                Math.abs(Math.log10(Math.min(options.tolerance, 10e-1))),
            ),
            filter,
        })) as { data: ItemDataArray[]; lastRow: number; endReached: boolean };
    }
    return (await file.getData({
        start,
        length,
        filter,
    })) as { data: ItemDataArray[]; lastRow: number; endReached: boolean };
};

const getGroupColumnIndices = (
    metadata: DatasetJsonMetadata,
    groupColumns: string[],
    datasetLabel: string,
): number[] => {
    const columnIndices = new Map<string, number>();
    metadata.columns.forEach((column, index) => {
        columnIndices.set(column.name.toLowerCase(), index);
    });
    return groupColumns.map((name) => {
        const key = name.toLowerCase();
        const index = columnIndices.get(key);
        if (index === undefined) {
            throw new Error(
                `Group column "${name}" not found in the ${datasetLabel} dataset`,
            );
        }
        return index;
    });
};

interface GroupChunk {
    key: ItemDataArray;
    rows: ItemDataArray[];
    groupEnd: boolean;
    startRow: number;
}

const createGroupStream = (
    file: DatasetJson | DatasetXpt | DatasetReadStat,
    metadata: DatasetJsonMetadata,
    options: CompareSettings,
    filterData: BasicFilter | null,
    groupIdx: number[],
    transformRows: boolean,
    bufferSize: number,
    pageMapsRef: { base: number[]; comp: number[] },
    side: 'base' | 'comp',
) => {
    const pending: ItemDataArray[] = [];
    let start = 0;
    let endReached = false;
    let rowsConsumed = 0;

    const readChunk = async () => {
        const dataFull = await getData(
            file,
            start,
            bufferSize,
            metadata.columns,
            options,
            filterData,
        );
        const data = transformRows
            ? transformData(dataFull.data, metadata)
            : dataFull.data;
        pending.push(...data);
        if (filterData !== null) {
            start = dataFull.lastRow + 1;
        } else {
            start += bufferSize;
        }
        if (dataFull.endReached) {
            endReached = true;
        } else {
            pageMapsRef[side].push(dataFull.lastRow + 1);
        }
    };

    const next = async (limit: number): Promise<GroupChunk | null> => {
        while (pending.length === 0 && !endReached) {
            // eslint-disable-next-line no-await-in-loop
            await readChunk();
        }
        if (pending.length === 0) {
            return null;
        }

        const startRow = rowsConsumed;
        const key = getGroupKey(pending[0], groupIdx);
        const rows: ItemDataArray[] = [];
        let i = 0;
        while (
            i < pending.length &&
            rows.length < limit &&
            compareGroupKeys(getGroupKey(pending[i], groupIdx), key) === 0
        ) {
            rows.push(pending[i]);
            i++;
        }

        let groupEnd = false;
        if (i < pending.length) {
            groupEnd =
                compareGroupKeys(getGroupKey(pending[i], groupIdx), key) !== 0;
        } else if (endReached) {
            groupEnd = true;
        } else {
            // Peek the next row to determine whether the group continues
            // eslint-disable-next-line no-await-in-loop
            await readChunk();
            if (i < pending.length) {
                groupEnd =
                    compareGroupKeys(getGroupKey(pending[i], groupIdx), key) !==
                    0;
            } else {
                groupEnd = true;
            }
        }

        pending.splice(0, i);
        rowsConsumed += rows.length;
        return { key, rows, groupEnd, startRow };
    };

    return { next };
};

const applyBlockDiff = ({
    dataDiff,
    blockDiff,
    baseBlockLen,
    compBlockLen,
    baseRowsProcessed,
    compRowsProcessed,
    totalRecords,
    currentSummary,
    sendMessage,
}: {
    dataDiff: DatasetDiff['data'];
    blockDiff: ReturnType<typeof compareData>;
    baseBlockLen: number;
    compBlockLen: number;
    baseRowsProcessed: number;
    compRowsProcessed: number;
    totalRecords: number;
    currentSummary: DatasetDiff['summary'];
    sendMessage: (progress: number, issues: number) => void;
}) => {
    dataDiff.addedRows.push(...blockDiff.data.addedRows);
    dataDiff.deletedRows.push(...blockDiff.data.deletedRows);
    dataDiff.modifiedRows.push(...blockDiff.data.modifiedRows);

    const nextSummary = {
        ...currentSummary,
        ...blockDiff.summary,
        totalRowsChecked: blockDiff.summary.maxDiffReached
            ? (blockDiff.summary.lastDiffRow || 0) + 1
            : baseRowsProcessed + Math.min(baseBlockLen, compBlockLen),
    };

    const nextBaseRecords = baseRowsProcessed + baseBlockLen;
    const nextCompRecords = compRowsProcessed + compBlockLen;
    const nextMaxDiffReached = blockDiff.summary.maxDiffReached || false;

    const progress =
        totalRecords > 0
            ? Math.round((nextSummary.totalRowsChecked / totalRecords) * 100)
            : 0;
    if (progress < 100 && !nextMaxDiffReached) {
        sendMessage(Math.max(progress, 1), nextSummary.totalDiffs);
    } else {
        sendMessage(99, nextSummary.totalDiffs);
    }

    return {
        summary: nextSummary,
        baseRecords: nextBaseRecords,
        compRecords: nextCompRecords,
        maxDiffReached: nextMaxDiffReached,
    };
};

process.parentPort.once(
    'message',
    async (messageData: { data: CompareProcessTask }) => {
        const { data } = messageData;
        const { id, fileBase, fileComp, options, fileSettings, filterData } =
            data;

        const sendMessage = (
            progress: number,
            issues: number,
            result?: DatasetDiff,
            error?: string,
        ) => {
            process.parentPort.postMessage({
                id,
                progress,
                issues,
                result,
                error,
            });
        };

        try {
            const { encoding, bufferSize } = fileSettings;
            const baseFile = openFile(fileBase, encoding);
            const compFile = openFile(fileComp, encoding);

            // If XPT/SAS7BDAT/SPSS/STATA is compared to JSON:
            // 1 - Convert datetime variable to their integer representation
            // 2 - null and missing values are treated as equal
            const baseExtension = fileBase.split('.').pop()?.toLowerCase();
            const compExtension = fileComp.split('.').pop()?.toLowerCase();
            const baseType = [
                'xpt',
                'sas7bdat',
                'sav',
                'dta',
                'zsav',
                'por',
            ].includes(baseExtension || '')
                ? 'sas'
                : 'json';
            const compType = [
                'xpt',
                'sas7bdat',
                'sav',
                'dta',
                'zsav',
                'por',
            ].includes(compExtension || '')
                ? 'sas'
                : 'json';
            const differentTypes = baseType !== compType;

            const baseMeta = await getMetadata(baseFile);
            const compMeta = await getMetadata(compFile);

            const dataDiff: DatasetDiff['data'] = {
                addedRows: [],
                deletedRows: [],
                modifiedRows: [],
            };

            const metadataDiff: DatasetDiff['metadata'] = compareMetadata(
                baseMeta,
                compMeta,
                options,
                differentTypes ? { baseType, compType } : undefined,
            );
            sendMessage(1, 0);

            let summary: DatasetDiff['summary'] = {
                firstDiffRow: null,
                lastDiffRow: null,
                totalDiffs: 0,
                baseRows: baseMeta.records,
                compareRows: compMeta.records,
                maxDiffReached: false,
                maxColDiffReached: [],
                colsWithDataDiffs: 0,
                colsWithMetadataDiffs: 0,
                colsWithoutDiffs: 0,
                totalRowsChecked: 0,
            };

            const totalRecords = Math.min(baseMeta.records, compMeta.records);
            let maxDiffCountReached = false;
            let baseRecords = 0;
            let compRecords = 0;
            // Track page maps for filtered data
            // It is needed to quickly navigate to specific rows when filter is applied
            const pageMaps = {
                base: [0],
                comp: [0],
            };

            // Group comparison is enabled when group columns are defined.
            // Data is assumed to be already sorted by these columns.
            if (options.groupColumns?.length > 0) {
                // Group-based comparison: rows are streamed in chunks so groups
                // larger than the buffer are not held in memory entirely.
                const baseGroupIdx = getGroupColumnIndices(
                    baseMeta,
                    options.groupColumns,
                    'base',
                );
                const compGroupIdx = getGroupColumnIndices(
                    compMeta,
                    options.groupColumns,
                    'compare',
                );

                const baseStream = createGroupStream(
                    baseFile,
                    baseMeta,
                    options,
                    filterData,
                    baseGroupIdx,
                    differentTypes && baseType === 'json',
                    bufferSize,
                    pageMaps,
                    'base',
                );
                const compStream = createGroupStream(
                    compFile,
                    compMeta,
                    options,
                    filterData,
                    compGroupIdx,
                    differentTypes && compType === 'json',
                    bufferSize,
                    pageMaps,
                    'comp',
                );

                let baseChunk = await baseStream.next(bufferSize);
                let compChunk = await compStream.next(bufferSize);

                while ((baseChunk || compChunk) && !maxDiffCountReached) {
                    let blockDiff: ReturnType<typeof compareData>;
                    let baseBlockLen = 0;
                    let compBlockLen = 0;

                    let groupKeyComparison: number | null = null;
                    if (baseChunk && compChunk) {
                        groupKeyComparison = compareGroupKeys(
                            baseChunk.key,
                            compChunk.key,
                        );
                    }

                    if (!baseChunk || groupKeyComparison! > 0) {
                        // Remaining compare rows belong to groups absent in base
                        compBlockLen = compChunk!.rows.length;
                        blockDiff = compareData(
                            [],
                            compChunk!.rows,
                            baseMeta,
                            compMeta,
                            summary,
                            options,
                            baseRecords,
                            compChunk!.startRow,
                        );
                        // eslint-disable-next-line no-await-in-loop
                        compChunk = await compStream.next(bufferSize);
                    } else if (!compChunk || groupKeyComparison! < 0) {
                        // Remaining base rows belong to groups absent in compare
                        baseBlockLen = baseChunk.rows.length;
                        blockDiff = compareData(
                            baseChunk.rows,
                            [],
                            baseMeta,
                            compMeta,
                            summary,
                            options,
                            baseChunk.startRow,
                            compRecords,
                        );
                        // eslint-disable-next-line no-await-in-loop
                        baseChunk = await baseStream.next(bufferSize);
                    } else {
                        // Same group: compare line by line within the group
                        baseBlockLen = baseChunk.rows.length;
                        compBlockLen = compChunk.rows.length;
                        blockDiff = compareData(
                            baseChunk.rows,
                            compChunk.rows,
                            baseMeta,
                            compMeta,
                            summary,
                            options,
                            baseChunk.startRow,
                            compChunk.startRow,
                        );
                        // eslint-disable-next-line no-await-in-loop
                        baseChunk = await baseStream.next(bufferSize);
                        // eslint-disable-next-line no-await-in-loop
                        compChunk = await compStream.next(bufferSize);
                    }

                    const blockResult = applyBlockDiff({
                        dataDiff,
                        blockDiff,
                        baseBlockLen,
                        compBlockLen,
                        baseRowsProcessed: baseRecords,
                        compRowsProcessed: compRecords,
                        totalRecords,
                        currentSummary: summary,
                        sendMessage,
                    });

                    summary = blockResult.summary;
                    baseRecords = blockResult.baseRecords;
                    compRecords = blockResult.compRecords;
                    maxDiffCountReached = blockResult.maxDiffReached;
                }
            } else {
                // Line-by-line comparison within fixed-size blocks
                let endReached = false;

                // In case of filter we need to track start positions separately
                let startBase = 0;
                let startComp = 0;
                while (
                    Math.max(startBase, startComp) < totalRecords &&
                    !maxDiffCountReached &&
                    !endReached
                ) {
                    // eslint-disable-next-line no-await-in-loop
                    const baseDataFull = await getData(
                        baseFile,
                        startBase,
                        bufferSize,
                        baseMeta.columns,
                        options,
                        filterData,
                    );
                    // eslint-disable-next-line no-await-in-loop
                    const compDataFull = await getData(
                        compFile,
                        startComp,
                        bufferSize,
                        compMeta.columns,
                        options,
                        filterData,
                    );

                    let baseData = baseDataFull.data;
                    let compData = compDataFull.data;
                    if (differentTypes) {
                        if (baseType === 'json') {
                            baseData = transformData(
                                baseDataFull.data,
                                baseMeta,
                            );
                        }
                        if (compType === 'json') {
                            compData = transformData(
                                compDataFull.data,
                                compMeta,
                            );
                        }
                    }

                    const blockDiff = compareData(
                        baseData,
                        compData,
                        baseMeta,
                        compMeta,
                        summary,
                        options,
                        baseRecords,
                        compRecords,
                    );

                    const blockResult = applyBlockDiff({
                        dataDiff,
                        blockDiff,
                        baseBlockLen: baseData.length,
                        compBlockLen: compData.length,
                        baseRowsProcessed: baseRecords,
                        compRowsProcessed: compRecords,
                        totalRecords,
                        currentSummary: summary,
                        sendMessage,
                    });

                    summary = blockResult.summary;
                    baseRecords = blockResult.baseRecords;
                    compRecords = blockResult.compRecords;
                    maxDiffCountReached = blockResult.maxDiffReached;

                    // If filter is applied, we need to adjust the start positions based on the last retrieved rows
                    if (filterData !== null) {
                        startBase = baseDataFull.lastRow + 1;
                        startComp = compDataFull.lastRow + 1;
                    } else {
                        startBase += bufferSize;
                        startComp += bufferSize;
                    }
                    // Check if end is reached
                    if (baseDataFull.endReached || compDataFull.endReached) {
                        endReached = true;
                    } else {
                        // Update page maps
                        pageMaps.base.push(baseDataFull.lastRow + 1);
                        pageMaps.comp.push(compDataFull.lastRow + 1);
                    }
                }
            }

            // Derive additional summary info
            const dataDiffCols = dataDiff.modifiedRows.reduce((acc, row) => {
                if (row.diff) {
                    Object.keys(row.diff).forEach((colName) => {
                        if (!acc.includes(colName)) {
                            acc.push(colName);
                        }
                    });
                }
                return acc;
            }, [] as string[]);
            summary.colsWithDataDiffs = dataDiffCols.length;
            summary.colsWithMetadataDiffs = Object.keys(
                metadataDiff.attributeDiffs,
            ).length;
            summary.colsWithoutDiffs = metadataDiff.commonCols.filter(
                (col) =>
                    !dataDiffCols.includes(col) &&
                    !metadataDiff.attributeDiffs[col],
            ).length;

            sendMessage(100, summary.totalDiffs, {
                metadata: metadataDiff,
                data: dataDiff,
                settings: options,
                summary,
                pageMaps,
            });
        } catch (error) {
            sendMessage(0, 0, undefined, (error as Error).message);
        }
        // Exit the process after a short delay to ensure all messages are sent
        setTimeout(() => {
            process.exit();
        }, 1000);
    },
);
