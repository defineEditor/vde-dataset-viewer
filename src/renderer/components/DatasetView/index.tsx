import React from 'react';
import { ITableData } from 'interfaces/common';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Paper,
} from '@mui/material';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    Row,
    useReactTable,
} from '@tanstack/react-table';

import { useVirtualizer } from '@tanstack/react-virtual';

interface TableRow {
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
        height: '90vh',
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
    tableCell: {
        display: 'flex',
        border: '1px solid rgba(224, 224, 224, 1)',
        cursor: 'pointer',
    },
    highlightedCell: {
        backgroundColor: '#f1fae0',
    },
    selectingCell: {
        backgroundColor: '#e0f7fa',
    },
};

const DatasetView: React.FC<{ tableData: ITableData }> = ({
    tableData,
}: {
    tableData: ITableData;
}) => {
    const columns = React.useMemo<ColumnDef<TableRow>[]>(
        () =>
            tableData.header.map((column) => {
                return {
                    accessorKey: column.id,
                    header: column.id,
                    size: 120,
                };
            }),
        [tableData.header],
    );

    // Inital rows;
    const [data, _setData] = React.useState(() =>
        tableData.data.map((row) => {
            const newRow: TableRow = {};
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

    //The virtualizers need to know the scrollable container element
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    //we are using a slightly different virtualization strategy for columns (compared to virtual rows) in order to support dynamic row heights
    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length,
        estimateSize: (index) => visibleColumns[index].getSize(), //estimate width of each column for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3, //how many columns to render on each side off screen each way (adjust this for performance)
    });

    //dynamic row height virtualization - alternatively you could use a simpler fixed row height strategy without the need for `measureElement`
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        //measure dynamic row height, except in firefox because it measures table border height incorrectly
        measureElement:
            typeof window !== 'undefined' &&
            navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
        overscan: 15,
    });

    const virtualColumns = columnVirtualizer.getVirtualItems();
    const virtualRows = rowVirtualizer.getVirtualItems();

    //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
    let virtualPaddingLeft: number | undefined;
    let virtualPaddingRight: number | undefined;

    if (columnVirtualizer && virtualColumns?.length) {
        virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
        virtualPaddingRight =
            columnVirtualizer.getTotalSize() -
            (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
    }

    const [highlightedCells, setHighlightedCells] = React.useState<
        { row: number; column: number }[]
    >([]);
    const [selecting, setSelecting] = React.useState(false);
    const [startCell, setStartCell] = React.useState<{
        row: number;
        column: number;
    } | null>(null);

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

    React.useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <Paper
            className="container"
            ref={tableContainerRef}
            sx={styles.container}
        >
            {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
            <Table sx={styles.table}>
                <TableHead sx={styles.header}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            style={styles.headerColumn}
                        >
                            {virtualPaddingLeft ? (
                                //Fake empty column to the left for virtualization scroll padding
                                <TableRow
                                    sx={{
                                        display: 'flex',
                                        width: virtualPaddingLeft,
                                    }}
                                />
                            ) : null}
                            {virtualColumns.map((vc) => {
                                const header = headerGroup.headers[vc.index];
                                return (
                                    <TableRow
                                        key={header.id}
                                        style={{
                                            display: 'flex',
                                            width: header.getSize(),
                                        }}
                                    >
                                        <TableCell
                                            {...{
                                                className:
                                                    header.column.getCanSort()
                                                        ? 'cursor-pointer select-none'
                                                        : '',
                                                onClick:
                                                    header.column.getToggleSortingHandler(),
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                            {{
                                                asc: ' 🔼',
                                                desc: ' 🔽',
                                            }[
                                                header.column.getIsSorted() as string
                                            ] ?? null}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {virtualPaddingRight ? (
                                //fake empty column to the right for virtualization scroll padding
                                <TableRow
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
                        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index] as Row<TableRow>;
                        const visibleCells = row.getVisibleCells();

                        return (
                            <TableRow
                                data-index={virtualRow.index} //needed for dynamic row height measurement
                                ref={(node) =>
                                    rowVirtualizer.measureElement(node)
                                } //measure dynamic row height
                                key={row.id}
                                sx={{
                                    ...styles.tableRow,
                                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                                }}
                            >
                                {virtualPaddingLeft ? (
                                    //fake empty column to the left for virtualization scroll padding
                                    <TableRow
                                        style={{
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
                                            style={{
                                                ...styles.tableCell,
                                                width: cell.column.getSize(),
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
                                    //fake empty column to the right for virtualization scroll padding
                                    <TableRow
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
        </Paper>
    );
};

export default DatasetView;
