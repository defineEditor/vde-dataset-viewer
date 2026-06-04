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
import { Theme } from '@mui/material/styles';
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

const getContainerStyle =
    (settings: TableSettings) =>
    (theme): React.CSSProperties => {
        const result: React.CSSProperties = {
            overflow: 'auto',
            position: 'relative',
            height: settings.height ? `${settings.height}px` : '100vh',
            userSelect: 'none',
            scrollbarColor: `${theme.vars?.palette.scrollbar.thumb} ${theme.vars?.palette.scrollbar.track}`,
            borderRadius: '0px',
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
        backgroundColor: 'table.header',
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
    tableHeaderCell: (theme) => ({
        padding: 0,
        fontFamily: 'Roboto Mono',
        fontSize: theme.densitySettings.table.fontSize,
        minHeight: theme.densitySettings.table.headerHeight,
        lineHeight: theme.densitySettings.table.headerLineHeight,
        display: 'flex',
        position: 'relative',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: 'table.header',
    }),
    tableHeaderLabel: (theme) => ({
        width: '100%',
        textAlign: 'center',
        fontSize: theme.densitySettings.table.fontSize,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }),
    tableHeaderText: (theme) => ({
        py: theme.densitySettings.mode === 'compact' ? 0.5 : 1,
        pl: theme.densitySettings.mode === 'compact' ? 0.5 : 1,
    }),
    tableCellDynamic: (theme) => ({
        border: '1px solid',
        borderColor: 'grey.300',
        fontFamily: 'Roboto Mono',
        fontSize: theme.densitySettings.table.fontSize,
        whiteSpace: 'pre-wrap',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: theme.densitySettings.table.cellPadding,
        maxHeight: '5em',
    }),
    tableCellFixed: (theme) => ({
        border: '1px solid',
        borderColor: 'grey.300',
        fontFamily: 'Roboto Mono',
        fontSize: theme.densitySettings.table.fontSize,
        whiteSpace: 'pre',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: theme.densitySettings.table.cellPadding,
    }),
    resizer: {
        top: 0,
        position: 'absolute',
        height: '100%',
        right: 0,
        width: '3px',
        backgroundColor: 'table.resizeHandle',
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
        backgroundColor: 'table.highlightedCell',
    },
    annotatedCell: {
        backgroundColor: 'table.annotatedCell',
        border: '1px solid',
        borderColor: 'table.annotatedBorder',
    },
    annotatedRowCell: {
        backgroundColor: 'table.annotatedCell',
        border: '1px solid',
        borderColor: 'table.annotatedBorder',
    },
    highlightedAnnotatedCell: {
        backgroundColor: 'table.highlightedAnnotatedCell',
        border: '1px solid',
        borderColor: 'table.highlightedAnnotatedBorder',
    },
    headerRowNumberCell: {
        justifyContent: 'center',
        fontSize: 'small',
        backgroundColor: 'table.rowNumber',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        maxHeight: '100%',
    },
    rowNumberCell: (theme) => ({
        backgroundColor: 'table.rowNumber',
        fontSize: theme.densitySettings.table.rowNumberFontSize,
        overflow: 'visible',
        padding: theme.densitySettings.table.rowNumberPadding,
        justifyContent: 'center',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        maxHeight: '100%',
        textAlign: 'center',
    }),
    loading: {},
    sponsored: {
        marginTop: '10px',
        fontSize: '14px',
        color: 'text.secondary',
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
    squareIconButton: (theme) => ({
        height: theme.densitySettings.table.headerHeight,
        aspectRatio: '1 / 1',
        minWidth: 0,
        textAlign: 'center',
        flex: 1,
        justifyContent: 'center',
    }),
    allSpace: {
        width: '100%',
        height: '100%',
    },
    preWrap: {
        whiteSpace: 'pre-wrap',
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

type PinningStyle = (theme: Theme) => React.CSSProperties;

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
    pinningStyle?: PinningStyle;
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
    pinningStyle = undefined,
}) => {
    const isRowNumber = column.id === '#';
    const isSorted = sorting.find((sort) => sort.id === header.id);

    const headerCellSx = [
        styles.tableHeaderCell,
        { width: header.getSize() },
        isRowNumber ? styles.headerRowNumberCell : { cursor: 'pointer' },
        usePinningStyles ? pinningStyle || null : null,
        settings.denseHeader ? { height: '30px' } : null,
    ];

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
                        <Stack sx={styles.tableHeaderLabel} direction="row">
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
    annotatedCells: Map<string, AnnotationData> | null;
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
    highlightedCells: Record<string, number[]>;
    rowAnnotation: AnnotationData | null;
    rowIndex: number;
    visibleColumns: IColumn<ITableRow, unknown>[];
    settings: TableSettings;
    usePinningStyles?: boolean;
    pinningStyle?: PinningStyle;
}> = ({
    annotatedCells,
    cell,
    handleCellClick,
    handleContextMenu,
    handleMouseDown,
    handleMouseOver,
    highlightedCells,
    rowAnnotation,
    rowIndex,
    visibleColumns,
    settings,
    usePinningStyles = false,
    pinningStyle = undefined,
}) => {
    const isHighlighted =
        highlightedCells[cell.column.id]?.includes(rowIndex) || false;

    let annotation: {
        text: string | React.ReactElement;
        color: string;
    } | null = null;
    if (annotatedCells) {
        const columnIndex = visibleColumns.findIndex(
            (column) => column.id === cell.column.id,
        );
        annotation = annotatedCells?.get(`${rowIndex}#${columnIndex}`) || null;
    }
    const isRowNumber = cell.column.id === '#';
    const isAnnotated = !!annotation;

    const cellStyle = [
        settings.dynamicRowHeight
            ? styles.tableCellDynamic
            : styles.tableCellFixed,
        { width: cell.column.getSize() },
        isRowNumber ? styles.rowNumberCell : null,
        usePinningStyles ? pinningStyle || null : null,
        isRowNumber && rowAnnotation
            ? styles.annotatedRowCell
            : isAnnotated && isHighlighted
              ? styles.highlightedAnnotatedCell
              : isAnnotated
                ? styles.annotatedCell
                : isHighlighted
                  ? styles.highlightedCell
                  : null,
        cell.column.columnDef.meta?.style || null,
    ];

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
    headerPinningStyles?: Record<string, PinningStyle>;
    bodyPinningStyles?: Record<string, PinningStyle>;
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
    headerPinningStyles = {},
    bodyPinningStyles = {},
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
                                        pinningStyle={
                                            headerPinningStyles[column.id]
                                        }
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
                                        pinningStyle={
                                            headerPinningStyles[column.id]
                                        }
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
                                        return (
                                            <DatasetBodyCell
                                                key={cell.id}
                                                annotatedCells={annotatedCells}
                                                visibleColumns={visibleColumns}
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
                                                highlightedCells={
                                                    highlightedCells
                                                }
                                                rowAnnotation={rowAnnotation}
                                                rowIndex={virtualRow.index}
                                                settings={settings}
                                                usePinningStyles
                                                pinningStyle={
                                                    bodyPinningStyles[
                                                        cell.column.id
                                                    ]
                                                }
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
                                        return (
                                            <DatasetBodyCell
                                                key={cell.id}
                                                annotatedCells={annotatedCells}
                                                visibleColumns={visibleColumns}
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
                                                highlightedCells={
                                                    highlightedCells
                                                }
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
