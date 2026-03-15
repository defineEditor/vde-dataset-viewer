import React from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
    Paper,
    Box,
    Stack,
    TableSortLabel,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Cell as ICell,
    flexRender,
    Header as IHeader,
    Table as ITable,
    Column as IColumn,
    Row as IRow,
    SortingState as ISortingState,
    Updater as IUpdater,
} from '@tanstack/react-table';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import ExposureIcon from '@mui/icons-material/Exposure';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import AccessTimeIcon from '@mui/icons-material/HourglassFull';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { ITableRow, TableRowValue, TableSettings } from 'interfaces/common';
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
        borderCollapse: 'separate',
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
        backgroundColor: '#f4f4f4',
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
        whiteSpace: 'pre-wrap',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: 1,
        maxHeight: '5em',
    },
    tableCellFixed: {
        border: '1px solid rgba(224, 224, 224, 1)',
        fontFamily: 'Roboto Mono',
        whiteSpace: 'pre',
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
        backgroundColor: '#bbe0ff',
    },
    annotatedCell: {
        backgroundColor: '#fff8e1',
        border: '1px solid #ffe082',
    },
    annotatedRowCell: {
        backgroundColor: '#fff8e1;',
        border: '1px solid #ffe082;',
    },
    highlightedAnnotatedCell: {
        backgroundColor: '#ffca28',
        border: '1px solid #ffca2890',
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
    allSpace: {
        width: '100%',
        height: '100%',
    },
    preWrap: {
        whiteSpace: 'pre-wrap',
    },
};

const getCommonPinningStyles = (
    column: IColumn<ITableRow, unknown>,
    backgroundColor: string,
    zIndex = 1,
): React.CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left');
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right');

    return {
        backgroundColor,
        boxShadow: isLastLeftPinnedColumn
            ? '-4px 0 4px -4px rgba(0, 0, 0, 0.25) inset'
            : isFirstRightPinnedColumn
              ? '4px 0 4px -4px rgba(0, 0, 0, 0.25) inset'
              : undefined,
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        opacity: isPinned ? 0.98 : 1,
        position: isPinned ? 'sticky' : 'relative',
        zIndex,
    };
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
    if (['boolean'].includes(type)) {
        return <ExposureIcon sx={styles.typeIcon} />;
    }
    return <FontDownloadIcon sx={styles.typeIcon} />;
};

type AnnotationData = {
    text: string | React.ReactElement;
    color: string;
};

type HighlightedCells = {
    [columnId: string]: number[];
};

