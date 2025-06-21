import React, { useState, useCallback, useEffect } from 'react';
import { ITableRow } from 'interfaces/common';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    Table as ITable,
    Column as IColumn,
    Row as IRow,
    SortingState as ISortingState,
    Updater as IUpdater,
} from '@tanstack/react-table';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { openSnackbar } from 'renderer/redux/slices/ui';
import View from 'renderer/components/DatasetView/View';

interface ViewWithSelectionProps {
    table: ITable<ITableRow>;
    tableContainerRef: React.RefObject<HTMLDivElement>;
    visibleColumns: IColumn<ITableRow, unknown>[];
    virtualPaddingLeft: number | undefined;
    virtualPaddingRight: number | undefined;
    virtualColumns: VirtualItem[];
    virtualRows: VirtualItem[];
    rows: IRow<ITableRow>[];
    isLoading: boolean;
    dynamicRowHeight: boolean;
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
    sorting: ISortingState;
    onSortingChange: (updater: IUpdater<ISortingState>) => void;
    hasPagination: boolean;
    handleContextMenu?: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        rowIndex: number,
        columnIndex: number,
    ) => void;
    filteredColumns?: string[];
    containerStyle?: { [name: string]: string | number };
    hideRowNumbers?: boolean;
    handleResizeEnd?: () => void;
}

const ViewWithSelection: React.FC<ViewWithSelectionProps> = ({
    table,
    tableContainerRef,
    visibleColumns,
    virtualPaddingLeft,
    virtualPaddingRight,
    virtualColumns,
    virtualRows,
    rows,
    isLoading,
    dynamicRowHeight,
    rowVirtualizer,
    sorting,
    onSortingChange,
    hasPagination,
    handleContextMenu = (_event, _rowIndex, _columnIndex) => {},
    filteredColumns = [],
    containerStyle = undefined,
    hideRowNumbers = false,
    handleResizeEnd = () => {},
}) => {
    const dispatch = useAppDispatch();
    const settings = useAppSelector((state) => state.settings.viewer);

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
            handleContextMenu={handleContextMenu}
            isLoading={isLoading}
            dynamicRowHeight={dynamicRowHeight}
            rowVirtualizer={rowVirtualizer}
            sorting={sorting}
            onSortingChange={onSortingChange}
            hasPagination={hasPagination}
            filteredColumns={filteredColumns}
            containerStyle={containerStyle}
            hideRowNumbers={hideRowNumbers}
            handleResizeEnd={handleResizeEnd}
        />
    );
};

export default ViewWithSelection;
