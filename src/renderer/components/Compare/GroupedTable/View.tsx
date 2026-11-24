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
    IconButton,
    Tooltip,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import {
    flexRender,
    type Cell as ICell,
    type Column as IColumn,
    type Header as IHeader,
    type ReactTable,
    type Row as IRow,
} from '@tanstack/react-table';
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import FontDownloadIcon from '@mui/icons-material/FontDownload';
import ExposureIcon from '@mui/icons-material/Exposure';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import AccessTimeIcon from '@mui/icons-material/HourglassFull';
import { TableRowValue, TableSettings } from '@interfaces/common';
import Loading from '@components/Loading';
import type {
    AnnotationData,
    GroupedCompareFeatures,
} from '@components/Compare/GroupedTable/index';
import type {
    GroupedCompareRow,
    GroupMeta,
} from '@components/Compare/GroupedTable/alignGroups';

type GroupedColumn = IColumn<
    GroupedCompareFeatures,
    GroupedCompareRow,
    unknown
>;
type GroupedHeader = IHeader<
    GroupedCompareFeatures,
    GroupedCompareRow,
    unknown
>;
type GroupedCell = ICell<GroupedCompareFeatures, GroupedCompareRow, unknown>;
type GroupedTable = ReactTable<GroupedCompareFeatures, GroupedCompareRow>;
type GroupedRow = IRow<GroupedCompareFeatures, GroupedCompareRow>;
type PinningStyle = (theme: Theme) => React.CSSProperties;

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
            contain: 'layout style paint',
            willChange: 'transform',
        };
        if (settings.width) {
            result.width = `${settings.width}px`;
        }
        return result;
    };

const getLoadingStyle = (settings: TableSettings): React.CSSProperties => ({
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
});

const styles = {
    header: {
        backgroundColor: 'table.header',
        display: 'grid',
        position: 'sticky',
        top: 0,
        zIndex: 5,
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
    tableHeaderContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
        color: 'table.headerTextColor',
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
    groupRowCell: {
        backgroundColor: 'table.header',
    },
    groupRowDiffCell: {
        backgroundColor: 'table.annotatedCell',
        border: '1px solid',
        borderColor: 'table.annotatedBorder',
    },
    placeholderRowCell: {
        backgroundColor: 'grey.100',
        cursor: 'default',
    },
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
        zIndex: 4,
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
        zIndex: 3,
        maxHeight: '100%',
        textAlign: 'center',
    }),
    groupLastCellContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        gap: '4px',
        minWidth: 0,
    },
    groupValueText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        flex: '1 1 auto',
    },
    groupMetaControls: {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        gap: '2px',
    },
    recordCount: {
        fontSize: '0.85em',
        color: 'text.secondary',
    },
    expandButton: {
        padding: '1px',
        width: 20,
        height: 20,
    },
    expandIcon: {
        fontSize: '18px',
    },
    toggleAllButton: {
        padding: '2px',
        ml: '2px',
    },
    typeIcon: {
        fontSize: '16px',
        color: 'grey.600',
        ml: '4px',
    },
    allSpace: {
        width: '100%',
        height: '100%',
    },
    preWrap: {
        whiteSpace: 'pre-wrap',
    },
};