const DatasetHeaderCell: React.FC<{
    column: IColumn<ITableRow, unknown>;
    header: IHeader<ITableRow, unknown>;
    filteredColumns: string[];
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    handleMouseDown: (rowIndex: number | null, columnId: string | null) => void;
    handleMouseOver: (rowIndex: number | null, columnId: string | null) => void;
    handleResizeEnd: () => void;
    onSortingChange: (updater: IUpdater<ISortingState>) => void;
    settings: TableSettings;
    sorting: ISortingState;
    table: ITable<ITableRow>;
    usePinningStyles?: boolean;
}> = ({
    column,
    header,
    filteredColumns,
    handleContextMenu,
    handleMouseDown,
    handleMouseOver,
    handleResizeEnd,
    onSortingChange,
    settings,
    sorting,
    table,
    usePinningStyles = false,
}) => {
    const isRowNumber = column.id === '#';
    const isSorted = sorting.find((sort) => sort.id === header.id);

    const headerCellSx = {
        ...styles.tableHeaderCell,
        width: header.getSize(),
        ...(isRowNumber ? styles.headerRowNumberCell : { cursor: 'pointer' }),
        ...(usePinningStyles
            ? getCommonPinningStyles(column, '#f4f4f4', 4)
            : {}),
        ...(settings.denseHeader ? { height: '30px' } : {}),
    };

    return (
        <TableCell
            key={header.id}
            sx={headerCellSx}
            onContextMenu={
                isRowNumber
                    ? undefined
                    : (event) => handleContextMenu(event, header.id, '', true)
            }
        >
            {isRowNumber ? (
                <Tooltip title="Select All" enterDelay={1000}>
                    <IconButton
                        sx={styles.squareIconButton}
                        onClick={() => {
                            handleMouseDown(null, null);
                        }}
                    >
                        <SelectAllIcon />
                    </IconButton>
                </Tooltip>
            ) : (
                <>
                    {settings.disableSorting ? (
                        <Stack
                            sx={styles.tableHeaderLabel}
                            direction="row"
                            alignItems="center"
                        >
                            <Box sx={styles.tableHeaderText}>
                                {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                )}
                            </Box>
                            {settings.showTypeIcons &&
                                getTypeIcon(header.column.columnDef.meta?.type)}
                            {filteredColumns.includes(header.id) && (
                                <FilterIcon sx={styles.filterIcon} />
                            )}
                        </Stack>
                    ) : (
                        <TableSortLabel
                            onClick={() => {
                                onSortingChange([
                                    {
                                        id: header.id,
                                        desc: isSorted ? !isSorted.desc : false,
                                    },
                                ]);
                            }}
                            onMouseDown={(event: React.MouseEvent) => {
                                if (event.button === 0) {
                                    handleMouseDown(null, header.id);
                                }
                            }}
                            onMouseOver={() => handleMouseOver(null, header.id)}
                            active={!!isSorted}
                            direction={isSorted?.desc ? 'desc' : 'asc'}
                            sx={styles.tableHeaderLabel}
                        >
                            <Box sx={styles.tableHeaderText}>
                                {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                )}
                            </Box>
                            {settings.showTypeIcons &&
                                getTypeIcon(header.column.columnDef.meta?.type)}
                            {filteredColumns.includes(header.id) && (
                                <FilterIcon sx={styles.filterIcon} />
                            )}
                        </TableSortLabel>
                    )}
                    <Box
                        sx={styles.resizer}
                        {...{
                            onDoubleClick: () => header.column.resetSize(),
                            onMouseDown: header.getResizeHandler(),
                            onMouseUp: () => handleResizeEnd(),
                            onTouchStart: header.getResizeHandler(),
                            className: `resizer ${
                                table.options.columnResizeDirection
                            }`,
                            style: {
                                transform: header.column.getIsResizing()
                                    ? `translateX(${(table.options.columnResizeDirection === 'rtl' ? -1 : 1) * (table.getState().columnSizingInfo.deltaOffset ?? 0)}px)`
                                    : '',
                            },
                        }}
                    />
                </>
            )}
        </TableCell>
    );
};

const DatasetBodyCell: React.FC<{
    annotation: AnnotationData | null;
    cell: ICell<ITableRow, unknown>;
    handleCellClick: (rowIndex: number, columnId: string) => void;
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    handleMouseDown: (rowIndex: number | null, columnId: string | null) => void;
    handleMouseOver: (rowIndex: number | null, columnId: string | null) => void;
    isHighlighted: boolean;
    rowAnnotation: AnnotationData | null;
    rowIndex: number;
    settings: TableSettings;
    usePinningStyles?: boolean;
}> = ({
    annotation,
    cell,
    handleCellClick,
    handleContextMenu,
    handleMouseDown,
    handleMouseOver,
    isHighlighted,
    rowAnnotation,
    rowIndex,
    settings,
    usePinningStyles = false,
}) => {
    const isRowNumber = cell.column.id === '#';
    const isAnnotated = !!annotation;

    let cellStyle = {
        ...(settings.dynamicRowHeight
            ? styles.tableCellDynamic
            : styles.tableCellFixed),
        width: cell.column.getSize(),
        ...(isRowNumber ? styles.rowNumberCell : {}),
        ...(usePinningStyles
            ? getCommonPinningStyles(
                  cell.column,
                  isRowNumber ? '#f4f4f4' : '#ffffff',
                  3,
              )
            : {}),
    } as React.CSSProperties;

    if (isRowNumber && rowAnnotation) {
        cellStyle = {
            ...cellStyle,
            ...styles.annotatedRowCell,
        };
    } else if (isAnnotated && isHighlighted) {
        cellStyle = {
            ...cellStyle,
            ...styles.highlightedAnnotatedCell,
        };
    } else if (isAnnotated) {
        cellStyle = {
            ...cellStyle,
            ...styles.annotatedCell,
        };
    } else if (isHighlighted) {
        cellStyle = {
            ...cellStyle,
            ...styles.highlightedCell,
        };
    }

    if (cell.column.columnDef.meta?.style) {
        cellStyle = {
            ...cellStyle,
            ...cell.column.columnDef.meta.style,
        };
    }

    const renderedCell = flexRender(
        cell.column.columnDef.cell,
        cell.getContext(),
    );

    const renderedContent =
        isRowNumber && rowAnnotation ? (
            <Tooltip
                title={<Box sx={styles.preWrap}>{rowAnnotation.text}</Box>}
                placement="top"
            >
                <Box sx={styles.allSpace}>{cell.getValue() as string}</Box>
            </Tooltip>
        ) : isAnnotated && annotation ? (
            <Tooltip
                title={<Box sx={styles.preWrap}>{annotation.text}</Box>}
                placement="top"
            >
                <Box sx={styles.allSpace}>{cell.getValue() as string}</Box>
            </Tooltip>
        ) : (
            renderedCell
        );

    return (
        <TableCell
            key={cell.id}
            sx={cellStyle}
            onClick={() => handleCellClick(rowIndex, cell.column.id)}
            onMouseDown={() => handleMouseDown(rowIndex, cell.column.id)}
            onMouseOver={() => handleMouseOver(rowIndex, cell.column.id)}
            onContextMenu={
                isRowNumber
                    ? undefined
                    : (event) =>
                          handleContextMenu(
                              event,
                              cell.column.id,
                              cell.getValue() as TableRowValue,
                          )
            }
        >
            {renderedContent}
        </TableCell>
    );
};

