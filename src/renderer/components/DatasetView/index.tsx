import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import { Box } from '@mui/material';
import {
    ITableData,
    ItemType,
    IMask,
    TableSettings,
    IUiControl,
} from 'interfaces/common';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setDatasetScrollPosition,
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
} from '@tanstack/react-table';

const emptySelect = { row: null, column: null };
const emptyGoTo = { row: null, column: null, cellSelection: false };

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

const styles = {
    fullHeight: {
        height: '100%',
    },
};

interface DatasetViewProps {
    tableData: ITableData;
    isLoading: boolean;
    handleContextMenu: (
        event: React.MouseEvent,
        rowIndex: number,
        columnIndex: number,
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
    const [sorting, setSorting] = useState<ISortingState>([]);

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
                header: settings.showLabel ? column.label : column.id,
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
                size: 60,
                enableResizing: false,
                meta: { type: 'integer' },
            });
        }
        return result;
    }, [tableData.header, settings]);

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
                    currentMask.columns.includes(columnId);
            }
        });

        return visibilityState;
    }, [currentMask, tableData.header]);

    const filteredColumns = useMemo<string[]>(() => {
        return tableData.header
            .filter((column) => column.isFiltered)
            .map((column) => column.id);
    }, [tableData.header]);

    // Height measurements
    const { tableHeight, viewContainerRef } = useTableHeight();

    // Initial rows;
    const { data } = tableData;
    const table = useReactTable({
        data: isLoading ? [] : data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
        columnResizeMode: 'onEnd',
        initialState: {
            columnPinning: {
                left: ['#'],
            },
        },
        state: {
            sorting,
            columnVisibility,
        },
        onSortingChange: setSorting,
    });

    const rows = useMemo(() => {
        if (isLoading === false && data.length > 0 && sorting !== undefined) {
            return table.getRowModel().rows;
        }
        return [];
    }, [table, data, isLoading, sorting]);

    const visibleColumns = table.getVisibleLeafColumns();

    const scrollPositionX = useAppSelector(
        (state) =>
            state.ui.control[tableData.fileId]?.scrollPosition.offsetX || 0,
    );
    const scrollPositionY = useAppSelector(
        (state) =>
            state.ui.control[tableData.fileId]?.scrollPosition.offsetY || 0,
    );

    // The virtualizers need to know the scrollable container element
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = containerRef || internalContainerRef;

    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length - 1, // Exclude the first column
        estimateSize: (index) => visibleColumns[index + 1].getSize(), // Adjust index
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

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => 38,
        getScrollElement: () => tableContainerRef.current,
        ...(settings.dynamicRowHeight && {
            measureElement: (element) =>
                element?.getBoundingClientRect().height,
        }),
        overscan: 15,
        initialOffset: scrollPositionY,
    });

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

    const [highlightedCells, setHighlightedCells] = useState<
        { row: number; column: number }[]
    >([]);
    const [selecting, setSelecting] = useState(false);
    const [startCell, setStartCell] = useState<{
        row: number;
        column: number;
    } | null>(null);

    const handleCellClick = useCallback(
        (rowIndex: number, columnIndex: number) => {
            // If user clicks on the row number, highlight the entire row
            if (columnIndex === 0) {
                const newHighlightedCells: { row: number; column: number }[] =
                    [];
                for (let column = 0; column < visibleColumns.length; column++) {
                    newHighlightedCells.push({ row: rowIndex, column });
                }
                setHighlightedCells(newHighlightedCells);
            } else {
                setHighlightedCells([{ row: rowIndex, column: columnIndex }]);
            }
        },
        [visibleColumns.length],
    );

    const handleColumnSelect = useCallback(
        (columnIndex: number) => {
            const newHighlightedCells: { row: number; column: number }[] = [];
            for (let row = 0; row < rows.length; row++) {
                newHighlightedCells.push({ row, column: columnIndex });
            }
            setHighlightedCells(newHighlightedCells);
        },
        [rows.length],
    );

    const handleMouseDown = (rowIndex: number, columnIndex: number) => {
        if (rowIndex === -1 && columnIndex === -1) {
            // If user clicks on the header row number, select the entire table
            const newHighlightedCells: { row: number; column: number }[] = [];
            for (let row = 0; row < rows.length; row++) {
                for (let column = 0; column < visibleColumns.length; column++) {
                    newHighlightedCells.push({ row, column });
                }
            }
            setHighlightedCells(newHighlightedCells);
            setSelecting(false);
            setStartCell(null);
            return;
        }
        // If user clicks on a cell, start selecting
        setSelecting(true);
        setStartCell({ row: rowIndex, column: columnIndex });
        setHighlightedCells([{ row: rowIndex, column: columnIndex }]);
    };

    const handleMouseOver = (rowIndex: number, columnIndex: number) => {
        if (selecting && startCell) {
            const newHighlightedCells: { row: number; column: number }[] = [];
            let startRow = Math.min(startCell.row, rowIndex);
            let endRow = Math.max(startCell.row, rowIndex);
            // If user hovers on the row number, highlight the entire row
            let startColumn;
            let endColumn;
            if (columnIndex === 0) {
                startColumn = 0;
                endColumn = visibleColumns.length - 1;
            } else if (rowIndex === 0) {
                startColumn = Math.min(startCell.column, columnIndex);
                endColumn = Math.max(startCell.column, columnIndex);
                startRow = 0;
                endRow = rows.length - 1;
            } else {
                startColumn = Math.min(startCell.column, columnIndex);
                endColumn = Math.max(startCell.column, columnIndex);
            }

            for (let row = startRow; row <= endRow; row++) {
                for (let column = startColumn; column <= endColumn; column++) {
                    newHighlightedCells.push({ row, column });
                }
            }
            setHighlightedCells(newHighlightedCells);
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

    const handleCopyToClipboard = useCallback(
        (withHeaders: boolean) => {
            if (highlightedCells.length > 0) {
                const rowIndices = [
                    ...new Set(highlightedCells.map((cell) => cell.row)),
                ];
                const columnIndices = [
                    ...new Set(highlightedCells.map((cell) => cell.column)),
                ];

                rowIndices.sort((a, b) => a - b);
                columnIndices.sort((a, b) => a - b);

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
                columnIndices.some((columnIndex) => {
                    if (visibleColumns[columnIndex] === undefined) {
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
                            return columnIndices
                                .map((columnIndex) => {
                                    const cell =
                                        row.getVisibleCells()[columnIndex];
                                    return cell.getValue();
                                })
                                .join('\t');
                        })
                        .join('\n');
                    // If withHeaders is true, add headers
                    if (withHeaders) {
                        const headerRow = visibleColumns
                            .filter((_, index) => columnIndices.includes(index))
                            .map((column) => column.id)
                            .join('\t');
                        selectedData = `${headerRow}\n${selectedData}`;
                    }
                } else if (settings.copyFormat === 'csv') {
                    selectedData = rowIndices
                        .map((rowIndex) => {
                            const row = rows[rowIndex];
                            return columnIndices
                                .map((columnIndex) => {
                                    const cell =
                                        row.getVisibleCells()[columnIndex];
                                    return `"${(cell.getValue() as string).toString().replace(/"/g, '""')}"`;
                                })
                                .join(',');
                        })
                        .join('\n');
                    // If withHeaders is true, add headers
                    if (withHeaders) {
                        const headerRow = visibleColumns
                            .filter((_, index) => columnIndices.includes(index))
                            .map(
                                (column) =>
                                    `"${column.id.replace(/"/g, '""')}"`,
                            )
                            .join(',');
                        selectedData = `${headerRow}\n${selectedData}`;
                    }
                } else if (settings.copyFormat === 'json') {
                    const selectedRows = rowIndices.map((rowIndex) => {
                        const row = rows[rowIndex];
                        const selectedColumns = columnIndices.map(
                            (columnIndex) => {
                                const cell = row.getVisibleCells()[columnIndex];
                                return {
                                    [visibleColumns[columnIndex].id]:
                                        cell.getValue(),
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
        [highlightedCells, rows, dispatch, settings.copyFormat, visibleColumns],
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
                setHighlightedCells([]);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [highlightedCells, handleCopyToClipboard, settings.copyWithHeaders]);

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
                handleCellClick(row, 0);
            } else if (goTo.column !== null && goTo.cellSelection) {
                // Highlight the cell
                const columnIndex =
                    tableData.header.findIndex(
                        (item) =>
                            item.id.toLowerCase() ===
                            goTo.column?.toLowerCase(),
                    ) + 1;
                if (columnIndex !== -1) {
                    handleCellClick(row, columnIndex);
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
        isLoading,
        tableHeight,
        onSetGoTo,
    ]);

    useEffect(() => {
        if (goTo.column !== null && goTo.row === null && tableHeight > 0) {
            // Add +1 as the first column is the row number
            const columnIndex =
                tableData.header.findIndex(
                    (item) =>
                        item.id.toLowerCase() === goTo.column?.toLowerCase(),
                ) + 1;
            if (columnIndex !== -1) {
                columnVirtualizer.scrollToIndex(columnIndex, {
                    align: 'center',
                });
            }
            onSetGoTo({ column: null });
            // Highlight the column
            if (!goTo.cellSelection) {
                handleColumnSelect(columnIndex);
            }
        }
    }, [
        goTo.column,
        goTo.row,
        goTo.cellSelection,
        tableData.header,
        tableData.fileId,
        columnVirtualizer,
        dispatch,
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
            let columnIndex = -1;
            if (select.column !== null) {
                // Add +1 as the first column is the row number
                columnIndex =
                    tableData.header.findIndex(
                        (item) =>
                            item.id.toLowerCase() ===
                            select.column?.toLowerCase(),
                    ) + 1;
            }

            if (select.row !== null && columnIndex !== -1) {
                // Cell selection
                const row = (select.row - 1) % settings.pageSize;
                handleCellClick(row, columnIndex);
            } else if (select.row !== null) {
                // Row selection
                const row = (select.row - 1) % settings.pageSize;
                handleCellClick(row, 0);
            } else if (columnIndex !== -1) {
                // Column selection
                handleColumnSelect(columnIndex);
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
        handleCellClick,
        handleColumnSelect,
        settings.pageSize,
        tableHeight,
        onSetSelect,
    ]);

    const updatedSettings = { ...settings, height: tableHeight };

    return (
        <Box ref={viewContainerRef} style={styles.fullHeight}>
            {/* If height is not measured yet, do not render */}
            {tableHeight !== 0 && (
                <View
                    table={table}
                    tableContainerRef={tableContainerRef}
                    visibleColumns={visibleColumns}
                    virtualPaddingLeft={virtualPaddingLeft}
                    virtualPaddingRight={virtualPaddingRight}
                    virtualColumns={virtualColumns}
                    virtualRows={virtualRows}
                    rows={rows}
                    highlightedCells={highlightedCells}
                    annotatedCells={annotatedCells}
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
                    onSortingChange={setSorting}
                    filteredColumns={filteredColumns}
                />
            )}
        </Box>
    );
};

export default DatasetView;
