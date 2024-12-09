/* eslint-disable prettier/prettier */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ITableData } from 'interfaces/common';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Paper,
    Box,
} from '@mui/material';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    Row,
    useReactTable,
} from '@tanstack/react-table';
import Loading from 'renderer/components/Loading';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openSnackbar, setGoTo } from 'renderer/redux/slices/ui';

interface ITableRow {
    [key: string]: string | number | boolean | null;
}

const styles = {
    header: {
        backgroundColor: '#f4f4f4',
        display: 'grid',
        position: 'sticky',
        top: 0,
        zIndex: 1,
    },
    headerColumn: {
        display: 'flex',
        width: '100%',
    },
    container: {
        overflow: 'auto',
        position: 'relative',
        height: '91vh',
        userSelect: 'none',
    },
    table: {
        display: 'grid',
    },
    tbody: {
        display: 'grid',
        position: 'relative',
    },
    tableRow: {
        display: 'flex',
        position: 'absolute',
        width: '100%',
    },
    virtualPadding: {
        display: 'flex',
    },
    tableHeaderCell: {
        padding: 1,
        display: 'flex',
        position: 'relative',
    },
    tableHeaderLabel: {
        width: '100%',
        textAlign: 'center',
    },
    tableCell: {
        border: '1px solid rgba(224, 224, 224, 1)',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: 1,
        maxHeight: '5em',
    },
    resizer: {
        top: 0,
        position: 'absolute',
        height: '100%',
        right: 0,
        width: '3px',
        background: 'rgba(0, 0, 0, 0.5)',
        cursor: 'col-resize',
        userSelect: 'none',
        touchAction: 'none',
    },
    highlightedCell: {
        backgroundColor: '#f1fae0',
    },
    rowNumberCell: {
        backgroundColor: '#f4f4f4',
        fontSize: 'small',
        overflow: 'visible',
        padding: 1,
        justifyContent: 'center',
    },
    selectingCell: {
        backgroundColor: '#e0f7fa',
    },
    loading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        display: 'flex',
        flexDirection: 'column',
        transform: 'translate(-50%, -50%)',
    },
    sponsored: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#888',
        textAlign: 'center',
    }
};

