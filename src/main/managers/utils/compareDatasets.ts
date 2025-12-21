import {
    ItemDescription,
    ItemDataArray,
    ItemType,
    CompareOptions,
    MetadataDiff,
    DataDiff,
    DataDiffRow,
    DatasetMetadata,
    DatasetDiff,
} from 'interfaces/common';

export const compareMetadata = (
    base: DatasetMetadata,
    compare: DatasetMetadata,
): {
    metadata: MetadataDiff;
    summary: Partial<DatasetDiff['summary']>;
} => {
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

    const summary: Partial<DatasetDiff['summary']> = {
        columnsWithDiffs:
            commonCols.length - Object.keys(metadataDiff.attributeDiffs).length,
        columnsWithoutDiffs:
            metadataDiff.missingInBase.length +
            metadataDiff.missingInCompare.length,
    };
    return {
        metadata: metadataDiff,
        summary,
    };
};

export function compareData(
    base: ItemDataArray[],
    compare: ItemDataArray[],
    baseMeta: DatasetMetadata,
    compareMeta: DatasetMetadata,
    summaryInit: DatasetDiff['summary'],
    rowShift: number = 0,
    options: CompareOptions = {},
): { data: DataDiff; summary: Partial<DatasetDiff['summary']> } {
    const {
        tolerance = 1e-12,
        idColumns,
        maxDiffCount,
        maxColumnDiffCount,
    } = options;

    // Column Maps
    const baseCols = new Map(
        baseMeta?.columns.map((c, i) => [c.name, { desc: c, index: i }]) || [],
    );
    const compareCols = new Map(
        compareMeta?.columns.map((c, i) => [c.name, { desc: c, index: i }]) ||
            [],
    );

    const allCols = [...baseCols.keys(), ...compareCols.keys()];
    const commonCols: string[] = allCols.filter(
        (name) => baseCols.has(name) && compareCols.has(name),
    );

    // Track columns that reached max diff count
    const columnDiffCounts = new Map<string, number>();
    const maxColDiffReached: string[] = summaryInit?.maxColDiffReached || [];

    // Data Comparison
    const dataDiff: DataDiff = {
        deletedRows: [],
        addedRows: [],
        modifiedRows: [],
    };
    let summary: Partial<DatasetDiff['summary']> = {
        firstDiffRow: null,
        lastDiffRow: null,
        totalDiffs: 0,
        maxDiffReached: false,
        maxColDiffReached: [],
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
                rowBase: baseIdx + 1 + rowShift,
                rowCompare: compareIdx + 1 + rowShift,
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

        for (let i = 0; i < maxRows || maxDiffReached; i++) {
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

            if (maxDiffCount !== undefined && diffCount >= maxDiffCount) {
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

    summary = {
        firstDiffRow: newFirstLow,
        lastDiffRow: newLastLow,
        totalDiffs: newTotalDiffs,
        maxDiffReached,
        maxColDiffReached,
    };

    return { data: dataDiff, summary };
}