const getTypeIcon = (type: string | undefined) => {
    if (!type) return null;
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

const GroupedHeaderCell: React.FC<{
    column: GroupedColumn;
    header: GroupedHeader;
    isLastGroupColumn: boolean;
    allCollapsed: boolean;
    onToggleAllGroups: () => void;
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    handleResizeEnd: () => void;
    settings: TableSettings;
    table: GroupedTable;
    usePinningStyles?: boolean;
    pinningStyle?: PinningStyle;
}> = ({
    column,
    header,
    isLastGroupColumn,
    allCollapsed,
    onToggleAllGroups,
    handleContextMenu,
    handleResizeEnd,
    settings,
    table,
    usePinningStyles = false,
    pinningStyle = undefined,
}) => {
    const isRowNumber = column.id === '#';
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
                <Box sx={styles.tableHeaderContainer}>#</Box>
            ) : (
                <Tooltip
                    disableFocusListener={!settings.showColumnTooltips}
                    disableHoverListener={!settings.showColumnTooltips}
                    title={
                        <Stack>
                            <Box>
                                {`Name: ${header.column.columnDef.meta?.info?.name}`}
                            </Box>
                            {header.column.columnDef.meta?.info?.label && (
                                <Box>
                                    {`Label: ${header.column.columnDef.meta?.info?.label}`}
                                </Box>
                            )}
                            {header.column.columnDef.meta?.info?.dataType && (
                                <Box>
                                    {`Type: ${header.column.columnDef.meta?.info?.dataType}`}
                                </Box>
                            )}
                            {header.column.columnDef.meta?.info?.length && (
                                <Box>
                                    {`Length: ${header.column.columnDef.meta?.info?.length}`}
                                </Box>
                            )}
                            {header.column.columnDef.meta?.info
                                ?.displayFormat && (
                                <Box>
                                    {`Display Format: ${header.column.columnDef.meta?.info?.displayFormat}`}
                                </Box>
                            )}
                        </Stack>
                    }
                    enterDelay={1000}
                >
                    <Box sx={styles.tableHeaderContainer}>
                        <Stack sx={styles.tableHeaderLabel} direction="row">
                            <Box sx={styles.tableHeaderText}>
                                {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                )}
                            </Box>
                            {settings.showTypeIcons &&
                                getTypeIcon(header.column.columnDef.meta?.type)}
                            {isLastGroupColumn && (
                                <Tooltip
                                    title={
                                        allCollapsed
                                            ? 'Expand all groups'
                                            : 'Collapse all groups'
                                    }
                                >
                                    <IconButton
                                        size="small"
                                        sx={styles.toggleAllButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleAllGroups();
                                        }}
                                    >
                                        {allCollapsed ? (
                                            <UnfoldMoreIcon fontSize="small" />
                                        ) : (
                                            <UnfoldLessIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
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
                                        ? `translateX(${(table.options.columnResizeDirection === 'rtl' ? -1 : 1) * (table.state.columnResizing.deltaOffset ?? 0)}px)`
                                        : '',
                                },
                            }}
                        />
                    </Box>
                </Tooltip>
            )}
        </TableCell>
    );
};

