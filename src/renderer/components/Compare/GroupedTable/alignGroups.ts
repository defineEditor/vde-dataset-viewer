import {
    CompareSettings,
    DatasetDiff,
    GroupPageRange,
    IHeaderCell,
    ITableRow,
    TableRowValue,
} from '@interfaces/common';

export interface GroupedCompareRow extends ITableRow {
    vdeGroupKey: string;
    vdeOrigRowIndex: number | null;
    vdeIsPlaceholderRow: boolean;
    vdeIsMissingGroup: boolean;
    vdeIsUnmatchedRow: boolean;
}

export interface GroupMeta {
    groupKey: string;
    baseCount: number;
    compCount: number;
    hasDiff: boolean;
    diffRowCount: number;
    missingInBase: boolean;
    missingInCompare: boolean;
    tooltip: string;
}

export interface AlignedGroupedCompareData {
    baseRows: GroupedCompareRow[];
    compRows: GroupedCompareRow[];
    groupMetaByKey: Map<string, GroupMeta>;
    initialExpandedGroupKeys: Record<string, boolean>;
    baseGroupColIds: string[];
    compGroupColIds: string[];
}

type GroupCompareOptions = Pick<
    CompareSettings,
    'ignoreColumnCase' | 'ignoreValueCase' | 'ignoreWhiteSpaces'
>;

export const resolveGroupColumnIds = (
    header: IHeaderCell[],
    groupColumns: string[],
): string[] => {
    const exactSet = new Set(header.map((col) => col.id));
    const lowerMap = new Map<string, string>();
    header.forEach((col) => {
        const lower = col.id.toLowerCase();
        if (!lowerMap.has(lower)) {
            lowerMap.set(lower, col.id);
        }
    });

    const resolved: string[] = [];
    groupColumns.forEach((colName) => {
        if (exactSet.has(colName)) {
            resolved.push(colName);
        } else {
            const match = lowerMap.get(colName.toLowerCase());
            if (match) {
                resolved.push(match);
            }
        }
    });
    return resolved;
};

const compareGroupValues = (
    a: TableRowValue | undefined,
    b: TableRowValue | undefined,
    options?: Pick<
        GroupCompareOptions,
        'ignoreValueCase' | 'ignoreWhiteSpaces'
    >,
): number => {
    const aMissing = a === null || a === undefined;
    const bMissing = b === null || b === undefined;
    if (aMissing && bMissing) return 0;
    if (aMissing) return -1;
    if (bMissing) return 1;
    if (a === b) return 0;
    if (typeof a === 'number' && typeof b === 'number') {
        const aNaN = Number.isNaN(a);
        const bNaN = Number.isNaN(b);
        if (aNaN && bNaN) return 0;
        if (aNaN) return -1;
        if (bNaN) return 1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
    let sa = String(a);
    let sb = String(b);
    if (options?.ignoreWhiteSpaces) {
        sa = sa.trim();
        sb = sb.trim();
    }
    if (options?.ignoreValueCase) {
        sa = sa.toLowerCase();
        sb = sb.toLowerCase();
    }
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
};

const compareGroupKeys = (
    a: (TableRowValue | undefined)[],
    b: (TableRowValue | undefined)[],
    options?: Pick<
        GroupCompareOptions,
        'ignoreValueCase' | 'ignoreWhiteSpaces'
    >,
): number => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const cmp = compareGroupValues(a[i], b[i], options);
        if (cmp !== 0) return cmp;
    }
    if (a.length < b.length) return -1;
    if (a.length > b.length) return 1;
    return 0;
};

const serializeValueForKey = (
    val: TableRowValue | undefined,
    options?: Pick<
        GroupCompareOptions,
        'ignoreValueCase' | 'ignoreWhiteSpaces'
    >,
): string => {
    if (val === null || val === undefined) {
        return 'null';
    }
    if (typeof val === 'number') {
        if (Number.isNaN(val)) return 'nan';
        return `n:${val}`;
    }
    if (typeof val === 'boolean') {
        return `b:${val}`;
    }
    let str = String(val);
    if (options?.ignoreWhiteSpaces) {
        str = str.trim();
    }
    if (options?.ignoreValueCase) {
        str = str.toLowerCase();
    }
    return `s:${str}`;
};

const serializeGroupKey = (
    values: (TableRowValue | undefined)[],
    options?: Pick<
        GroupCompareOptions,
        'ignoreValueCase' | 'ignoreWhiteSpaces'
    >,
): string => {
    return JSON.stringify(
        values.map((val) => serializeValueForKey(val, options)),
    );
};

interface GroupRun {
    keyValues: (TableRowValue | undefined)[];
    baseKey: string;
    rows: { row: ITableRow; origRowIndex: number }[];
}

