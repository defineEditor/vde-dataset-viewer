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
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    flexRender,
    Table as ITable,
    Column as IColumn,
    Row as IRow,
    SortingState as ISortingState,
    Updater as IUpdater,
} from '@tanstack/react-table';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import AccessTimeIcon from '@mui/icons-material/HourglassFull';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { ITableRow, TableSettings } from 'interfaces/common';
import Loading from 'renderer/components/Loading';

const getContainerStyle = (settings: TableSettings): React.CSSProperties => {
    const result: React.CSSProperties = {
        overflow: 'auto',
        position: 'relative',
        height: settings.height ? `${settings.height}px` : '100vh',
        userSelect: 'none',
    };
    if (settings.width) {
        result.width = `${settings.width}px`;
    }
    return result;
};

const getLoadingStyle = (settings: TableSettings): React.CSSProperties => {
    return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        display: 'flex',
        flexDirection: 'column',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        scale:
            settings.height && settings.height > 400
                ? '1'
                : settings.height
                  ? settings.height / 400
                  : '1',
    };
};

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
        padding: 0,
        fontFamily: 'Roboto Mono',
        display: 'flex',
        position: 'relative',
        justifyContent: 'center',
        width: '100%',
    },
    tableHeaderLabel: {
        width: '100%',
        textAlign: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    tableHeaderText: {
        py: 1,
        pl: 1,
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
    loading: {},
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
    typeIcon: {
        fontSize: '16px',
        color: 'grey.600',
        ml: '4px',
    },
    squareIconButton: {
        aspectRatio: '1 / 1',
        minWidth: 0,
        textAlign: 'center',
        flex: 1,
        justifyContent: 'center',
    },
};

const getTypeIcon = (type: string | undefined) => {
    if (!type) {
        return null;
    }
    if (['date', 'datetime', 'time'].includes(type)) {
        return <AccessTimeIcon sx={styles.typeIcon} />;
    }
    if (['integer', 'float', 'double', 'decimal'].includes(type)) {
        return <LooksOneIcon sx={styles.typeIcon} />;
    }
    return <FontDownloadIcon sx={styles.typeIcon} />;
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
    handleResizeEnd: () => void;
    isLoading: boolean;
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
    sorting: ISortingState;
    onSortingChange: (updater: IUpdater<ISortingState>) => void;
    settings: TableSettings;
    handleContextMenu?: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        rowIndex: number,
        columnIndex: number,
    ) => void;
    filteredColumns?: string[];
    containerStyle?: React.CSSProperties;
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
    handleResizeEnd,
    isLoading,
    settings,
    rowVirtualizer,
    sorting,
    onSortingChange,
    handleContextMenu = (_event, _rowIndex, _columnIndex) => {},
    filteredColumns = [],
    containerStyle = undefined,
}) => {
    return (
        <Paper
            ref={tableContainerRef}
            sx={containerStyle || getContainerStyle(settings)}
        >
            <Table sx={styles.table}>
                <TableHead sx={styles.header}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            style={styles.headerColumn}
                        >
                            {!settings.hideRowNumbers && (
                                <TableCell
                                    sx={{
                                        ...styles.tableHeaderCell,
                                        width: visibleColumns[0].getSize(),
                                        ...styles.headerRowNumberCell,
                                    }}
                                >
                                    <Tooltip
                                        title="Select All"
                                        enterDelay={1000}
                                    >
                                        <IconButton
                                            sx={styles.squareIconButton}
                                            onClick={() => {
                                                handleMouseDown(-1, -1);
                                            }}
                                        >
                                            <SelectAllIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            )}
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
                                        onContextMenu={(event) =>
                                            handleContextMenu(
                                                event,
                                                -1,
                                                vc.index + 1,
                                            )
                                        }
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
                                            onMouseDown={(
                                                event: React.MouseEvent,
                                            ) => {
                                                if (event.button === 0) {
                                                    handleMouseDown(
                                                        0,
                                                        vc.index + 1,
                                                    );
                                                }
                                            }}
                                            onMouseOver={() =>
                                                handleMouseOver(0, vc.index + 1)
                                            }
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
                                            sx={styles.tableHeaderLabel}
                                        >
                                            <Box sx={styles.tableHeaderText}>
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                            </Box>
                                            {settings.showTypeIcons &&
                                                getTypeIcon(
                                                    header.column.columnDef.meta
                                                        ?.type,
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
                                                onMouseUp: () =>
                                                    handleResizeEnd(),
                                                onTouchStart:
                                                    header.getResizeHandler(),
                                                className: `resizer ${
                                                    table.options
                                                        .columnResizeDirection
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
                                        settings.dynamicRowHeight
                                            ? virtualRow.index
                                            : undefined
                                    }
                                    ref={(node) =>
                                        settings.dynamicRowHeight
                                            ? rowVirtualizer.measureElement(
                                                  node,
                                              )
                                            : null
                                    }
                                    key={row.id}
                                    sx={{
                                        ...styles.tableRow,
                                        ...(settings.dynamicRowHeight
                                            ? {}
                                            : {
                                                  height: `${virtualRow.size}px`,
                                              }),
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {!settings.hideRowNumbers && (
                                        <TableCell
                                            sx={{
                                                ...(settings.dynamicRowHeight
                                                    ? styles.tableCellDynamic
                                                    : styles.tableCellFixed),
                                                width: visibleCells[0].column.getSize(),
                                                ...styles.rowNumberCell,
                                            }}
                                            onClick={() =>
                                                handleCellClick(
                                                    virtualRow.index,
                                                    0,
                                                )
                                            }
                                            onMouseDown={() =>
                                                handleMouseDown(
                                                    virtualRow.index,
                                                    0,
                                                )
                                            }
                                            onMouseOver={() =>
                                                handleMouseOver(
                                                    virtualRow.index,
                                                    0,
                                                )
                                            }
                                        >
                                            {flexRender(
                                                visibleCells[0].column.columnDef
                                                    .cell,
                                                visibleCells[0].getContext(),
                                            )}
                                        </TableCell>
                                    )}
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

                                        let cellStyle: React.CSSProperties = {
                                            ...(settings.dynamicRowHeight
                                                ? styles.tableCellDynamic
                                                : styles.tableCellFixed),
                                            width: cell.column.getSize(),
                                        };

                                        const isHighlighted =
                                            highlightedCells.some(
                                                (highlightedCell) =>
                                                    highlightedCell.row ===
                                                        virtualRow.index &&
                                                    highlightedCell.column ===
                                                        vc.index + 1,
                                            );
                                        if (isHighlighted) {
                                            cellStyle = {
                                                ...cellStyle,
                                                ...styles.highlightedCell,
                                            };
                                        }

                                        if (cell.column.columnDef.meta?.style) {
                                            cellStyle = {
                                                ...cellStyle,
                                                ...cell.column.columnDef.meta
                                                    .style,
                                            };
                                        }

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                sx={cellStyle}
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
                <Box sx={getLoadingStyle(settings)}>
                    <Loading />
                    <Box sx={styles.sponsored}>Sponsored by:</Box>
                </Box>
            )}
        </Paper>
    );
};

export default DatasetViewUI;