const GroupedBodyCell: React.FC<{
    cell: GroupedCell;
    row: GroupedRow;
    isGroupRow: boolean;
    isPlaceholderRow: boolean;
    groupColSet: Set<string>;
    lastGroupColId: string | null;
    groupMeta: GroupMeta | undefined;
    side: 'base' | 'comp';
    annotatedCells: Map<string, AnnotationData> | null;
    rowAnnotation: AnnotationData | null;
    highlightedCell: { rowId: string; columnId: string } | null;
    handleCellClick: (rowId: string, columnId: string) => void;
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    settings: TableSettings;
    usePinningStyles?: boolean;
    pinningStyle?: PinningStyle;
}> = ({
    cell,
    row,
    isGroupRow,
    isPlaceholderRow,
    groupColSet,
    lastGroupColId,
    groupMeta,
    side,
    annotatedCells,
    rowAnnotation,
    highlightedCell,
    handleCellClick,
    handleContextMenu,
    settings,
    usePinningStyles = false,
    pinningStyle = undefined,
}) => {
    const colId = cell.column.id;
    const isRowNumber = colId === '#';
    const isGroupCol = groupColSet.has(colId);
    const isLastGroupCol = colId === lastGroupColId;

    if (isGroupRow) {
        const isMissingOnSide =
            side === 'base'
                ? groupMeta?.missingInBase
                : groupMeta?.missingInCompare;
        const recordCount =
            side === 'base'
                ? (groupMeta?.baseCount ?? row.subRows.length)
                : (groupMeta?.compCount ?? row.subRows.length);
        const hasDiff = groupMeta?.hasDiff ?? false;

        const groupCellSx = [
            settings.dynamicRowHeight
                ? styles.tableCellDynamic
                : styles.tableCellFixed,
            { width: cell.column.getSize() },
            isRowNumber ? styles.rowNumberCell : null,
            usePinningStyles ? pinningStyle || null : null,
            hasDiff ? styles.groupRowDiffCell : styles.groupRowCell,
            cell.column.columnDef.meta?.style || null,
        ];

        const rawGroupValue = isMissingOnSide
            ? ''
            : (row.original[colId] ?? '');
        const displayGroupValue =
            rawGroupValue === null || rawGroupValue === undefined
                ? ''
                : String(rawGroupValue);

        let content: React.ReactNode = null;

        if (isRowNumber) {
            content =
                hasDiff && groupMeta?.tooltip ? (
                    <Tooltip
                        title={
                            <Box sx={styles.preWrap}>{groupMeta.tooltip}</Box>
                        }
                        placement="top"
                    >
                        <Box sx={styles.allSpace} />
                    </Tooltip>
                ) : null;
        } else if (isLastGroupCol) {
            const inner = (
                <Box sx={styles.groupLastCellContent}>
                    <Box sx={styles.groupValueText}>{displayGroupValue}</Box>
                    <Box sx={styles.groupMetaControls}>
                        <Box component="span" sx={styles.recordCount}>
                            {`(${recordCount})`}
                        </Box>
                        <IconButton
                            size="small"
                            sx={styles.expandButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                row.getToggleExpandedHandler()();
                            }}
                            aria-label={
                                row.getIsExpanded()
                                    ? 'Collapse group'
                                    : 'Expand group'
                            }
                        >
                            {row.getIsExpanded() ? (
                                <ExpandMoreIcon sx={styles.expandIcon} />
                            ) : (
                                <ChevronRightIcon sx={styles.expandIcon} />
                            )}
                        </IconButton>
                    </Box>
                </Box>
            );
            content =
                hasDiff && groupMeta?.tooltip ? (
                    <Tooltip
                        title={
                            <Box sx={styles.preWrap}>{groupMeta.tooltip}</Box>
                        }
                        placement="top"
                    >
                        {inner}
                    </Tooltip>
                ) : (
                    inner
                );
        } else if (isGroupCol) {
            content = displayGroupValue;
        }

        return (
            <TableCell
                key={cell.id}
                sx={groupCellSx}
                onClick={() => row.getToggleExpandedHandler()()}
                onContextMenu={
                    isRowNumber || !isGroupCol || isMissingOnSide
                        ? undefined
                        : (event) =>
                              handleContextMenu(
                                  event,
                                  colId,
                                  (row.original[colId] ??
                                      null) as TableRowValue,
                              )
                }
            >
                {content}
            </TableCell>
        );
    }

    if (isPlaceholderRow) {
        const placeholderSx = [
            settings.dynamicRowHeight
                ? styles.tableCellDynamic
                : styles.tableCellFixed,
            { width: cell.column.getSize() },
            isRowNumber ? styles.rowNumberCell : null,
            usePinningStyles ? pinningStyle || null : null,
            styles.placeholderRowCell,
        ];

        return <TableCell key={cell.id} sx={placeholderSx} />;
    }

    const origRowIndex = row.original.vdeOrigRowIndex;
    const annotation =
        !isRowNumber && origRowIndex !== null && annotatedCells
            ? annotatedCells.get(`${origRowIndex}#${colId.toLowerCase()}`) ||
              null
            : null;

    const isAnnotated = !!annotation;
    const isUnmatchedRow = row.original.vdeIsUnmatchedRow;
    const isRowHighlightedDiff = isAnnotated || isUnmatchedRow;
    const isHighlighted =
        highlightedCell !== null &&
        highlightedCell.rowId === row.id &&
        (highlightedCell.columnId === '#' ||
            highlightedCell.columnId === colId);

    const cellStyle = [
        settings.dynamicRowHeight
            ? styles.tableCellDynamic
            : styles.tableCellFixed,
        { width: cell.column.getSize() },
        isRowNumber ? styles.rowNumberCell : null,
        usePinningStyles ? pinningStyle || null : null,
        isRowNumber && (rowAnnotation || isUnmatchedRow)
            ? styles.annotatedCell
            : isRowHighlightedDiff && isHighlighted
              ? styles.highlightedAnnotatedCell
              : isRowHighlightedDiff
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
            onClick={() => handleCellClick(row.id, colId)}
            onContextMenu={
                isRowNumber
                    ? undefined
                    : (event) =>
                          handleContextMenu(
                              event,
                              colId,
                              cell.getValue() as TableRowValue,
                          )
            }
        >
            {renderedContent}
        </TableCell>
    );
};

interface GroupedTableViewProps {
    table: GroupedTable;
    tableContainerRef: React.RefObject<HTMLDivElement | null>;
    leftPinnedColumns: GroupedColumn[];
    centerColumns: GroupedColumn[];
    virtualPaddingLeft: number | undefined;
    virtualPaddingRight: number | undefined;
    virtualColumns: VirtualItem[];
    virtualRows: VirtualItem[];
    rows: GroupedRow[];
    groupColSet: Set<string>;
    lastGroupColId: string | null;
    groupMetaByKey: Map<string, GroupMeta>;
    side: 'base' | 'comp';
    highlightedCell: { rowId: string; columnId: string } | null;
    annotatedCells: Map<string, AnnotationData> | null;
    handleCellClick: (rowId: string, columnId: string) => void;
    handleContextMenu: (
        event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        columnId: string,
        value: TableRowValue,
        isHeader?: boolean,
    ) => void;
    handleResizeEnd: () => void;
    handleScroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
    allCollapsed: boolean;
    onToggleAllGroups: () => void;
    isLoading: boolean;
    settings: TableSettings;
    rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
    headerPinningStyles: Record<string, PinningStyle>;
    bodyPinningStyles: Record<string, PinningStyle>;
}