const buildGroupRuns = (
    rows: ITableRow[],
    groupColIds: string[],
    pageOffset: number,
    options?: Pick<
        GroupCompareOptions,
        'ignoreValueCase' | 'ignoreWhiteSpaces'
    >,
): GroupRun[] => {
    const runs: GroupRun[] = [];

    rows.forEach((row, index) => {
        const keyValues = groupColIds.map((colId) => row[colId]);
        const baseKey = serializeGroupKey(keyValues, options);
        const origRowIndex = pageOffset + index;

        const lastRun = runs[runs.length - 1];
        if (
            lastRun &&
            compareGroupKeys(lastRun.keyValues, keyValues, options) === 0
        ) {
            lastRun.rows.push({ row, origRowIndex });
        } else {
            runs.push({
                keyValues,
                baseKey,
                rows: [{ row, origRowIndex }],
            });
        }
    });

    return runs;
};

const createPlaceholderRow = (
    groupKey: string,
    isMissingGroup: boolean,
): GroupedCompareRow => ({
    vdeGroupKey: groupKey,
    vdeOrigRowIndex: null,
    vdeIsPlaceholderRow: true,
    vdeIsMissingGroup: isMissingGroup,
    vdeIsUnmatchedRow: false,
});

const buildDiffRowSets = (datasetDiff: DatasetDiff | null) => {
    const baseDiffRows = new Set<number>();
    const compDiffRows = new Set<number>();

    if (!datasetDiff) {
        return { baseDiffRows, compDiffRows };
    }

    datasetDiff.data.modifiedRows.forEach((item) => {
        if (item.rowBase !== null) baseDiffRows.add(item.rowBase);
        if (item.rowCompare !== null) compDiffRows.add(item.rowCompare);
    });
    datasetDiff.data.addedRows.forEach((item) => {
        if (item.rowBase !== null) baseDiffRows.add(item.rowBase);
        if (item.rowCompare !== null) compDiffRows.add(item.rowCompare);
    });
    datasetDiff.data.deletedRows.forEach((item) => {
        if (item.rowBase !== null) baseDiffRows.add(item.rowBase);
        if (item.rowCompare !== null) compDiffRows.add(item.rowCompare);
    });

    return { baseDiffRows, compDiffRows };
};

