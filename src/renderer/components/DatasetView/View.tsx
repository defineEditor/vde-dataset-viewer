import React from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Paper,
    Box,
    TableSortLabel,
} from '@mui/material';
import {
    flexRender,
    Table as ITable,
    Column as IColumn,
    Row as IRow,
    SortingState as ISortingState,
    Updater as IUpdater,
} from '@tanstack/react-table';
import FilterIcon from '@mui/icons-material/FilterAlt';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { ITableRow } from 'interfaces/common';
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
    containerWithPage: {
        overflow: 'auto',
        position: 'relative',
        height: 'calc(100vh - 116px)', // 116px - toolbar + pagination
        userSelect: 'none',
    },
    containerWithoutPage: {
        overflow: 'auto',
        position: 'relative',
        height: 'calc(100vh - 64px)', // 64 - toolbar
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
        fontFamily: 'Roboto Mono',
        display: 'flex',
        position: 'relative',
        justifyContent: 'center',
        width: '100%',
    },
    tableHeaderLabel: {
        width: '100%',
        textAlign: 'center',
    },
    tableCellDynamic: {
        border: '1px solid rgba(224, 224, 224, 1)',
        fontFamily: 'Roboto Mono',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: 1,
        maxHeight: '5em',
    },
    tableCellFixed: {
        border: '1px solid rgba(224, 224, 224, 1)',
        fontFamily: 'Roboto Mono',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: 1,
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
        transition: 'background 0.3s, width 0.3s',
        '&:hover': {
            backgroundColor: 'primary.light',
            width: '5px',
        },
    },
    highlightedCell: {
        backgroundColor: '#42a5f533',
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
    filterIcon: {
        fontSize: '16px',
        color: 'grey.600',
        pb: '1px',
    },
};

const DatasetViewUI: React.FC<{
    table: ITable<ITableRow>;
    tableContainerRef: React.RefObject<HTMLDivElement>;
    visibleColumns: IColumn<ITableRow, unknown>[];
    virtualPaddingLeft: number | undefined;
    virtualPaddingRight: number | undefined;
    virtualColumns: VirtualItem[];
    virtualRows: VirtualItem[];
    rows: IRow<ITableRow>[];
    highlightedCells: { row: number; column: number }[];
    handleCellClick: (rowIndex: number, columnIndex: number) => void;
    handleMouseDown: (rowIndex: number, columnIndex: number) => void;
    handleMouseOver: (rowIndex: number, columnIndex: number) => void;
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
    dynamicRowHeight,
    rowVirtualizer,
    sorting,
    onSortingChange,
    hasPagination,
    handleContextMenu = (_event, _rowIndex, _columnIndex) => {},
    filteredColumns = [],
}) => {
    return (
        <Paper
            ref={tableContainerRef}
            sx={
                hasPagination
                    ? styles.containerWithPage
                    : styles.containerWithoutPage
            }
        >
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
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <TableSortLabel
                                            onClick={() => {
                                                const isSorted = sorting.find(
                                                    (sort) =>
                                                        sort.id === header.id,
                                                );
                                                onSortingChange([
                                                    {
                                                        id: header.id,
                                                        desc: isSorted
                                                            ? !isSorted.desc
                                                            : false,
                                                    },
                                                ]);
                                            }}
                                            active={
                                                !!sorting.find(
                                                    (sort) =>
                                                        sort.id === header.id,
                                                )
                                            }
                                            direction={
                                                sorting.find(
                                                    (sort) =>
                                                        sort.id === header.id,
                                                )?.desc
                                                    ? 'desc'
                                                    : 'asc'
                                            }
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                            {filteredColumns.includes(
                                                header.id,
                                            ) && (
                                                <FilterIcon
                                                    sx={styles.filterIcon}
                                                />
                                            )}
                                        </TableSortLabel>
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
                    {!isLoading &&
                        virtualRows.map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            const visibleCells = row.getVisibleCells();

                            return (
                                <TableRow
                                    data-index={
                                        dynamicRowHeight
                                            ? virtualRow.index
                                            : undefined
                                    }
                                    ref={(node) =>
                                        dynamicRowHeight
                                            ? rowVirtualizer.measureElement(
                                                  node,
                                              )
                                            : null
                                    }
                                    key={row.id}
                                    sx={{
                                        ...styles.tableRow,
                                        ...(dynamicRowHeight
                                            ? {}
                                            : {
                                                  height: `${virtualRow.size}px`,
                                              }),
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <TableCell
                                        sx={{
                                            ...(dynamicRowHeight
                                                ? styles.tableCellDynamic
                                                : styles.tableCellFixed),
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
                                            visibleCells[0].column.columnDef
                                                .cell,
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
                                        const cell = visibleCells[vc.index + 1]; // Adjust index for row number
                                        const isHighlighted =
                                            highlightedCells.some(
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
                                                    ...(dynamicRowHeight
                                                        ? styles.tableCellDynamic
                                                        : styles.tableCellFixed),
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
                                                onContextMenu={(event) =>
                                                    handleContextMenu(
                                                        event,
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