const DatasetView: React.FC<{ tableData: ITableData, currentPage: number, isLoading: boolean }> = ({
    tableData,
    currentPage,
    isLoading
}: {
    tableData: ITableData;
    currentPage: number;
    isLoading: boolean;
}) => {
    const dispatch = useAppDispatch();
    const pageSize = useAppSelector((state) => state.settings.pageSize);

    const columns = useMemo<ColumnDef<ITableRow>[]>(() => {
        const result = tableData.header.map((column) => {
            return {
                accessorKey: column.id,
                header: column.id,
                size: 120,
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
    const data = useMemo(() => {
        return tableData.data.map((row, index) => {
            const newRow: ITableRow = {};
            row.forEach((cell, cellIndex) => {
                newRow[tableData.header[cellIndex].id] = cell;
            });
            // Add row number
            newRow['#'] = index + 1 + currentPage * pageSize;
            return newRow;
        });
    }, [tableData, currentPage, pageSize]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        columnResizeMode: 'onEnd',
    });

    const { rows } = table.getRowModel();

    const visibleColumns = table.getVisibleLeafColumns();

    // The virtualizers need to know the scrollable container element
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length,
        estimateSize: (index) => visibleColumns[index].getSize(), // estimate width of each column for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3, // how many columns to render on each side off screen each way (adjust this for performance)
    });

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => 33, // estimate row height for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        // measure dynamic row height, except in firefox because it measures table border height incorrectly
        measureElement: (element) => element?.getBoundingClientRect().height,
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

    const handleCellClick = useCallback((rowIndex: number, columnIndex: number) => {
        setHighlightedCells([{ row: rowIndex, column: columnIndex }]);
    }, []);

    const handleColumnSelect = useCallback((columnIndex: number) => {
        const newHighlightedCells: { row: number; column: number }[] = [];
        for (let row = 0; row < rows.length; row++) {
            newHighlightedCells.push({ row, column: columnIndex });
        }
        setHighlightedCells(newHighlightedCells);
    }, [rows]);

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

            const selectedData = rowIndices
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

            window.electron.writeToClipboard(selectedData);
            dispatch(
                openSnackbar({
                    message: 'Copied to clipboard',
                    type: 'success',
                    props: { duration: 1000 },
                }),
            );
        }
    }, [highlightedCells, rows, dispatch]);

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
        if (goTo.row !== null && currentPage === Math.floor(goTo.row/pageSize) && isLoading === false) {
            const row = (goTo.row - 1) % pageSize;
            rowVirtualizer.scrollToIndex(row);
            dispatch(setGoTo({ row: null }));
            // Highlight the row number
            handleCellClick(row, 0);
        }
    }, [goTo.row, rowVirtualizer, dispatch, pageSize, currentPage, handleCellClick, isLoading]);

    useEffect(() => {
        if (goTo.column !== null) {
            // Add +1 as the first column is the row number
            const columnIndex = tableData.header.findIndex(item => item.id === goTo.column) + 1;
            if (columnIndex !== -1) {
                columnVirtualizer.scrollToIndex(columnIndex);
            }
            dispatch(setGoTo({ column: null }));
            // Highlight the column
            handleColumnSelect(columnIndex);
        }
    }, [goTo.column, tableData.header, columnVirtualizer, dispatch, handleColumnSelect]);

    return (
        <Paper
            ref={tableContainerRef}
            sx={styles.container}
        >
            <Table sx={styles.table}>
                <TableHead sx={styles.header}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            style={styles.headerColumn}
                        >
                            {virtualPaddingLeft ? (
                                // Fake empty column to the left for virtualization scroll padding
                                <TableCell
                                    sx={{
                                        display: 'flex',
                                        width: virtualPaddingLeft,
                                    }}
                                />
                            ) : null}
                            {virtualColumns.map((vc) => {
                                const header = headerGroup.headers[vc.index];
                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            ...styles.tableHeaderCell,
                                            width: header.getSize(),
                                            ...(header.id === '#'
                                                ? {
                                                    justifyContent: 'center',
                                                    fontSize: 'small',
                                                    backgroundColor:
                                                          '#f4f4f4',
                                                }
                                                : {}),
                                        }}
                                    >
                                        <Box
                                            sx={styles.tableHeaderLabel}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </Box>
                                        <Box
                                            sx={styles.resizer}
                                            {...{
                                                onDoubleClick: () => header.column.resetSize(),
                                                onMouseDown: header.getResizeHandler(),
                                                onTouchStart: header.getResizeHandler(),
                                                className: `resizer ${
                                                    table.options.columnResizeDirection
                                                } ${
                                                    header.column.getIsResizing() ? 'isResizing' : ''
                                                }`,
                                                style: {
                                                    transform:
                              header.column.getIsResizing()
                                  ? `translateX(${
                                      (table.options.columnResizeDirection ===
                                    'rtl'
                                          ? -1
                                          : 1) *
                                    (table.getState().columnSizingInfo
                                        .deltaOffset ?? 0)
                                  }px)`
                                  : '',
                                                },
                                            }}
                                        />

                                    </TableCell>
                                );
                            })}
                            {virtualPaddingRight ? (
                                // fake empty column to the right for virtualization scroll padding
                                <TableCell
                                    style={{
                                        display: 'flex',
                                        width: virtualPaddingRight,
                                    }}
                                />
                            ) : null}
                        </TableRow>
                    ))}
                </TableHead>
                <TableBody
                    sx={{
                        ...styles.tbody,
                        height: `${rowVirtualizer.getTotalSize()}px`, // tells scrollbar how big the table is
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index] as Row<ITableRow>;
                        const visibleCells = row.getVisibleCells();

                        return (
                            <TableRow
                                data-index={virtualRow.index} // needed for dynamic row height measurement
                                ref={(node) =>
                                    rowVirtualizer.measureElement(node)
                                } // measure dynamic row height
                                key={row.id}
                                sx={{
                                    ...styles.tableRow,
                                    transform: `translateY(${virtualRow.start}px)`, // this should always be a `style` as it changes on scroll
                                }}
                            >
                                {virtualPaddingLeft ? (
                                    // fake empty column to the left for virtualization scroll padding
                                    <TableCell
                                        sx={{
                                            display: 'flex',
                                            width: virtualPaddingLeft,
                                        }}
                                    />
                                ) : null}
                                {virtualColumns.map((vc) => {
                                    const cell = visibleCells[vc.index];
                                    const isHighlighted = highlightedCells.some(
                                        (highlightedCell) =>
                                            highlightedCell.row ===
                                                virtualRow.index &&
                                            highlightedCell.column === vc.index,
                                    );
                                    return (
                                        <TableCell
                                            key={cell.id}
                                            sx={{
                                                ...styles.tableCell,
                                                width: cell.column.getSize(),
                                                ...(vc.index === 0
                                                    ? styles.rowNumberCell
                                                    : {}),
                                                ...(isHighlighted
                                                    ? styles.highlightedCell
                                                    : {}),
                                            }}
                                            onClick={() =>
                                                handleCellClick(
                                                    virtualRow.index,
                                                    vc.index,
                                                )
                                            }
                                            onMouseDown={() =>
                                                handleMouseDown(
                                                    virtualRow.index,
                                                    vc.index,
                                                )
                                            }
                                            onMouseOver={() =>
                                                handleMouseOver(
                                                    virtualRow.index,
                                                    vc.index,
                                                )
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    );
                                })}
                                {virtualPaddingRight ? (
                                    // fake empty column to the right for virtualization scroll padding
                                    <TableCell
                                        style={{
                                            display: 'flex',
                                            width: virtualPaddingRight,
                                        }}
                                    />
                                ) : null}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            { isLoading && (
                <Box sx={styles.loading}>
                    <Loading />
                    <Box sx={styles.sponsored}>Sponsored by:</Box>
                </Box>
            )}
        </Paper>
    );
};

export default DatasetView;