export const findGroupPageForBaseRow = (
    groupPageMaps: GroupPageRange[],
    rowIndex: number,
): number => {
    if (rowIndex < 0 || groupPageMaps.length === 0) return -1;
    let low = 0;
    let high = groupPageMaps.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const range = groupPageMaps[mid];
        if (rowIndex < range.baseStart) {
            high = mid - 1;
        } else if (rowIndex >= range.baseStart + range.baseLength) {
            low = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
};

export const alignGroupedCompareData = ({
    baseData,
    compData,
    baseHeader,
    compHeader,
    groupColumns,
    options,
    datasetDiff,
    currentPage,
    pageSize,
    baseRowOffset,
    compRowOffset,
}: {
    baseData: ITableRow[];
    compData: ITableRow[];
    baseHeader: IHeaderCell[];
    compHeader: IHeaderCell[];
    groupColumns: string[];
    options: GroupCompareOptions;
    datasetDiff: DatasetDiff | null;
    currentPage: number;
    pageSize: number;
    baseRowOffset?: number;
    compRowOffset?: number;
}): AlignedGroupedCompareData => {
    const baseGroupColIds = resolveGroupColumnIds(baseHeader, groupColumns);
    const compGroupColIds = resolveGroupColumnIds(compHeader, groupColumns);

    const defaultPageOffset = currentPage * pageSize;
    const resolvedBaseRowOffset = baseRowOffset ?? defaultPageOffset;
    const resolvedCompRowOffset = compRowOffset ?? defaultPageOffset;
    const baseRuns = buildGroupRuns(
        baseData,
        baseGroupColIds,
        resolvedBaseRowOffset,
        options,
    );
    const compRuns = buildGroupRuns(
        compData,
        compGroupColIds,
        resolvedCompRowOffset,
        options,
    );

    const { baseDiffRows, compDiffRows } = buildDiffRowSets(datasetDiff);

    const baseRows: GroupedCompareRow[] = [];
    const compRows: GroupedCompareRow[] = [];
    const groupMetaByKey = new Map<string, GroupMeta>();
    const initialExpandedGroupKeys: Record<string, boolean> = {};
    const keyOccurrences = new Map<string, number>();

    const nextUniqueGroupKey = (baseKey: string): string => {
        const count = keyOccurrences.get(baseKey) || 0;
        keyOccurrences.set(baseKey, count + 1);
        return count === 0 ? baseKey : `${baseKey}#${count}`;
    };

    let i = 0;
    let j = 0;

    while (i < baseRuns.length || j < compRuns.length) {
        const baseRun = i < baseRuns.length ? baseRuns[i] : null;
        const compRun = j < compRuns.length ? compRuns[j] : null;

        let cmp: number;
        if (baseRun && compRun) {
            cmp = compareGroupKeys(
                baseRun.keyValues,
                compRun.keyValues,
                options,
            );
        } else if (baseRun) {
            cmp = -1;
        } else {
            cmp = 1;
        }

        if (cmp === 0 && baseRun && compRun) {
            const groupKey = nextUniqueGroupKey(baseRun.baseKey);
            const maxLen = Math.max(baseRun.rows.length, compRun.rows.length);

            let diffRowCount = 0;
            for (let k = 0; k < maxLen; k++) {
                const bItem = baseRun.rows[k];
                const cItem = compRun.rows[k];

                if (bItem) {
                    baseRows.push({
                        ...bItem.row,
                        vdeGroupKey: groupKey,
                        vdeOrigRowIndex: bItem.origRowIndex,
                        vdeIsPlaceholderRow: false,
                        vdeIsMissingGroup: false,
                        vdeIsUnmatchedRow: !cItem,
                    });
                } else {
                    baseRows.push(createPlaceholderRow(groupKey, false));
                }

                if (cItem) {
                    compRows.push({
                        ...cItem.row,
                        vdeGroupKey: groupKey,
                        vdeOrigRowIndex: cItem.origRowIndex,
                        vdeIsPlaceholderRow: false,
                        vdeIsMissingGroup: false,
                        vdeIsUnmatchedRow: !bItem,
                    });
                } else {
                    compRows.push(createPlaceholderRow(groupKey, false));
                }

                const rowHasDiff =
                    !bItem ||
                    !cItem ||
                    baseDiffRows.has(bItem.origRowIndex) ||
                    compDiffRows.has(cItem.origRowIndex);
                if (rowHasDiff) {
                    diffRowCount++;
                }
            }

            const hasDiff =
                diffRowCount > 0 || baseRun.rows.length !== compRun.rows.length;
            let tooltip = '';
            if (hasDiff) {
                tooltip = `${diffRowCount} ${diffRowCount === 1 ? 'row' : 'rows'} with differences`;
            }

            groupMetaByKey.set(groupKey, {
                groupKey,
                baseCount: baseRun.rows.length,
                compCount: compRun.rows.length,
                hasDiff,
                diffRowCount,
                missingInBase: false,
                missingInCompare: false,
                tooltip,
            });
            if (hasDiff) {
                initialExpandedGroupKeys[groupKey] = true;
            }
            i++;
            j++;
        } else if (cmp < 0 && baseRun) {
            // Group exists only in base (missing in compare)
            const groupKey = nextUniqueGroupKey(baseRun.baseKey);
            baseRun.rows.forEach((bItem) => {
                baseRows.push({
                    ...bItem.row,
                    vdeGroupKey: groupKey,
                    vdeOrigRowIndex: bItem.origRowIndex,
                    vdeIsPlaceholderRow: false,
                    vdeIsMissingGroup: false,
                    vdeIsUnmatchedRow: true,
                });
                compRows.push(createPlaceholderRow(groupKey, true));
            });

            groupMetaByKey.set(groupKey, {
                groupKey,
                baseCount: baseRun.rows.length,
                compCount: 0,
                hasDiff: true,
                diffRowCount: baseRun.rows.length,
                missingInBase: false,
                missingInCompare: true,
                tooltip: `Group missing in compare (${baseRun.rows.length} ${baseRun.rows.length === 1 ? 'row' : 'rows'})`,
            });
            initialExpandedGroupKeys[groupKey] = true;
            i++;
        } else if (compRun) {
            // Group exists only in compare (missing in base)
            const groupKey = nextUniqueGroupKey(compRun.baseKey);
            compRun.rows.forEach((cItem) => {
                baseRows.push(createPlaceholderRow(groupKey, true));
                compRows.push({
                    ...cItem.row,
                    vdeGroupKey: groupKey,
                    vdeOrigRowIndex: cItem.origRowIndex,
                    vdeIsPlaceholderRow: false,
                    vdeIsMissingGroup: false,
                    vdeIsUnmatchedRow: true,
                });
            });

            groupMetaByKey.set(groupKey, {
                groupKey,
                baseCount: 0,
                compCount: compRun.rows.length,
                hasDiff: true,
                diffRowCount: compRun.rows.length,
                missingInBase: true,
                missingInCompare: false,
                tooltip: `Group missing in base (${compRun.rows.length} ${compRun.rows.length === 1 ? 'row' : 'rows'})`,
            });
            initialExpandedGroupKeys[groupKey] = true;
            j++;
        }
    }

    return {
        baseRows,
        compRows,
        groupMetaByKey,
        initialExpandedGroupKeys,
        baseGroupColIds,
        compGroupColIds,
    };
};