const DatasetViewUI: React.FC<{
    table: ITable<ITableRow>;
    tableContainerRef: React.RefObject<HTMLDivElement | null>;
    visibleColumns: IColumn<ITableRow, unknown>[];
    leftPinnedColumns: IColumn<ITableRow, unknown>[];
    centerColumns: IColumn<ITableRow, unknown>[];
    virtualPaddingLeft: number | undefined;
    virtualPaddingRight: number | undefined;
    virtualColumns: VirtualItem[];
    virtualRows: VirtualItem[];
    rows: IRow<ITableRow>[];
    highlightedCells: HighlightedCells;
    handleCellClick: (rowIndex: number, columnId: string) => void;
    handleMouseDown: (rowIndex: number | null, columnId: string | null) => void;
    handleMouseOver: (rowIndex: number | null, columnId: string | null) => void;
    handleResizeEnd: () => void;
    handleScroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
    isLoading: boolean;
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
    sorting: ISortingState;
    onSortingChange: (updater: IUpdater<ISortingState>) => void;
    settings: TableSettings;
    handleContextMenu?: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    filteredColumns?: string[];
    containerStyle?: React.CSSProperties;
    annotatedCells?: Map<
        string,
        { text: string | React.ReactElement; color: string }
    > | null;
}> = ({
    table,
    tableContainerRef,
    visibleColumns,
    leftPinnedColumns,
    centerColumns,
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
    handleScroll,
    isLoading,
    settings,
    rowVirtualizer,
    sorting,
    onSortingChange,
    handleContextMenu = (_event, _columnId, _value, _isHeader = false) => {},
    filteredColumns = [],
    containerStyle = undefined,
    annotatedCells = null,
}) => {
    return (
        <Paper
            ref={tableContainerRef}
            sx={containerStyle || getContainerStyle(settings)}
            onScroll={handleScroll}
        >
            <Table sx={{ ...styles.table, width: table.getTotalSize() }}>
                <TableHead sx={styles.header}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            style={styles.headerColumn}
                        >
                            {leftPinnedColumns.map((column) => {
                                const header = headerGroup.headers.find(
                                    (headerItem) => headerItem.id === column.id,
                                );

                                if (!header) {
                                    return null;
                                }

                                return (
                                    <DatasetHeaderCell
                                        key={header.id}
                                        column={column}
                                        header={header}
                                        filteredColumns={filteredColumns}
                                        handleContextMenu={handleContextMenu}
                                        handleMouseDown={handleMouseDown}
                                        handleMouseOver={handleMouseOver}
                                        handleResizeEnd={handleResizeEnd}
                                        onSortingChange={onSortingChange}
                                        settings={settings}
                                        sorting={sorting}
                                        table={table}
                                        usePinningStyles
                                    />
                                );
                            })}
                            {virtualPaddingLeft ? (
                                <TableCell
                                    sx={{
                                        display: 'flex',
                                        width: virtualPaddingLeft,
                                    }}
                                />
                            ) : null}
                            {virtualColumns.map((vc) => {
                                const column = centerColumns[vc.index];
                                const header = headerGroup.headers.find(
                                    (headerItem) => headerItem.id === column.id,
                                );

                                if (!header) {
                                    return null;
                                }

                                return (
                                    <DatasetHeaderCell
                                        key={header.id}
                                        column={column}
                                        header={header}
                                        filteredColumns={filteredColumns}
                                        handleContextMenu={handleContextMenu}
                                        handleMouseDown={handleMouseDown}
                                        handleMouseOver={handleMouseOver}
                                        handleResizeEnd={handleResizeEnd}
                                        onSortingChange={onSortingChange}
                                        settings={settings}
                                        sorting={sorting}
                                        table={table}
                                    />
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
                            const centerCells = row.getCenterVisibleCells();
                            const leftPinnedCells = row
                                .getLeftVisibleCells()
                                .filter(
                                    (cell) =>
                                        !settings.hideRowNumbers ||
                                        cell.column.id !== '#',
                                );
                            const rowAnnotation =
                                annotatedCells?.get(`${virtualRow.index}`) ||
                                null;

                            return (
                                <TableRow
                                    data-index={
                                        settings.dynamicRowHeight
                                            ? virtualRow.index
                                            : undefined
                                    }
                                    ref={(node) => {
                                        if (settings.dynamicRowHeight) {
                                            rowVirtualizer.measureElement(node);
                                        }
                                    }}
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
                                    {leftPinnedCells.map((cell) => {
                                        const isHighlighted =
                                            highlightedCells[
                                                cell.column.id
                                            ]?.includes(virtualRow.index) ||
                                            false;

                                        let annotation: {
                                            text: string | React.ReactElement;
                                            color: string;
                                        } | null = null;
                                        if (annotatedCells) {
                                            const columnIndex =
                                                visibleColumns.findIndex(
                                                    (column) =>
                                                        column.id ===
                                                        cell.column.id,
                                                );
                                            annotation =
                                                annotatedCells?.get(
                                                    `${virtualRow.index}#${columnIndex}`,
                                                ) || null;
                                        }

                                        return (
                                            <DatasetBodyCell
                                                key={cell.id}
                                                annotation={annotation}
                                                cell={cell}
                                                handleCellClick={
                                                    handleCellClick
                                                }
                                                handleContextMenu={
                                                    handleContextMenu
                                                }
                                                handleMouseDown={
                                                    handleMouseDown
                                                }
                                                handleMouseOver={
                                                    handleMouseOver
                                                }
                                                isHighlighted={isHighlighted}
                                                rowAnnotation={rowAnnotation}
                                                rowIndex={virtualRow.index}
                                                settings={settings}
                                                usePinningStyles
                                            />
                                        );
                                    })}
                                    {virtualPaddingLeft ? (
                                        <TableCell
                                            sx={{
                                                display: 'flex',
                                                width: virtualPaddingLeft,
                                            }}
                                        />
                                    ) : null}
                                    {virtualColumns.map((vc) => {
                                        const cell = centerCells[vc.index];

                                        if (!cell) {
                                            return null;
                                        }

                                        const isHighlighted =
                                            highlightedCells[
                                                cell.column.id
                                            ]?.includes(virtualRow.index) ||
                                            false;

                                        let annotation: {
                                            text: string | React.ReactElement;
                                            color: string;
                                        } | null = null;

                                        if (annotatedCells) {
                                            const columnIndex =
                                                visibleColumns.findIndex(
                                                    (visibleColumn) =>
                                                        visibleColumn.id ===
                                                        cell.column.id,
                                                );
                                            annotation =
                                                annotatedCells.get(
                                                    `${virtualRow.index}#${columnIndex}`,
                                                ) || null;
                                        }

                                        return (
                                            <DatasetBodyCell
                                                key={cell.id}
                                                annotation={annotation}
                                                cell={cell}
                                                handleCellClick={
                                                    handleCellClick
                                                }
                                                handleContextMenu={
                                                    handleContextMenu
                                                }
                                                handleMouseDown={
                                                    handleMouseDown
                                                }
                                                handleMouseOver={
                                                    handleMouseOver
                                                }
                                                isHighlighted={isHighlighted}
                                                rowAnnotation={null}
                                                rowIndex={virtualRow.index}
                                                settings={settings}
                                            />
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
