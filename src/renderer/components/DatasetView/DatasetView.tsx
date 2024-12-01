
import React from 'react';
import { ITableData, ITableRow } from 'interfaces/common';
import { useReactTable, ColumnDef, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';

const useDatasetView = (tableData: ITableData) => {
    const dispatch = useAppDispatch();

    const columns = React.useMemo<ColumnDef<ITableRow>[]>(
        () =>
            tableData.header.map((column) => ({
                accessorKey: column.id,
                header: column.id,
                size: 120,
            })),
        [tableData.header],
    );

    const [data, _setData] = React.useState(() =>
        tableData.data.map((row) => {
            const newRow: ITableRow = {};
            row.forEach((cell, index) => {
                newRow[tableData.header[index].id] = cell;
            });
            return newRow;
        }),
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
    });

    const { rows } = table.getRowModel();
    const visibleColumns = table.getVisibleLeafColumns();
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length,
        estimateSize: (index) => visibleColumns[index].getSize(),
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3,
    });

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => 33,
        getScrollElement: () => tableContainerRef.current,
        measureElement: (element) => element?.getBoundingClientRect().height,
        overscan: 15,
    });

    const virtualColumns = columnVirtualizer.getVirtualItems();
    const virtualRows = rowVirtualizer.getVirtualItems();

    let virtualPaddingLeft: number | undefined;
    let virtualPaddingRight: number | undefined;

    if (columnVirtualizer && virtualColumns?.length) {
        virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
        virtualPaddingRight = columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
    }

    const [highlightedCells, setHighlightedCells] = React.useState<{ row: number; column: number }[]>([]);
    const [selecting, setSelecting] = React.useState(false);
    const [startCell, setStartCell] = React.useState<{ row: number; column: number } | null>(null);

    const handleCellClick = (rowIndex: number, columnIndex: number) => {
        setHighlightedCells([{ row: rowIndex, column: columnIndex }]);
    };

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
            const startColumn = Math.min(startCell.column, columnIndex);
            const endColumn = Math.max(startCell.column, columnIndex);

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

    const handleCopyToClipboard = () => {
        if (highlightedCells.length > 0) {
            const rowIndices = [...new Set(highlightedCells.map(cell => cell.row))];
            const columnIndices = [...new Set(highlightedCells.map(cell => cell.column))];

            rowIndices.sort((a, b) => a - b);
            columnIndices.sort((a, b) => a - b);

            const selectedData = rowIndices.map(rowIndex => {
                const row = rows[rowIndex];
                return columnIndices.map(columnIndex => {
                    const cell = row.getVisibleCells()[columnIndex];
                    return cell.getValue();
                }).join('\t');
            }).join('\n');

            window.electron.writeToClipboard(selectedData);
            dispatch(openSnackbar({
                message: 'Copied to clipboard',
                type: 'success',
                props: { duration: 1000 },
            }));
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'c') {
                handleCopyToClipboard();
            } else if (event.key === 'Escape') {
                setHighlightedCells([]);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [highlightedCells]);

    React.useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return {
        table,
        tableContainerRef,
        virtualColumns,
        virtualRows,
        virtualPaddingLeft,
        virtualPaddingRight,
        highlightedCells,
        handleCellClick,
        handleMouseDown,
        handleMouseOver,
        rowVirtualizer,
    };
};

export default useDatasetView;
