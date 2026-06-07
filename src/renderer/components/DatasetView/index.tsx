import React, {
    Profiler,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import { Box } from '@mui/material';
import { Theme } from '@mui/material/styles';
import {
    ITableData,
    ItemType,
    IMask,
    TableSettings,
    IUiControl,
    TableRowValue,
} from 'interfaces/common';
import { useAppTheme } from 'renderer/utils/theme';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setDatasetScrollPosition,
    setDatasetSorting,
} from 'renderer/redux/slices/ui';
import View from 'renderer/components/DatasetView/View';
import useTableHeight from 'renderer/components/DatasetView/useTableHeight';
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState as ISortingState,
    RowData,
    VisibilityState,
    Column as IColumn,
} from '@tanstack/react-table';

const emptySelect = { row: null, column: null };
const emptyGoTo = { row: null, column: null, cellSelection: false };
const emptyArray: unknown[] = [];

declare module '@tanstack/table-core' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        type?: ItemType | 'rowNumber';
        align?: 'right' | 'left' | 'center' | 'justify';
        style?: React.CSSProperties;
    }
}

interface ITableRow {
    [key: string]: string | number | boolean | null;
}

type HighlightedCells = {
    [columnId: string]: number[];
};

type SelectionAnchor = {
    row: number | null;
    columnId: string | null;
};

type PinningStyle = (theme: Theme) => React.CSSProperties;

const styles = {
    fullHeight: {
        height: '100%',
    },
};

interface DatasetViewProps {
    tableData: ITableData;
    isLoading: boolean;
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    settings: TableSettings;
    currentPage?: number;
    currentMask?: IMask | null;
    annotatedCells?: Map<
        string,
        { text: string | React.ReactElement; color: string }
    > | null;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    goTo?: IUiControl['goTo'];
    onSetGoTo?: (goTo: Partial<IUiControl['goTo']>) => void;
    select?: IUiControl['select'];
    onSetSelect?: (select: Partial<IUiControl['select']>) => void;
}

const createPinningStyle = (
    column: IColumn<ITableRow, unknown>,
    backgroundColor: string,
    zIndex = 1,
): PinningStyle => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left');
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right');

    return (theme) => ({
        backgroundColor,
        boxShadow: isLastLeftPinnedColumn
            ? `-4px 0 4px -4px ${theme.vars?.palette.table.pinShadow} inset`
            : isFirstRightPinnedColumn
              ? `4px 0 4px -4px ${theme.vars?.palette.table.pinShadow} inset`
              : undefined,
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        opacity: isPinned ? 0.98 : 1,
        position: isPinned ? 'sticky' : 'relative',
        zIndex,
    });
};

