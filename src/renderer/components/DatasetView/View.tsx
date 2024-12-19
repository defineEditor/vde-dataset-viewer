import React from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Paper,
    Box,
} from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import Loading from 'renderer/components/Loading';

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
    headerRowNumberCell: {
        justifyContent: 'center',
        fontSize: 'small',
        backgroundColor: '#f4f4f4',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        maxHeight: '100%',
    },
    rowNumberCell: {
        backgroundColor: '#f4f4f4',
        fontSize: 'small',
        overflow: 'visible',
        padding: 0.5,
        justifyContent: 'center',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        maxHeight: '100%',
        textAlign: 'center',
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
    },
};

const DatasetViewUI: React.FC<{
    table: any;
    tableContainerRef: React.RefObject<HTMLDivElement>;
    visibleColumns: any[];
    virtualPaddingLeft: number | undefined;
    virtualPaddingRight: number | undefined;
    virtualColumns: any[];
    virtualRows: any[];
    rows: any[];
    highlightedCells: { row: number; column: number }[];
    handleCellClick: (_rowIndex: number, _columnIndex: number) => void;
    handleMouseDown: (_rowIndex: number, _columnIndex: number) => void;
    handleMouseOver: (_rowIndex: number, _columnIndex: number) => void;
    isLoading: boolean;
    rowVirtualizer: any;
}> = ({
    table,
    tableContainerRef,
    visibleColumns,
    virtualPaddingLeft,
    virtualPaddingRight,
    virtualColumns,
    virtualRows,
    rows,
    highlightedCells,
    handleCellClick,
    handleMouseDown,
    handleMouseOver,
    isLoading,
    rowVirtualizer,
}) => {
    return (
        <Paper ref={tableContainerRef} sx={styles.container}>
            <Table sx={styles.table}>
                <TableHead sx={styles.header}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            style={styles.headerColumn}
                        >
                            <TableCell
                                sx={{
                                    ...styles.tableHeaderCell,
                                    width: visibleColumns[0].getSize(),
                                    ...styles.headerRowNumberCell,
                                }}
                            >
                                <Box sx={styles.tableHeaderLabel}>
                                    {flexRender(
                                        headerGroup.headers[0].column.columnDef
                                            .header,
                                        headerGroup.headers[0].getContext(),
                                    )}
                                </Box>
                            </TableCell>
                            {virtualPaddingLeft ? (
                                <TableCell
                                    sx={{
                                        display: 'flex',
                                        width: virtualPaddingLeft,
                                    }}
                                />
                            ) : null}
                            {virtualColumns.map((vc) => {
                                const header =
                                    headerGroup.headers[vc.index + 1]; // Adjust index
                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            ...styles.tableHeaderCell,
                                            width: header.getSize(),
                                        }}
                                    >
                                        <Box sx={styles.tableHeaderLabel}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </Box>
                                        <Box
                                            sx={styles.resizer}
                                            {...{
                                                onDoubleClick: () =>
                                                    header.column.resetSize(),
                                                onMouseDown:
                                                    header.getResizeHandler(),
                                                onTouchStart:
                                                    header.getResizeHandler(),
                                                className: `resizer ${
                                                    table.options
                                                        .columnResizeDirection
                                                } ${
                                                    header.column.getIsResizing()
                                                        ? 'isResizing'
                                                        : ''
                                                }`,
                                                style: {
                                                    transform:
                                                        header.column.getIsResizing()
                                                            ? `translateX(${
                                                                  (table.options
                                                                      .columnResizeDirection ===
                                                                  'rtl'
                                                                      ? -1
                                                                      : 1) *
                                                                  (table.getState()
                                                                      .columnSizingInfo
                                                                      .deltaOffset ??
                                                                      0)
                                                              }px)`
                                                            : '',
                                                },
                                            }}
                                        />
                                    </TableCell>
                                );
                            })}
                            {virtualPaddingRight ? (
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
                        height: `${rowVirtualizer.getTotalSize()}px`,
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        const visibleCells = row.getVisibleCells();

                        return (
                            <TableRow
                                data-index={virtualRow.index}
                                ref={(node) =>
                                    rowVirtualizer.measureElement(node)
                                }
                                key={row.id}
                                sx={{
                                    ...styles.tableRow,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <TableCell
                                    sx={{
                                        ...styles.tableCell,
                                        width: visibleCells[0].column.getSize(),
                                        ...styles.rowNumberCell,
                                    }}
                                    onClick={() =>
                                        handleCellClick(virtualRow.index, 0)
                                    }
                                    onMouseDown={() =>
                                        handleMouseDown(virtualRow.index, 0)
                                    }
                                    onMouseOver={() =>
                                        handleMouseOver(virtualRow.index, 0)
                                    }
                                >
                                    {flexRender(
                                        visibleCells[0].column.columnDef.cell,
                                        visibleCells[0].getContext(),
                                    )}
                                </TableCell>
                                {virtualPaddingLeft ? (
                                    <TableCell
                                        sx={{
                                            display: 'flex',
                                            width: virtualPaddingLeft,
                                        }}
                                    />
                                ) : null}
                                {virtualColumns.map((vc) => {
                                    const cell = visibleCells[vc.index + 1]; // Adjust index
                                    const isHighlighted = highlightedCells.some(
                                        (highlightedCell) =>
                                            highlightedCell.row ===
                                                virtualRow.index &&
                                            highlightedCell.column ===
                                                vc.index + 1,
                                    );
                                    return (
                                        <TableCell
                                            key={cell.id}
                                            sx={{
                                                ...styles.tableCell,
                                                width: cell.column.getSize(),
                                                ...(isHighlighted
                                                    ? styles.highlightedCell
                                                    : {}),
                                            }}
                                            onClick={() =>
                                                handleCellClick(
                                                    virtualRow.index,
                                                    vc.index + 1,
                                                )
                                            }
                                            onMouseDown={() =>
                                                handleMouseDown(
                                                    virtualRow.index,
                                                    vc.index + 1,
                                                )
                                            }
                                            onMouseOver={() =>
                                                handleMouseOver(
                                                    virtualRow.index,
                                                    vc.index + 1,
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
            {isLoading && (
                <Box sx={styles.loading}>
                    <Loading />
                    <Box sx={styles.sponsored}>Sponsored by:</Box>
                </Box>
            )}
        </Paper>
    );
};

export default DatasetViewUI;
