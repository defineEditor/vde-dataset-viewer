import {
    Dataset,
    ItemDescription,
    ItemDataArray,
    ItemType,
} from 'js-stream-dataset-json';

export interface CompareOptions {
    tolerance?: number;
    idColumns?: string[];
    maxDiffCount?: number;
    maxColumnDiffCount?: number;
}

export interface MetadataDiff {
    missingInBase: string[];
    missingInCompare: string[];
    attributeDiffs: {
        [columnName: string]: {
            [attribute: string]: {
                base: string | number;
                compare: string | number;
            };
        };
    };
    positionDiffs: {
        [columnName: string]: { base: number; compare: number };
    };
    dsAttributeDiffs: {
        [attribute: string]: {
            base: string | number;
            compare: string | number;
        };
    };
}

export interface DataDiffRow {
    rowBase: number | null;
    rowCompare: number | null;
    diff?: {
        [columnName: string]: [ItemDataArray[number], ItemDataArray[number]];
    };
}

export interface DataDiff {
    deletedRows: DataDiffRow[];
    addedRows: DataDiffRow[];
    modifiedRows: DataDiffRow[];
}

export interface DatasetDiff {
    metadata: MetadataDiff;
    data: DataDiff;
    summary: {
        firstDiffRow: number | null;
        lastDiffRow: number | null;
        totalDiffs: number;
        maxDiffReached: boolean;
    };
}

export function compareDatasets(
    base: Dataset,
    compare: Dataset,
    options: CompareOptions = {},
): DatasetDiff {
    const {
        tolerance = 1e-12,
        idColumns,
        maxDiffCount,
        maxColumnDiffCount,
    } = options;
    const columnDiffCounts = new Map<string, number>();

    // Metadata Comparison
    const metadataDiff: MetadataDiff = {
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

    // Column Analysis
    const baseCols = new Map(
        base.columns.map((c, i) => [c.name, { desc: c, index: i }]),
    );
    const compareCols = new Map(
        compare.columns.map((c, i) => [c.name, { desc: c, index: i }]),
    );

    const allColNames = new Set([...baseCols.keys(), ...compareCols.keys()]);
    const commonCols: string[] = [];
    // Track columns that reached max diff count
    const maxColDiffReached: string[] = [];

    for (const name of allColNames) {
        const inBase = baseCols.get(name);
        const inCompare = compareCols.get(name);

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
                const baseColIdx = baseCols.get(colName)!.index;
                const compareColIdx = compareCols.get(colName)!.index;
                const type = baseCols.get(colName)!.desc.dataType;

                const val1 = baseRow[baseColIdx];
                const val2 = compRow[compareColIdx];

                if (!areValuesEqual(val1, val2, type)) {
                    diffs[colName] = [val1, val2];
                    hasDiff = true;

                    if (maxColumnDiffCount !== undefined) {
                        const currentCount = columnDiffCounts.get(colName) || 0;
                        columnDiffCounts.set(colName, currentCount + 1);
                        if (currentCount + 1 >= maxColumnDiffCount) {
                            maxColDiffReached.push(colName);
                        }
                    }
                }
            });

        if (hasDiff) {
            return {
                rowBase: baseIdx + 1,
                rowCompare: compareIdx + 1,
                diff: diffs,
            };
        }
        return null;
    };

    const runLineByLine = () => {
        const maxRows = Math.max(base.rows.length, compare.rows.length);
        let diffCount = 0;
        let maxDiffReached = false;

        for (let i = 0; i < maxRows || maxDiffReached; i++) {
            if (i < base.rows.length && i < compare.rows.length) {
                const diff = compareRow(base.rows[i], compare.rows[i], i, i);
                if (diff) {
                    diffCount++;
                    dataDiff.modifiedRows.push(diff);
                }
            } else if (i >= base.rows.length) {
                dataDiff.addedRows.push({
                    rowBase: null,
                    rowCompare: i + 1,
                });
                diffCount++;
            } else {
                dataDiff.deletedRows.push({
                    rowBase: i + 1,
                    rowCompare: null,
                });
                diffCount++;
            }
        }
        if (maxDiffCount !== undefined && diffCount >= maxDiffCount) {
            maxDiffReached = true;
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
            base.rows.forEach((row, i) => {
                const key = generateKey(row, baseCols);
                baseMap.set(key, { row, index: i });
            });

            const visitedKeys = new Set<string>();

            compare.rows.forEach((row, i) => {
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
                } else {
                    dataDiff.addedRows.push({
                        rowBase: null,
                        rowCompare: i + 1,
                    });
                }
            });

            for (const [key, baseEntry] of baseMap) {
                if (!visitedKeys.has(key)) {
                    dataDiff.deletedRows.push({
                        rowBase: baseEntry.index + 1,
                        rowCompare: null,
                    });
                }
            }
        } else {
            runLineByLine();
        }
    } else {
        runLineByLine();
    }

    return {
        metadata: metadataDiff,
        data: dataDiff,
    };
}