const GroupedTableView: React.FC<GroupedTableViewProps> = ({
    table,
    tableContainerRef,
    leftPinnedColumns,
    centerColumns,
    virtualPaddingLeft,
    virtualPaddingRight,
    virtualColumns,
    virtualRows,
    rows,
    groupColSet,
    lastGroupColId,
    groupMetaByKey,
    side,
    highlightedCell,
    annotatedCells,
    handleCellClick,
    handleContextMenu,
    handleResizeEnd,
    handleScroll,
    allCollapsed,
    onToggleAllGroups,
    isLoading,
    settings,
    rowVirtualizer,
    headerPinningStyles,
    bodyPinningStyles,
}) => {
    return (
        <Paper
            ref={tableContainerRef}
            sx={getContainerStyle(settings)}
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
                                if (!header) return null;

                                return (
                                    <GroupedHeaderCell
                                        key={header.id}
                                        column={column}
                                        header={header}
                                        isLastGroupColumn={
                                            column.id === lastGroupColId
                                        }
                                        allCollapsed={allCollapsed}
                                        onToggleAllGroups={onToggleAllGroups}
                                        handleContextMenu={handleContextMenu}
                                        handleResizeEnd={handleResizeEnd}
                                        settings={settings}
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
                                if (!header) return null;

                                return (
                                    <GroupedHeaderCell
                                        key={header.id}
                                        column={column}
                                        header={header}
                                        isLastGroupColumn={false}
                                        allCollapsed={allCollapsed}
                                        onToggleAllGroups={onToggleAllGroups}
                                        handleContextMenu={handleContextMenu}
                                        handleResizeEnd={handleResizeEnd}
                                        settings={settings}
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
                            if (!row) return null;

                            const isGroupRow = row.getIsGrouped();
                            const isPlaceholderRow =
                                !isGroupRow && row.original.vdeIsPlaceholderRow;
                            const groupKey = isGroupRow
                                ? String(row.groupingValue ?? '')
                                : row.original.vdeGroupKey;
                            const groupMeta = groupMetaByKey.get(groupKey);

                            const centerCells = row.getCenterVisibleCells();
                            const leftPinnedCells = row
                                .getStartVisibleCells()
                                .filter(
                                    (cell) =>
                                        !settings.hideRowNumbers ||
                                        cell.column.id !== '#',
                                );

                            const origRowIndex = isGroupRow
                                ? null
                                : row.original.vdeOrigRowIndex;
                            const rowAnnotation =
                                origRowIndex !== null && annotatedCells
                                    ? annotatedCells.get(`${origRowIndex}`) ||
                                      null
                                    : null;

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
                                    {leftPinnedCells.map((cell) => (
                                        <GroupedBodyCell
                                            key={cell.id}
                                            cell={cell}
                                            row={row}
                                            isGroupRow={isGroupRow}
                                            isPlaceholderRow={isPlaceholderRow}
                                            groupColSet={groupColSet}
                                            lastGroupColId={lastGroupColId}
                                            groupMeta={groupMeta}
                                            side={side}
                                            annotatedCells={annotatedCells}
                                            rowAnnotation={rowAnnotation}
                                            highlightedCell={highlightedCell}
                                            handleCellClick={handleCellClick}
                                            handleContextMenu={
                                                handleContextMenu
                                            }
                                            settings={settings}
                                            usePinningStyles
                                            pinningStyle={
                                                bodyPinningStyles[
                                                    cell.column.id
                                                ]
                                            }
                                        />
                                    ))}
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
                                        if (!cell) return null;

                                        return (
                                            <GroupedBodyCell
                                                key={cell.id}
                                                cell={cell}
                                                row={row}
                                                isGroupRow={isGroupRow}
                                                isPlaceholderRow={
                                                    isPlaceholderRow
                                                }
                                                groupColSet={groupColSet}
                                                lastGroupColId={lastGroupColId}
                                                groupMeta={groupMeta}
                                                side={side}
                                                annotatedCells={annotatedCells}
                                                rowAnnotation={null}
                                                highlightedCell={
                                                    highlightedCell
                                                }
                                                handleCellClick={
                                                    handleCellClick
                                                }
                                                handleContextMenu={
                                                    handleContextMenu
                                                }
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
                </Box>
            )}
        </Paper>
    );
};

export default GroupedTableView;
