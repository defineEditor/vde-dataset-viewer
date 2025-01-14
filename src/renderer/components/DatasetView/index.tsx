import React, {
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import { ITableData } from 'interfaces/common';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openSnackbar, setGoTo } from 'renderer/redux/slices/ui';
import View from 'renderer/components/DatasetView/View';
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState as ISortingState,
} from '@tanstack/react-table';

interface ITableRow {
    [key: string]: string | number | boolean | null;
}

const DatasetView: React.FC<{ tableData: ITableData; isLoading: boolean }> = ({
    tableData,
    isLoading,
}: {
    tableData: ITableData;
    isLoading: boolean;
}) => {
    const dispatch = useAppDispatch();
    const settings = useAppSelector((state) => state.settings.viewer);
    const currentPage = useAppSelector((state) => state.ui.currentPage);
    const [sorting, setSorting] = useState<ISortingState>([]);

    const columns = useMemo<ColumnDef<ITableRow>[]>(() => {
        const result = tableData.header.map((column) => {
            return {
                accessorKey: column.id,
                header: column.id,
                size: column.size,
                enableResizing: true,
            };
        });
        // Add row number column
        result.unshift({
            accessorKey: '#',
            header: '#',
            size: 60,
            enableResizing: false,
        });
        return result;
    }, [tableData.header]);

    // Inital rows;
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

    // The virtualizers need to know the scrollable container element
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length - 1, // Exclude the first column
        estimateSize: (index) => visibleColumns[index + 1].getSize(), // Adjust index
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3,
    });

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => 38,
        getScrollElement: () => tableContainerRef.current,
        ...(settings.dynamicRowHeight && {
            measureElement: (element) =>
                element?.getBoundingClientRect().height,
        }),
        overscan: 15,
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
        setSelecting(true);
        setStartCell({ row: rowIndex, column: columnIndex });
        setHighlightedCells([{ row: rowIndex, column: columnIndex }]);
    };

    const handleMouseOver = (rowIndex: number, columnIndex: number) => {
        if (selecting && startCell) {
            const newHighlightedCells: { row: number; column: number }[] = [];
            const startRow = Math.min(startCell.row, rowIndex);
            const endRow = Math.max(startCell.row, rowIndex);
            // If user hovers on the row number, highlight the entire row
            let startColumn;
            let endColumn;
            if (columnIndex === 0) {
                startColumn = 0;
                endColumn = visibleColumns.length - 1;
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

    const handleCopyToClipboard = useCallback(() => {
        if (highlightedCells.length > 0) {
            const rowIndices = [
                ...new Set(highlightedCells.map((cell) => cell.row)),
            ];
            const columnIndices = [
                ...new Set(highlightedCells.map((cell) => cell.column)),
            ];

            rowIndices.sort((a, b) => a - b);
            columnIndices.sort((a, b) => a - b);

            let selectedData = '';
            if (settings.copyFormat === 'tab') {
                selectedData = rowIndices
                    .map((rowIndex) => {
                        const row = rows[rowIndex];
                        return columnIndices
                            .map((columnIndex) => {
                                const cell = row.getVisibleCells()[columnIndex];
                                return cell.getValue();
                            })
                            .join('\t');
                    })
                    .join('\n');
            } else if (settings.copyFormat === 'csv') {
                selectedData = rowIndices
                    .map((rowIndex) => {
                        const row = rows[rowIndex];
                        return columnIndices
                            .map((columnIndex) => {
                                const cell = row.getVisibleCells()[columnIndex];
                                return `"${(cell.getValue() as string).toString().replace(/"/g, '""')}"`;
                            })
                            .join(',');
                    })
                    .join('\n');
            } else if (settings.copyFormat === 'json') {
                const selectedRows = rowIndices.map((rowIndex) => {
                    const row = rows[rowIndex];
                    const selectedColumns = columnIndices.map((columnIndex) => {
                        const cell = row.getVisibleCells()[columnIndex];
                        return {
                            [visibleColumns[columnIndex].id]: cell.getValue(),
                        };
                    });
                    return selectedColumns.reduce((acc, curr) => {
                        return { ...acc, ...curr };
                    }, {});
                });
                selectedData = JSON.stringify(selectedRows, null, 2);
            }

            window.electron.writeToClipboard(selectedData);
            dispatch(
                openSnackbar({
                    message: 'Copied to clipboard',
                    type: 'success',
                    props: { duration: 1000 },
                }),
            );
        }
    }, [highlightedCells, rows, dispatch, settings.copyFormat, visibleColumns]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'c') {
                // Ctrl + C to copy selected cells to clipboard
                handleCopyToClipboard();
            } else if (event.key === 'Escape') {
                // Escape to clear selection
                setHighlightedCells([]);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [highlightedCells, handleCopyToClipboard]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // GoTo control
    const goTo = useAppSelector((state) => state.ui.control.goTo);

    useEffect(() => {
        // Scroll to the row if it is on the current page, otherwise change will be changed and scroll will not be visible
        if (
            goTo.row !== null &&
            currentPage ===
                Math.floor(Math.max(goTo.row - 1, 0) / settings.pageSize) &&
            isLoading === false
        ) {
            const row = (goTo.row - 1) % settings.pageSize;
            rowVirtualizer.scrollToIndex(row, { align: 'center' });
            dispatch(setGoTo({ row: null }));
            // Highlight the row number
            handleCellClick(row, 0);
        }
    }, [
        goTo.row,
        rowVirtualizer,
        dispatch,
        settings.pageSize,
        currentPage,
        handleCellClick,
        isLoading,
    ]);

    useEffect(() => {
        if (goTo.column !== null) {
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
            dispatch(setGoTo({ column: null }));
            // Highlight the column
            handleColumnSelect(columnIndex);
        }
    }, [
        goTo.column,
        tableData.header,
        columnVirtualizer,
        dispatch,
        handleColumnSelect,
    ]);

    return (
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
            handleCellClick={handleCellClick}
            handleMouseDown={handleMouseDown}
            handleMouseOver={handleMouseOver}
            isLoading={isLoading}
            dynamicRowHeight={settings.dynamicRowHeight}
            rowVirtualizer={rowVirtualizer}
            sorting={sorting}
            onSortingChange={setSorting}
            hasPagination={tableData?.metadata?.records > settings.pageSize}
        />
    );
};

export default DatasetView;
