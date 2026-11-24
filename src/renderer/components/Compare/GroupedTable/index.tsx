import React, {
    useMemo,
    useRef,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { Box } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Column as IColumn,
    ColumnDef,
    ExpandedState,
    Updater,
    columnGroupingFeature,
    columnPinningFeature,
    columnResizingFeature,
    columnSizingFeature,
    createExpandedRowModel,
    createGroupedRowModel,
    metaHelper,
    rowExpandingFeature,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import {
    ColumnMeta,
    ITableData,
    ItemDescription,
    ItemType,
    IUiControl,
    TableRowValue,
    TableSettings,
} from '@interfaces/common';
import { useAppTheme } from '@renderer/theme';
import useTableHeight from '@components/DatasetView/useTableHeight';
import GroupedTableView from '@components/Compare/GroupedTable/View';
import {
    GroupedCompareRow,
    GroupMeta,
} from '@components/Compare/GroupedTable/alignGroups';

const groupedCompareFeatures = tableFeatures({
    columnGroupingFeature,
    rowExpandingFeature,
    columnPinningFeature,
    columnSizingFeature,
    columnResizingFeature,
    groupedRowModel: createGroupedRowModel(),
    expandedRowModel: createExpandedRowModel(),
    columnMeta: metaHelper<ColumnMeta>(),
});

export type GroupedCompareFeatures = typeof groupedCompareFeatures;

type PinningStyle = (theme: Theme) => React.CSSProperties;

const emptyGoTo = { row: null, column: null, cellSelection: false };

const styles = {
    fullHeight: {
        height: '100%',
    },
};

export interface AnnotationData {
    text: string | React.ReactElement;
    color: string;
}

interface GroupedCompareTableProps {
    tableData: ITableData;
    alignedRows: GroupedCompareRow[];
    groupColIds: string[];
    groupMetaByKey: Map<string, GroupMeta>;
    side: 'base' | 'comp';
    expandedGroupKeys: Record<string, boolean>;
    onExpandedGroupKeysChange: (next: Record<string, boolean>) => void;
    pageRowRange?: { start: number; length: number } | null;
    settings: TableSettings;
    isLoading?: boolean;
    handleContextMenu?: (
        event: React.MouseEvent<HTMLElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    annotatedCells?: Map<string, AnnotationData> | null;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    currentPage?: number;
    goTo?: IUiControl['goTo'];
    onSetGoTo?: (goTo: Partial<IUiControl['goTo']>) => void;
}

const createPinningStyle = (
    column: IColumn<GroupedCompareFeatures, GroupedCompareRow, unknown>,
    backgroundColor: string,
    zIndex = 1,
): PinningStyle => {
    const isPinned = column.getIsPinned();

    return () => ({
        backgroundColor,
        left:
            isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
        right: isPinned === 'end' ? `${column.getAfter('end')}px` : undefined,
        position: isPinned ? 'sticky' : 'relative',
        zIndex,
    });
};

const GroupedCompareTable: React.FC<GroupedCompareTableProps> = ({
    tableData,
    alignedRows,
    groupColIds,
    groupMetaByKey,
    side,
    expandedGroupKeys,
    onExpandedGroupKeysChange,
    pageRowRange = null,
    settings,
    isLoading = false,
    handleContextMenu = () => {},
    annotatedCells = null,
    containerRef = undefined,
    onScroll = undefined,
    currentPage = 0,
    goTo = emptyGoTo,
    onSetGoTo = () => {},
}) => {
    const theme = useAppTheme();
    const { tableHeight, viewContainerRef } = useTableHeight();

    const lastGroupColId =
        groupColIds.length > 0 ? groupColIds[groupColIds.length - 1] : null;
    const groupColSet = useMemo(() => new Set(groupColIds), [groupColIds]);

    const orderedHeader = useMemo(() => {
        const headerById = new Map(
            tableData.header.map((col) => [col.id, col]),
        );
        const groupHeaders = groupColIds
            .map((id) => headerById.get(id))
            .filter((col): col is NonNullable<typeof col> => Boolean(col));
        const otherHeaders = tableData.header.filter(
            (col) => !groupColSet.has(col.id),
        );
        return [...groupHeaders, ...otherHeaders];
    }, [tableData.header, groupColIds, groupColSet]);

    const columns = useMemo<
        ColumnDef<GroupedCompareFeatures, GroupedCompareRow>[]
    >(() => {
        const metadataByName: Record<string, ItemDescription> = {};
        tableData.metadata.columns.forEach((metadata) => {
            metadataByName[metadata.name.toLowerCase()] = metadata;
        });

        const result: ColumnDef<GroupedCompareFeatures, GroupedCompareRow>[] =
            orderedHeader.map((column) => {
                const columnMetadata = metadataByName[column.id.toLowerCase()];
                const columnInfo = {
                    name: columnMetadata?.name || column.id,
                    label: columnMetadata?.label,
                    length: columnMetadata?.length,
                    displayFormat: columnMetadata?.displayFormat,
                    dataType: columnMetadata?.dataType,
                };

                let style: React.CSSProperties = {};
                if (column.style) {
                    style = column.style;
                }
                if (column.align) {
                    style = { ...style, textAlign: column.align };
                } else if (
                    ['integer', 'float', 'double', 'decimal'].includes(
                        column.type || '',
                    )
                ) {
                    style = { ...style, textAlign: 'right' };
                }

                const colDef: ColumnDef<
                    GroupedCompareFeatures,
                    GroupedCompareRow
                > = {
                    id: column.id,
                    accessorKey: column.id,
                    header:
                        settings.showLabels && column.label
                            ? column.label
                            : column.id,
                    size:
                        column.id === lastGroupColId
                            ? Math.max(column.size ?? 150, 170)
                            : column.size,
                    enableResizing: true,
                    enableGrouping: column.id === lastGroupColId,
                    ...(column.id === lastGroupColId
                        ? {
                              getGroupingValue: (
                                  originalRow: GroupedCompareRow,
                              ) => originalRow.vdeGroupKey,
                          }
                        : {}),
                    meta: {
                        type: (column.numericDatetimeType
                            ? 'datetime'
                            : column.type || 'string') as
                            | ItemType
                            | 'rowNumber',
                        info: columnInfo,
                        ...(Object.keys(style).length > 0 ? { style } : {}),
                    },
                };

                if (column.cell) {
                    colDef.cell = column.cell as unknown as ColumnDef<
                        GroupedCompareFeatures,
                        GroupedCompareRow
                    >['cell'];
                }

                return colDef;
            });

        if (!settings.hideRowNumbers && !result.find((col) => col.id === '#')) {
            result.unshift({
                id: '#',
                accessorKey: '#',
                header: '#',
                size: theme.densitySettings.table.rowNumberWidth,
                enableResizing: false,
                enableGrouping: false,
                meta: { type: 'integer' },
            });
        }

        return result;
    }, [
        orderedHeader,
        tableData.metadata.columns,
        settings.showLabels,
        settings.hideRowNumbers,
        lastGroupColId,
        theme.densitySettings.table.rowNumberWidth,
    ]);

    const pinnedLeftColumnIds = useMemo(() => {
        const pinned = settings.hideRowNumbers ? [] : ['#'];
        groupColIds.forEach((colId) => {
            if (!pinned.includes(colId)) {
                pinned.push(colId);
            }
        });
        return pinned;
    }, [groupColIds, settings.hideRowNumbers]);

    const grouping = useMemo(
        () => (lastGroupColId ? [lastGroupColId] : []),
        [lastGroupColId],
    );

    const tableExpanded = useMemo<ExpandedState>(() => {
        if (!lastGroupColId) return {};
        const next: Record<string, boolean> = {};
        Object.entries(expandedGroupKeys).forEach(([groupKey, isExpanded]) => {
            if (isExpanded) {
                next[`${lastGroupColId}:${groupKey}`] = true;
            }
        });
        return next;
    }, [expandedGroupKeys, lastGroupColId]);

    const handleExpandedChange = useCallback(
        (updater: Updater<ExpandedState>) => {
            if (!lastGroupColId) return;
            const nextState =
                typeof updater === 'function'
                    ? updater(tableExpanded)
                    : updater;

            if (nextState === true) {
                const allExpanded: Record<string, boolean> = {};
                groupMetaByKey.forEach((_meta, key) => {
                    allExpanded[key] = true;
                });
                onExpandedGroupKeysChange(allExpanded);
                return;
            }

            const prefix = `${lastGroupColId}:`;
            const nextGroupKeys: Record<string, boolean> = {};
            Object.entries(nextState).forEach(([rowId, isExpanded]) => {
                if (isExpanded) {
                    const groupKey = rowId.startsWith(prefix)
                        ? rowId.slice(prefix.length)
                        : rowId;
                    nextGroupKeys[groupKey] = true;
                }
            });
            onExpandedGroupKeysChange(nextGroupKeys);
        },
        [
            lastGroupColId,
            tableExpanded,
            groupMetaByKey,
            onExpandedGroupKeysChange,
        ],
    );

    const table = useTable<GroupedCompareFeatures, GroupedCompareRow>({
        data: isLoading ? [] : alignedRows,
        columns,
        features: groupedCompareFeatures,
        debugTable: settings.debug,
        columnResizeMode: 'onEnd',
        groupedColumnMode: false,
        autoResetExpanded: false,
        state: {
            grouping,
            expanded: tableExpanded,
            columnPinning: {
                start: pinnedLeftColumnIds,
                end: [],
            },
        },
        onExpandedChange: handleExpandedChange,
    });

    const { rows } = table.getRowModel();
    const visibleColumns = table.getAllLeafColumns();
    const leftPinnedColumns = table
        .getStartVisibleLeafColumns()
        .filter((column) => !settings.hideRowNumbers || column.id !== '#');
    const centerColumns = table.getCenterVisibleLeafColumns();

    const pinningLayoutKey = visibleColumns
        .map(
            (column) =>
                `${column.id}:${column.getIsPinned()}:${column.getStart('start')}:${column.getAfter('end')}:${column.getSize()}`,
        )
        .join('|');

    const { headerPinningStyles, bodyPinningStyles } = useMemo(() => {
        const nextHeaderPinningStyles: Record<string, PinningStyle> = {};
        const nextBodyPinningStyles: Record<string, PinningStyle> = {};

        if (!pinningLayoutKey) {
            return {
                headerPinningStyles: nextHeaderPinningStyles,
                bodyPinningStyles: nextBodyPinningStyles,
            };
        }

        visibleColumns.forEach((column) => {
            if (!column.getIsPinned()) {
                return;
            }

            nextHeaderPinningStyles[column.id] = createPinningStyle(
                column,
                'table.header',
                4,
            );
            nextBodyPinningStyles[column.id] = createPinningStyle(
                column,
                column.id === '#' ? 'table.rowNumber' : 'background.paper',
                3,
            );
        });

        return {
            headerPinningStyles: nextHeaderPinningStyles,
            bodyPinningStyles: nextBodyPinningStyles,
        };
    }, [pinningLayoutKey, visibleColumns]);

    const internalContainerRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = containerRef || internalContainerRef;

    const columnVirtualizer = useVirtualizer({
        count: centerColumns.length,
        estimateSize: (index) => centerColumns[index].getSize(),
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 4,
    });

    useEffect(() => {
        columnVirtualizer.measure();
    }, [alignedRows, centerColumns.length, columnVirtualizer]);

    const estimatedRowHeight = theme.densitySettings.table.rowSize;

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => estimatedRowHeight,
        getScrollElement: () => tableContainerRef.current,
        ...(settings.dynamicRowHeight && {
            measureElement: (element) =>
                element?.getBoundingClientRect().height,
        }),
        overscan: theme.densitySettings.table.overscanRows,
    });

    useEffect(() => {
        rowVirtualizer.measure();
    }, [
        estimatedRowHeight,
        settings.dynamicRowHeight,
        rows.length,
        rowVirtualizer,
    ]);

    const virtualColumns = columnVirtualizer.getVirtualItems();
    const virtualRows = rowVirtualizer.getVirtualItems();

    let virtualPaddingLeft: number | undefined;
    let virtualPaddingRight: number | undefined;

    if (columnVirtualizer && virtualColumns?.length) {
        virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
        virtualPaddingRight =
            columnVirtualizer.getTotalSize() -
            (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
    }

    const [highlightedCell, setHighlightedCell] = useState<{
        rowId: string;
        columnId: string;
    } | null>(null);

    const handleCellClick = useCallback((rowId: string, columnId: string) => {
        setHighlightedCell({ rowId, columnId });
    }, []);

    // Handle goTo navigation: auto-expand target group, then scroll to leaf row & column
    useEffect(() => {
        if (goTo.row === null || isLoading || tableHeight <= 0) {
            return;
        }

        const targetOrigRowIndex = goTo.row - 1;
        const isTargetOnCurrentPage = pageRowRange
            ? targetOrigRowIndex >= pageRowRange.start &&
              targetOrigRowIndex < pageRowRange.start + pageRowRange.length
            : currentPage ===
              Math.floor(Math.max(targetOrigRowIndex, 0) / settings.pageSize);
        if (!isTargetOnCurrentPage) {
            return;
        }
        const visibleIndex = rows.findIndex(
            (r) =>
                !r.getIsGrouped() &&
                !r.original.vdeIsPlaceholderRow &&
                r.original.vdeOrigRowIndex === targetOrigRowIndex,
        );

        if (visibleIndex === -1) {
            // Target row might be inside a collapsed group: find its groupKey and expand it
            const targetAlignedRow = alignedRows.find(
                (r) =>
                    !r.vdeIsPlaceholderRow &&
                    r.vdeOrigRowIndex === targetOrigRowIndex,
            );
            if (
                targetAlignedRow &&
                !expandedGroupKeys[targetAlignedRow.vdeGroupKey]
            ) {
                onExpandedGroupKeysChange({
                    ...expandedGroupKeys,
                    [targetAlignedRow.vdeGroupKey]: true,
                });
            } else {
                // Row does not exist on this side/page: clear goTo so it doesn't stay stuck
                onSetGoTo({ row: null, column: null });
            }
            return;
        }

        rowVirtualizer.scrollToIndex(visibleIndex, { align: 'center' });

        let targetColumnId: string | null = null;
        if (goTo.column) {
            const matchingHeader = orderedHeader.find(
                (item) => item.id.toLowerCase() === goTo.column?.toLowerCase(),
            );
            targetColumnId = matchingHeader?.id || null;
            if (targetColumnId) {
                const centerIdx = centerColumns.findIndex(
                    (col) => col.id === targetColumnId,
                );
                if (centerIdx !== -1) {
                    columnVirtualizer.scrollToIndex(centerIdx, {
                        align: 'center',
                    });
                }
            }
        }

        const targetRow = rows[visibleIndex];
        if (targetRow) {
            setHighlightedCell({
                rowId: targetRow.id,
                columnId:
                    goTo.cellSelection && targetColumnId ? targetColumnId : '#',
            });
        }

        onSetGoTo({ row: null, column: null });
    }, [
        goTo.row,
        goTo.column,
        goTo.cellSelection,
        isLoading,
        tableHeight,
        currentPage,
        pageRowRange,
        settings.pageSize,
        rows,
        alignedRows,
        expandedGroupKeys,
        onExpandedGroupKeysChange,
        rowVirtualizer,
        columnVirtualizer,
        orderedHeader,
        centerColumns,
        onSetGoTo,
    ]);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            if (onScroll) {
                onScroll(e);
            }
        },
        [onScroll],
    );

    const updatedSettings: TableSettings = {
        ...settings,
        height: tableHeight,
    };

    const allCollapsed = useMemo(() => {
        if (groupMetaByKey.size === 0) return true;
        let everyCollapsed = true;
        groupMetaByKey.forEach((_meta, key) => {
            if (expandedGroupKeys[key]) {
                everyCollapsed = false;
            }
        });
        return everyCollapsed;
    }, [groupMetaByKey, expandedGroupKeys]);

    const handleToggleAllGroups = useCallback(() => {
        if (allCollapsed) {
            const next: Record<string, boolean> = {};
            groupMetaByKey.forEach((_meta, key) => {
                next[key] = true;
            });
            onExpandedGroupKeysChange(next);
        } else {
            onExpandedGroupKeysChange({});
        }
    }, [allCollapsed, groupMetaByKey, onExpandedGroupKeysChange]);

    return (
        <Box ref={viewContainerRef} style={styles.fullHeight}>
            {tableHeight !== 0 && (
                <GroupedTableView
                    table={table}
                    tableContainerRef={tableContainerRef}
                    leftPinnedColumns={leftPinnedColumns}
                    centerColumns={centerColumns}
                    virtualPaddingLeft={virtualPaddingLeft}
                    virtualPaddingRight={virtualPaddingRight}
                    virtualColumns={virtualColumns}
                    virtualRows={virtualRows}
                    rows={rows}
                    groupColSet={groupColSet}
                    lastGroupColId={lastGroupColId}
                    groupMetaByKey={groupMetaByKey}
                    side={side}
                    highlightedCell={highlightedCell}
                    annotatedCells={annotatedCells}
                    handleCellClick={handleCellClick}
                    handleContextMenu={handleContextMenu}
                    handleResizeEnd={columnVirtualizer.measure}
                    handleScroll={handleScroll}
                    allCollapsed={allCollapsed}
                    onToggleAllGroups={handleToggleAllGroups}
                    isLoading={isLoading}
                    settings={updatedSettings}
                    rowVirtualizer={rowVirtualizer}
                    headerPinningStyles={headerPinningStyles}
                    bodyPinningStyles={bodyPinningStyles}
                />
            )}
        </Box>
    );
};

export default GroupedCompareTable;