const DatasetView: React.FC<DatasetViewProps> = ({
    tableData,
    isLoading,
    handleContextMenu,
    settings,
    currentPage = 0,
    currentMask = null,
    annotatedCells = null,
    containerRef = undefined,
    onScroll = undefined,
    goTo = emptyGoTo,
    onSetGoTo = () => {},
    select = emptySelect,
    onSetSelect = () => {},
}) => {
    const dispatch = useAppDispatch();
    const theme = useAppTheme();

    const reduxIdCols = useAppSelector(
        (state) =>
            state.ui.control[tableData.fileId]?.idCols ||
            (emptyArray as string[]),
    );

    const reduxShowLabels = useAppSelector(
        (state) => state.ui.control[tableData.fileId]?.showLabels,
    );

    const columns = useMemo<ColumnDef<ITableRow>[]>(() => {
        const result = tableData.header.map((column) => {
            const headerCell: {
                accessorKey: string;
                header: string;
                size?: number;
                enableResizing?: boolean;
                meta: {
                    type?: ItemType | 'rowNumber';
                    align?: 'right' | 'left' | 'center' | 'justify';
                    style?: React.CSSProperties;
                };
                cell?: ColumnDef<ITableRow>['cell'];
            } = {
                accessorKey: column.id,
                header:
                    (reduxShowLabels ?? settings.showLabels) && column.label
                        ? column.label
                        : column.id,
                size: column.size,
                enableResizing: true,
                meta: {
                    type: column.numericDatetimeType
                        ? 'datetime'
                        : column.type || 'string',
                },
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

            if (Object.keys(style).length > 0) {
                headerCell.meta.style = style;
            }

            if (column.cell) {
                headerCell.cell =
                    column.cell as unknown as ColumnDef<ITableRow>['cell'];
            }
            return headerCell;
        });
        // Add row number column if not present
        if (!result.find((col) => col.accessorKey === '#')) {
            result.unshift({
                accessorKey: '#',
                header: '#',
                size: theme.densitySettings.table.rowNumberWidth,
                enableResizing: false,
                meta: { type: 'integer' },
            });
        }
        return result;
    }, [
        tableData.header,
        settings,
        reduxShowLabels,
        theme.densitySettings.table.rowNumberWidth,
    ]);

    // Create column visibility state based on current mask
    const columnVisibility = useMemo<VisibilityState>(() => {
        if (!currentMask || !currentMask.columns.length) {
            // If no mask is applied, all columns are visible
            return {};
        }

        const visibilityState: VisibilityState = {};

        // Always make row number column visible
        visibilityState['#'] = true;

        // Make only masked columns visible
        tableData.header.forEach((header) => {
            const columnId = header.id;
            if (columnId !== '#') {
                visibilityState[columnId] =
                    currentMask.columns.includes(columnId) ||
                    reduxIdCols.includes(columnId);
            }
        });

        return visibilityState;
    }, [currentMask, reduxIdCols, tableData.header]);

    const filteredColumns = useMemo<string[]>(() => {
        return tableData.header
            .filter((column) => column.isFiltered)
            .map((column) => column.id);
    }, [tableData.header]);

    // Sorting
    const reduxSorting = useAppSelector(
        (state) => state.ui.control[tableData.fileId]?.sorting ?? null,
    );

    const [localSorting, setLocalSorting] = useState<ISortingState>([]);
    const sorting = reduxSorting !== null ? reduxSorting : localSorting;

    const pinnedLeftColumnIds = useMemo(() => {
        const availableColumns = new Set(
            tableData.header.map((column) => column.id),
        );
        const pinnedColumns = settings.hideRowNumbers ? [] : ['#'];

        reduxIdCols.forEach((columnId) => {
            if (
                availableColumns.has(columnId) &&
                !pinnedColumns.includes(columnId)
            ) {
                pinnedColumns.push(columnId);
            }
        });

        return pinnedColumns;
    }, [reduxIdCols, settings.hideRowNumbers, tableData.header]);

    const handleSetSorting = (
        updatedSorting:
            | ISortingState
            | ((oldSorting: ISortingState) => ISortingState),
    ) => {
        if (reduxSorting === null) {
            setLocalSorting(updatedSorting);
        } else {
            if (typeof updatedSorting === 'function') {
                return;
            }

            dispatch(
                setDatasetSorting({
                    fileId: tableData.fileId,
                    sorting: updatedSorting,
                }),
            );
        }
    };

    // Height measurements
    const { tableHeight, viewContainerRef } = useTableHeight();

    // Initial rows;
    const { data } = tableData;
    const table = useReactTable({
        data: isLoading ? [] : data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: settings.enableProfiler,
        columnResizeMode: 'onEnd',
        state: {
            sorting,
            columnVisibility,
            columnPinning: {
                left: pinnedLeftColumnIds,
            },
        },
        onSortingChange: handleSetSorting,
    });

    const rows = useMemo(() => {
        if (isLoading === false && data.length > 0 && sorting !== undefined) {
            return table.getRowModel().rows;
        }
        return [];
    }, [table, data, isLoading, sorting]);

    const visibleColumns = table.getVisibleLeafColumns();
    const visibleColumnIds = useMemo(
        () => visibleColumns.map((column) => column.id),
        [visibleColumns],
    );
    const leftPinnedColumns = table
        .getLeftVisibleLeafColumns()
        .filter((column) => !settings.hideRowNumbers || column.id !== '#');
    const centerColumns = table.getCenterVisibleLeafColumns();
    const pinningLayoutKey = visibleColumns
        .map(
            (column) =>
                `${column.id}:${column.getIsPinned()}:${column.getStart('left')}:${column.getAfter('right')}:${column.getSize()}:${column.getIsLastColumn('left')}:${column.getIsFirstColumn('right')}`,
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

    const scrollPositionX = useAppSelector(
        (state) =>
            state.ui.control[tableData.fileId]?.scrollPosition?.offsetX ?? 0,
    );
    const scrollPositionY = useAppSelector(
        (state) =>
            state.ui.control[tableData.fileId]?.scrollPosition?.offsetY ?? 0,
    );

    // The virtualizers need to know the scrollable container element
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = containerRef || internalContainerRef;

    const columnVirtualizer = useVirtualizer({
        count: centerColumns.length,
        estimateSize: (index) => centerColumns[index].getSize(),
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 4,
        initialOffset: scrollPositionX,
    });

    // If filter is used, we need to remeasure the columns
    useEffect(() => {
        if (data) {
            columnVirtualizer.measure();
        }
    }, [data, columnVirtualizer]); // Remove columnVirtualizer from dependencies

    // Add this ref to track if the scroll is restored
    const hasRestoredScrollRef = useRef(false);

    // Add effect to restore scroll position once
    useEffect(() => {
        if (
            !hasRestoredScrollRef.current &&
            tableContainerRef.current &&
            scrollPositionX > 0 &&
            tableHeight > 0
        ) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (tableContainerRef.current) {
                    tableContainerRef.current.scrollLeft = scrollPositionX;
                    hasRestoredScrollRef.current = true;
                }
            });
        }
    }, [scrollPositionX, tableHeight, tableContainerRef]);

    // Reset the flag when fileId changes
    useEffect(() => {
        hasRestoredScrollRef.current = false;
    }, [tableData.fileId]);

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
        initialOffset: scrollPositionY,
    });

    useEffect(() => {
        rowVirtualizer.measure();
    }, [estimatedRowHeight, settings.dynamicRowHeight, rowVirtualizer]);

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

    // Filter annotated cells to only include visible rows
    const filteredAnnotatedCells = useMemo(() => {
        if (!annotatedCells) {
            return null;
        }
        const newMap = new Map<
            string,
            { text: string | React.ReactElement; color: string }
        >();
        annotatedCells.forEach((value, key) => {
            const [rowIndexStr] = key.split('#');
            const rowIndex = parseInt(rowIndexStr, 10);
            if (
                rowIndex >= currentPage * settings.pageSize &&
                rowIndex < (currentPage + 1) * settings.pageSize
            ) {
                const newRowIndex = rowIndex - currentPage * settings.pageSize;
                const newKey = key.replace(rowIndexStr, newRowIndex.toString());
                newMap.set(newKey, value);
            }
        });
        return newMap;
    }, [annotatedCells, currentPage, settings.pageSize]);

    const [highlightedCells, setHighlightedCells] = useState<HighlightedCells>(
        {},
    );
    const [selecting, setSelecting] = useState(false);
    const [startCell, setStartCell] = useState<SelectionAnchor | null>(null);

    const allRowIndices = useMemo(
        () => Array.from({ length: rows.length }, (_unused, row) => row),
        [rows.length],
    );

    const buildSelection = useCallback(
        (rowsToSelect: number[], columnIdsToSelect: string[]) => {
            const selection: HighlightedCells = {};

            columnIdsToSelect.forEach((columnId) => {
                selection[columnId] = [...rowsToSelect];
            });

            return selection;
        },
        [],
    );

    const getColumnSelectionRange = useCallback(
        (startColumnId: string, endColumnId: string) => {
            const leftColumnIds = leftPinnedColumns.map((column) => column.id);
            const centerColumnIds = centerColumns.map((column) => column.id);
            const startLeftIndex = leftColumnIds.indexOf(startColumnId);
            const endLeftIndex = leftColumnIds.indexOf(endColumnId);
            const startCenterIndex = centerColumnIds.indexOf(startColumnId);
            const endCenterIndex = centerColumnIds.indexOf(endColumnId);

            if (startLeftIndex !== -1 && endLeftIndex !== -1) {
                return leftColumnIds.slice(
                    Math.min(startLeftIndex, endLeftIndex),
                    Math.max(startLeftIndex, endLeftIndex) + 1,
                );
            }

            if (startCenterIndex !== -1 && endCenterIndex !== -1) {
                return centerColumnIds.slice(
                    Math.min(startCenterIndex, endCenterIndex),
                    Math.max(startCenterIndex, endCenterIndex) + 1,
                );
            }

            if (startLeftIndex !== -1 && endCenterIndex !== -1) {
                return [
                    ...leftColumnIds.slice(startLeftIndex),
                    ...centerColumnIds.slice(0, endCenterIndex + 1),
                ];
            }

            if (startCenterIndex !== -1 && endLeftIndex !== -1) {
                return [
                    ...leftColumnIds.slice(endLeftIndex),
                    ...centerColumnIds.slice(0, startCenterIndex + 1),
                ];
            }

            return [];
        },
        [centerColumns, leftPinnedColumns],
    );

    const getColumnIdByName = useCallback(
        (columnName: string) => {
            const matchingHeader = tableData.header.find(
                (item) => item.id.toLowerCase() === columnName.toLowerCase(),
            );

            return matchingHeader?.id || null;
        },
        [tableData.header],
    );

    const handleCellClick = useCallback(
        (rowIndex: number, columnId: string) => {
            // If user clicks on the row number, highlight the entire row
            if (columnId === '#') {
                setHighlightedCells(
                    buildSelection([rowIndex], visibleColumnIds),
                );
            } else {
                setHighlightedCells(buildSelection([rowIndex], [columnId]));
            }
        },
        [buildSelection, visibleColumnIds],
    );

    const handleColumnSelect = useCallback(
        (columnId: string) => {
            setHighlightedCells(buildSelection(allRowIndices, [columnId]));
        },
        [allRowIndices, buildSelection],
    );

    const handleMouseDown = (
        rowIndex: number | null,
        columnId: string | null,
    ) => {
        if (rowIndex === null && columnId === null) {
            // If user clicks on the header row number, select the entire table
            setHighlightedCells(
                buildSelection(allRowIndices, visibleColumnIds),
            );
            setSelecting(false);
            setStartCell(null);
            return;
        }
        // If user clicks on a cell, start selecting
        setSelecting(true);
        setStartCell({ row: rowIndex, columnId });

        if (rowIndex === null && columnId !== null) {
            handleColumnSelect(columnId);
            return;
        }

        if (rowIndex !== null && columnId !== null) {
            setHighlightedCells(buildSelection([rowIndex], [columnId]));
        }
    };

    const handleMouseOver = (
        rowIndex: number | null,
        columnId: string | null,
    ) => {
        if (selecting && startCell) {
            if (startCell.row === null && startCell.columnId !== null) {
                if (!columnId) {
                    return;
                }

                const selectedColumnIds = getColumnSelectionRange(
                    startCell.columnId,
                    columnId,
                );

                if (selectedColumnIds.length === 0) {
                    return;
                }

                setHighlightedCells(
                    buildSelection(allRowIndices, selectedColumnIds),
                );
                return;
            }

            if (
                startCell.row !== null &&
                startCell.columnId !== null &&
                rowIndex !== null &&
                columnId !== null
            ) {
                const startRow = Math.min(startCell.row, rowIndex);
                const endRow = Math.max(startCell.row, rowIndex);
                const rowsToSelect = Array.from(
                    { length: endRow - startRow + 1 },
                    (_unused, index) => startRow + index,
                );

                if (startCell.columnId === '#' || columnId === '#') {
                    setHighlightedCells(
                        buildSelection(rowsToSelect, visibleColumnIds),
                    );
                    return;
                }

                const selectedColumnIds = getColumnSelectionRange(
                    startCell.columnId,
                    columnId,
                );

                if (selectedColumnIds.length === 0) {
                    return;
                }

                setHighlightedCells(
                    buildSelection(rowsToSelect, selectedColumnIds),
                );
            }
        }
    };

    const handleMouseUp = () => {
        setSelecting(false);
        setStartCell(null);
    };

    // Keep scrolling position when unmounting
    const scrollPosRef = useRef<{ offsetY: number; offsetX: number }>({
        offsetY: 0,
        offsetX: 0,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        scrollPosRef.current = {
            offsetY: e.currentTarget.scrollTop,
            offsetX: e.currentTarget.scrollLeft,
        };
        if (onScroll) {
            onScroll(e);
        }
    };

    useEffect(() => {
        return () => {
            dispatch(
                setDatasetScrollPosition({
                    fileId: tableData.fileId,
                    offsetY: scrollPosRef.current.offsetY,
                    offsetX: scrollPosRef.current.offsetX,
                }),
            );
        };
    }, [dispatch, tableData.fileId]);

    // When reloading dataset, save the scroll position and reset it after data is loaded
    const reloadRequested = useAppSelector((state) => state.ui.reloadRequested);
    useEffect(() => {
        if (reloadRequested) {
            dispatch(
                setDatasetScrollPosition({
                    fileId: tableData.fileId,
                    offsetY: scrollPosRef.current.offsetY,
                    offsetX: scrollPosRef.current.offsetX,
                }),
            );
        } else if (tableContainerRef?.current) {
            requestAnimationFrame(() => {
                tableContainerRef.current!.scrollTop = scrollPositionY;
                hasRestoredScrollRef.current = true;
            });
        }
    }, [
        dispatch,
        reloadRequested,
        tableData.fileId,
        scrollPosRef,
        tableContainerRef,
        scrollPositionY,
    ]);

    const handleCopyToClipboard = useCallback(
        (withHeaders: boolean) => {
            const leftColumnIds = leftPinnedColumns.map((column) => column.id);
            const centerColumnIds = centerColumns.map((column) => column.id);
            const allColumnIds = [...leftColumnIds, ...centerColumnIds].filter(
                (columnId) => visibleColumnIds.includes(columnId),
            );
            const selectedColumnIds = allColumnIds.filter(
                (columnId) => (highlightedCells[columnId]?.length ?? 0) > 0,
            );

            if (selectedColumnIds.length > 0) {
                const rowIndexSet = new Set<number>();
                selectedColumnIds.forEach((columnId) => {
                    highlightedCells[columnId]?.forEach((rowIndex) => {
                        rowIndexSet.add(rowIndex);
                    });
                });

                const rowIndices = [...rowIndexSet];

                rowIndices.sort((a, b) => a - b);

                // Check if row or column indeces exists
                let invalidIndeces = false;
                rowIndices.some((rowIndex) => {
                    if (rows[rowIndex] === undefined) {
                        // Row index is out of bounds
                        invalidIndeces = true;
                        return true;
                    }
                    return false;
                });
                selectedColumnIds.some((columnId) => {
                    if (!visibleColumnIds.includes(columnId)) {
                        // Column index is out of bounds
                        invalidIndeces = true;
                        return true;
                    }
                    return false;
                });

                // If any index is invalid, do not proceed
                if (invalidIndeces) {
                    return;
                }

                let selectedData = '';
                if (settings.copyFormat === 'tab') {
                    selectedData = rowIndices
                        .map((rowIndex) => {
                            const row = rows[rowIndex];
                            const rowCellMap = new Map(
                                row
                                    .getVisibleCells()
                                    .map((cell) => [cell.column.id, cell]),
                            );

                            return selectedColumnIds
                                .map((columnId) => {
                                    const cell = rowCellMap.get(columnId);
                                    return cell?.getValue() ?? '';
                                })
                                .join('\t');
                        })
                        .join('\n');
                    // If withHeaders is true, add headers
                    if (withHeaders) {
                        const headerRow = selectedColumnIds.join('\t');
                        selectedData = `${headerRow}\n${selectedData}`;
                    }
                } else if (settings.copyFormat === 'csv') {
                    selectedData = rowIndices
                        .map((rowIndex) => {
                            const row = rows[rowIndex];
                            const rowCellMap = new Map(
                                row
                                    .getVisibleCells()
                                    .map((cell) => [cell.column.id, cell]),
                            );

                            return selectedColumnIds
                                .map((columnId) => {
                                    const cell = rowCellMap.get(columnId);
                                    return `"${(cell?.getValue() as string | number | boolean | null)?.toString().replace(/"/g, '""') ?? ''}"`;
                                })
                                .join(',');
                        })
                        .join('\n');
                    // If withHeaders is true, add headers
                    if (withHeaders) {
                        const headerRow = selectedColumnIds
                            .map(
                                (columnId) =>
                                    `"${columnId.replace(/"/g, '""')}"`,
                            )
                            .join(',');
                        selectedData = `${headerRow}\n${selectedData}`;
                    }
                } else if (settings.copyFormat === 'json') {
                    const selectedRows = rowIndices.map((rowIndex) => {
                        const row = rows[rowIndex];
                        const rowCellMap = new Map(
                            row
                                .getVisibleCells()
                                .map((cell) => [cell.column.id, cell]),
                        );

                        const selectedColumns = selectedColumnIds.map(
                            (columnId) => {
                                const cell = rowCellMap.get(columnId);
                                return {
                                    [columnId]: cell?.getValue() ?? null,
                                };
                            },
                        );
                        return selectedColumns.reduce((acc, curr) => {
                            return { ...acc, ...curr };
                        }, {});
                    });
                    selectedData = JSON.stringify(selectedRows, null, 2);
                }

                window.electron.writeToClipboard(selectedData);
                dispatch(
                    openSnackbar({
                        message: `Copied to clipboard ${withHeaders ? 'with headers' : ''}`,
                        type: 'success',
                        props: { duration: 1000 },
                    }),
                );
            }
        },
        [
            dispatch,
            highlightedCells,
            leftPinnedColumns,
            centerColumns,
            rows,
            settings.copyFormat,
            visibleColumnIds,
        ],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.altKey && event.key === 'c') {
                // Ctrl + Alt + C to copy selected cells to clipboard
                handleCopyToClipboard(!settings.copyWithHeaders);
            } else if (event.ctrlKey && event.key === 'c') {
                // Ctrl + C to copy selected cells to clipboard
                handleCopyToClipboard(settings.copyWithHeaders);
            } else if (event.key === 'Escape') {
                // Escape to clear selection
                setHighlightedCells({});
            } else if (event.ctrlKey) {
                switch (event.key) {
                    case 'ArrowUp':
                        if (rows.length > 0) {
                            rowVirtualizer.scrollToIndex(0);
                        }
                        break;
                    case 'ArrowDown':
                        if (rows.length > 0) {
                            rowVirtualizer.scrollToIndex(rows.length - 1);
                        }
                        break;
                    case 'ArrowLeft':
                        columnVirtualizer.scrollToIndex(0);
                        break;
                    case 'ArrowRight':
                        if (visibleColumns.length > 1) {
                            columnVirtualizer.scrollToIndex(
                                visibleColumns.length - 2,
                            );
                        }
                        break;
                    default:
                        break;
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        handleCopyToClipboard,
        settings.copyWithHeaders,
        rowVirtualizer,
        columnVirtualizer,
        rows.length,
        visibleColumns.length,
    ]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        // Scroll to the row if it is on the current page, otherwise change will be changed and scroll will not be visible
        if (
            goTo.row !== null &&
            currentPage ===
                Math.floor(Math.max(goTo.row - 1, 0) / settings.pageSize) &&
            isLoading === false &&
            tableHeight > 0
        ) {
            const row = (goTo.row - 1) % settings.pageSize;
            rowVirtualizer.scrollToIndex(row, { align: 'center' });
            onSetGoTo({ row: null });
            // Highlight the row number
            if (!goTo.cellSelection) {
                handleCellClick(row, '#');
            } else if (goTo.column !== null && goTo.cellSelection) {
                // Highlight the cell
                const columnId = getColumnIdByName(goTo.column);
                if (columnId !== null) {
                    handleCellClick(row, columnId);
                }
            }
        }
    }, [
        goTo.row,
        goTo.column,
        goTo.cellSelection,
        rowVirtualizer,
        dispatch,
        tableData.header,
        tableData.fileId,
        settings.pageSize,
        currentPage,
        handleCellClick,
        getColumnIdByName,
        isLoading,
        tableHeight,
        onSetGoTo,
    ]);

    useEffect(() => {
        if (goTo.column !== null && goTo.row === null && tableHeight > 0) {
            const columnId = getColumnIdByName(goTo.column);
            const centerColumnIndex = centerColumns.findIndex(
                (column) => column.id === columnId,
            );

            if (centerColumnIndex !== -1) {
                columnVirtualizer.scrollToIndex(centerColumnIndex, {
                    align: 'center',
                });
            }
            onSetGoTo({ column: null });
            // Highlight the column
            if (!goTo.cellSelection && columnId !== null) {
                handleColumnSelect(columnId);
            }
        }
    }, [
        centerColumns,
        goTo.column,
        goTo.row,
        goTo.cellSelection,
        tableData.header,
        tableData.fileId,
        columnVirtualizer,
        dispatch,
        getColumnIdByName,
        handleColumnSelect,
        tableHeight,
        onSetGoTo,
    ]);

    // Select control
    useEffect(() => {
        if (
            select.row !== null ||
            (select.column !== null && tableHeight > 0)
        ) {
            let columnId: string | null = null;
            if (select.column !== null) {
                columnId = getColumnIdByName(select.column);
            }

            if (select.row !== null && columnId !== null) {
                // Cell selection
                const row = (select.row - 1) % settings.pageSize;
                handleCellClick(row, columnId);
            } else if (select.row !== null) {
                // Row selection
                const row = (select.row - 1) % settings.pageSize;
                handleCellClick(row, '#');
            } else if (columnId !== null) {
                // Column selection
                handleColumnSelect(columnId);
            }
            // Clean select control
            onSetSelect({
                row: null,
                column: null,
            });
        }
    }, [
        select,
        tableData.header,
        tableData.fileId,
        dispatch,
        getColumnIdByName,
        handleCellClick,
        handleColumnSelect,
        settings.pageSize,
        tableHeight,
        onSetSelect,
    ]);

    const updatedSettings = {
        ...settings,
        height: tableHeight,
    };

    const handleProfileRender = useCallback(
        (
            id: string,
            phase: 'mount' | 'update' | 'nested-update',
            actualDuration: number,
            baseDuration: number,
            startTime: number,
            commitTime: number,
        ) => {
            if (!settings.enableProfiler) {
                return;
            }

            // eslint-disable-next-line no-console
            console.debug(`[${id}] ${phase}`, {
                actualDurationMs: Number(actualDuration.toFixed(2)),
                baseDurationMs: Number(baseDuration.toFixed(2)),
                commitDurationMs: Number((commitTime - startTime).toFixed(2)),
                rows: rows.length,
                visibleColumns: visibleColumns.length,
                pinnedColumns: leftPinnedColumns.length,
                fileId: tableData.fileId,
            });
        },
        [
            leftPinnedColumns.length,
            rows.length,
            tableData.fileId,
            visibleColumns.length,
            settings.enableProfiler,
        ],
    );

    const renderedView = (
        <View
            table={table}
            tableContainerRef={tableContainerRef}
            visibleColumns={visibleColumns}
            leftPinnedColumns={leftPinnedColumns}
            centerColumns={centerColumns}
            virtualPaddingLeft={virtualPaddingLeft}
            virtualPaddingRight={virtualPaddingRight}
            virtualColumns={virtualColumns}
            virtualRows={virtualRows}
            rows={rows}
            highlightedCells={highlightedCells}
            annotatedCells={filteredAnnotatedCells}
            handleCellClick={handleCellClick}
            handleMouseDown={handleMouseDown}
            handleMouseOver={handleMouseOver}
            handleContextMenu={handleContextMenu}
            handleResizeEnd={columnVirtualizer.measure}
            handleScroll={handleScroll}
            isLoading={isLoading}
            settings={updatedSettings}
            rowVirtualizer={rowVirtualizer}
            sorting={sorting}
            onSortingChange={handleSetSorting}
            filteredColumns={filteredColumns}
            headerPinningStyles={headerPinningStyles}
            bodyPinningStyles={bodyPinningStyles}
        />
    );

    return (
        <Box ref={viewContainerRef} style={styles.fullHeight}>
            {/* If height is not measured yet, do not render */}
            {tableHeight !== 0 &&
                (settings.enableProfiler ? (
                    <Profiler id="DatasetView" onRender={handleProfileRender}>
                        {renderedView}
                    </Profiler>
                ) : (
                    renderedView
                ))}
        </Box>
    );
};

export default DatasetView;
