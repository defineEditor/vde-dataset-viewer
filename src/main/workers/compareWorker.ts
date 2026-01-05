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
} from 'interfaces/common';
import Filter from 'js-array-filter';
import DatasetJson from 'js-stream-dataset-json';
import DatasetSas7bdat from 'js-stream-sas7bdat';
import DatasetXpt from 'xport-js';

const compareMetadata = (
    base: DatasetMetadata,
    compare: DatasetMetadata,
    options: CompareSettings,
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
                return !new RegExp(`/${ignorePattern}/`, 'i').test(column.name);
            })
            .map((c, i) => [c.name, { desc: c, index: i }]),
    );
    const compareCols = new Map(
        compare.columns
            .filter((column) => {
                if (!ignorePattern) return true;
                return !new RegExp(`/${ignorePattern}/`, 'i').test(column.name);
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

            for (const attr of attrs) {
                if (inBase.desc[attr] !== inCompare.desc[attr]) {
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

const compareData = (
    base: ItemDataArray[],
    compare: ItemDataArray[],
    baseMeta: DatasetMetadata,
    compareMeta: DatasetMetadata,
    summaryInit: DatasetDiff['summary'],
    options: CompareSettings,
    rowShift: number = 0,
): { data: DataDiff; summary: Partial<DatasetDiff['summary']> } => {
    const {
        tolerance = 1e-12,
        idColumns,
        maxDiffCount,
        maxColumnDiffCount,
        ignoreColumnCase,
        ignorePattern,
    } = options;

    // Column Maps
    const baseCols = new Map(
        baseMeta?.columns
            .filter(
                (column) =>
                    !ignorePattern ||
                    !new RegExp(`/${ignorePattern}/`, 'i').test(column.name),
            )
            .map((c, i) => {
                if (ignoreColumnCase) {
                    return [c.name.toLowerCase(), { desc: c, index: i }];
                }
                return [c.name, { desc: c, index: i }];
            }) || [],
    );
    const compareCols = new Map(
        compareMeta?.columns
            .filter(
                (column) =>
                    !ignorePattern ||
                    !new RegExp(`/${ignorePattern}/`, 'i').test(column.name),
            )
            .map((c, i) => {
                if (ignoreColumnCase) {
                    return [c.name.toLowerCase(), { desc: c, index: i }];
                }
                return [c.name, { desc: c, index: i }];
            }) || [],
    );

    const allCols = [...baseCols.keys(), ...compareCols.keys()].filter(
        (name, index, array) => index === array.indexOf(name),
    );

    const commonCols: string[] = allCols.filter((name) => {
        return baseCols.has(name) && compareCols.has(name);
    });

    // Track columns that reached max diff count
    const columnDiffCounts = new Map<string, number>();
    const maxColDiffReached: string[] = summaryInit?.maxColDiffReached || [];

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
        if (isNumeric && typeof val1 === 'number' && typeof val2 === 'number') {
            return Math.abs(val1 - val2) <= tolerance;
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
                rowBase: baseIdx + rowShift,
                rowCompare: compareIdx + rowShift,
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
            }
            if (hasDiff) {
                diffCount++;
                if (firstDiffRow === null) {
                    firstDiffRow = i + rowShift;
                }
                lastDiffRow = i + rowShift;
            }

            if (maxDiffCount > 0 && diffCount >= maxDiffCount) {
                maxDiffReached = true;
            }
        }
    };

    if (idColumns && idColumns.length > 0) {
        // Key-based comparison
        const validIdCols = idColumns.filter(
            (col) => baseCols.has(col) && compareCols.has(col),
        );

        if (validIdCols.length > 0) {
            const generateKey = (
                row: ItemDataArray,
                colMap: Map<string, { index: number }>,
            ) => {
                return validIdCols
                    .map((col) => {
                        const idx = colMap.get(col)!.index;
                        return String(row[idx]);
                    })
                    .join('|');
            };

            const baseMap = new Map<
                string,
                { row: ItemDataArray; index: number }
            >();
            base.forEach((row, i) => {
                const key = generateKey(row, baseCols);
                baseMap.set(key, { row, index: i });
            });

            const visitedKeys = new Set<string>();

            compare.forEach((row, i) => {
                const key = generateKey(row, compareCols);
                visitedKeys.add(key);

                if (baseMap.has(key)) {
                    const baseEntry = baseMap.get(key)!;
                    const diff = compareRow(
                        baseEntry.row,
                        row,
                        baseEntry.index,
                        i,
                    );
                    if (diff) {
                        dataDiff.modifiedRows.push(diff);
                    }
                }
            });
        } else {
            runLineByLine();
        }
    } else {
        runLineByLine();
    }

    // Get summary
    const newFirstLow =
        firstDiffRow !== null
            ? Math.min(
                  firstDiffRow + rowShift,
                  summaryInit?.firstDiffRow || Infinity,
              )
            : summaryInit?.firstDiffRow || null;
    const newLastLow =
        lastDiffRow !== null
            ? Math.max(
                  summaryInit?.lastDiffRow || -Infinity,
                  lastDiffRow + rowShift,
              )
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
    let data: DatasetJson | DatasetXpt | DatasetSas7bdat;
    try {
        if (extension === 'xpt') {
            data = new DatasetXpt(filePath);
        } else if (extension === 'sas7bdat') {
            data = new DatasetSas7bdat(filePath);
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
    file: DatasetJson | DatasetXpt | DatasetSas7bdat,
): Promise<DatasetJsonMetadata> => {
    if (file instanceof DatasetXpt) {
        return file.getMetadata('dataset-json1.1');
    }
    return file.getMetadata();
};

const getData = async (
    file: DatasetJson | DatasetXpt | DatasetSas7bdat,
    start: number,
    length: number,
    columns: ColumnMetadata[],
    filterData: BasicFilter | null,
): Promise<ItemDataArray[]> => {
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
            roundPrecision: 12,
            filter,
        })) as ItemDataArray[];
    }
    return (await file.getData({
        start,
        length,
        filter,
    })) as ItemDataArray[];
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

            for (
                let start = 0;
                start < totalRecords && !maxDiffCountReached;
                start += bufferSize
            ) {
                // eslint-disable-next-line no-await-in-loop
                const baseData = await getData(
                    baseFile,
                    start,
                    bufferSize,
                    baseMeta.columns,
                    filterData,
                );
                // eslint-disable-next-line no-await-in-loop
                const compData = await getData(
                    compFile,
                    start,
                    bufferSize,
                    compMeta.columns,
                    filterData,
                );

                const blockDiff = compareData(
                    baseData,
                    compData,
                    baseMeta,
                    compMeta,
                    summary,
                    options,
                    start,
                );

                dataDiff.addedRows.push(...blockDiff.data.addedRows);
                dataDiff.deletedRows.push(...blockDiff.data.deletedRows);
                dataDiff.modifiedRows.push(...blockDiff.data.modifiedRows);

                summary = {
                    ...summary,
                    ...blockDiff.summary,
                    totalRowsChecked: blockDiff.summary.maxDiffReached
                        ? (blockDiff.summary.lastDiffRow || 0) + 1
                        : start + Math.min(baseData.length, compData.length),
                };

                maxDiffCountReached = blockDiff.summary.maxDiffReached || false;

                // Send progress
                const progress =
                    totalRecords > 0
                        ? Math.round(
                              (summary.totalRowsChecked / totalRecords) * 100,
                          )
                        : 0;
                if (progress < 100) {
                    sendMessage(Math.max(progress, 1), summary.totalDiffs);
                } else {
                    // If 100%, will send final message later
                    sendMessage(99, summary.totalDiffs);
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
                summary,
            });
        } catch (error) {
            sendMessage(0, 0, undefined, (error as Error).message);
        }
        process.exit();
    },
);
