import React, { useState, useMemo, useCallback, useContext } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContextMenu from 'renderer/components/DatasetView/ContextMenu';
import AppContext from 'renderer/utils/AppContext';
import { ITableRow, IHeaderCell } from 'interfaces/common';
import { Typography, LinearProgress } from '@mui/material';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    createColumnHelper,
    SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import ViewWithSelection from 'renderer/components/DatasetView/ViewWithSelection';
import { useAppSelector } from 'renderer/redux/hooks';

const styles = {
    sectionTitle: {
        '&&': {
            mt: 2,
            mb: 1,
            fontWeight: 'bold',
        },
    },
    getValues: {
        '&&': {
            mt: 1,
            mb: 1,
        },
        height: '100%',
    },
    table: {
        width: '100%',
        height: '40vh',
        overflowX: 'auto',
        boxShadow: 'none',
        userSelect: 'none',
    },
};

const FrequencyCell: React.FC<{ value: number; percentage: number }> = ({
    value,
    percentage,
}) => {
    return (
        <Stack direction="row" spacing={1} alignItems="center" width="100%">
            <Box sx={{ width: '100%', position: 'relative' }}>
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: 20,
                        borderRadius: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: 'primary.main',
                        },
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="caption" color="black">
                        {percentage.toFixed(1)}%
                    </Typography>
                </Box>
            </Box>
            <Typography variant="body2" minWidth="50px">
                {value}
            </Typography>
        </Stack>
    );
};

// Custom cell renderer function (separate from component definition)
const renderFrequencyCell = (info) => (
    <FrequencyCell
        value={info.row.original.count}
        percentage={info.row.original.percentage}
    />
);

const UniqueValues: React.FC<{
    counts: { [value: string]: number };
    hasAllValues: boolean;
    totalRecords: number;
    onGetValues: () => void;
    onClose: () => void;
    columnId: string;
    searchTerm?: string;
}> = ({
    counts,
    hasAllValues,
    onGetValues,
    onClose,
    totalRecords,
    columnId,
    searchTerm = '',
}) => {
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'count', desc: true },
    ]);
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const { apiService } = useContext(AppContext);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    // Transform counts object into array for table
    const data = useMemo(() => {
        const entries = Object.entries(counts);
        let result = entries.map(([value, count], index) => ({
            '#': index + 1,
            value,
            count,
            percentage: (count / totalRecords) * 100,
        }));
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter((row) =>
                String(row.value).toLowerCase().includes(lower),
            );
        }
        return result;
    }, [counts, totalRecords, searchTerm]);

    const columnHelper = createColumnHelper<ITableRow>();

    const valueColumnWidth =
        (tableContainerRef?.current?.clientWidth || 510) - 310;

    const columns = [
        columnHelper.accessor('#', {
            id: '#',
            header: '#',
            size: 1,
        }),
        columnHelper.accessor('value', {
            header: 'Value',
            size: valueColumnWidth,
        }),
        columnHelper.accessor('count', {
            header: 'Frequency',
            size: 250,
            cell: renderFrequencyCell,
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        debugTable: true,
        columnResizeMode: 'onEnd',
        initialState: {
            columnPinning: {
                left: ['#'],
            },
        },
    });

    // Set up row virtualization
    const { rows } = table.getRowModel();
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 38,
        overscan: 15,
    });

    // Get visible columns and set up column virtualization
    const visibleColumns = table.getVisibleLeafColumns();
    const columnVirtualizer = useVirtualizer({
        count: visibleColumns.length - 1, // Exclude the first column
        estimateSize: (index) => visibleColumns[index + 1].getSize(),
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3,
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

    const [contextMenu, setContextMenu] = useState<{
        position: { top: number; left: number };
        value: string | number | boolean | null;
        header: IHeaderCell;
        open: boolean;
        isHeader: boolean;
    }>({
        position: { top: 0, left: 0 },
        value: null,
        header: { id: '', label: '' },
        open: false,
        isHeader: false,
    });

    const handleContextMenu = useCallback(
        (event: React.MouseEvent, rowIndex: number, _columnIndex: number) => {
            event.preventDefault();
            if (rowIndex === -1) return; // Ignore header row

            // In case mask is used, we need to get the index of the column with mask applied
            const header: IHeaderCell = {
                id: columnId,
                label: '',
            };
            const value = data[rowIndex] ? data[rowIndex].value : '';

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header,
                open: true,
                isHeader: false,
            });
        },
        [data, columnId],
    );

    const handleCloseContextMenu = (
        _event: {},
        reason: 'backdropClick' | 'escapeKeyDown' | 'action',
    ) => {
        if (reason === 'action') {
            onClose();
        }
        setContextMenu((prev) => ({ ...prev, open: false }));
    };

    return (
        <Stack direction="column" width="100%" spacing={2}>
            <Stack direction="row" spacing={4}>
                <Typography variant="h6" sx={styles.sectionTitle}>
                    Unique Values {data.length > 0 ? `(${data.length})` : ''}
                </Typography>
                {!hasAllValues && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={styles.getValues}
                    >
                        <Typography variant="caption" color="info">
                            Value list is limited to currently shown data
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={onGetValues}
                            color="primary"
                            aria-label="refresh-data"
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Stack>
                )}
            </Stack>
            <ViewWithSelection
                table={table}
                tableContainerRef={tableContainerRef}
                visibleColumns={visibleColumns}
                virtualPaddingLeft={virtualPaddingLeft}
                virtualPaddingRight={virtualPaddingRight}
                virtualColumns={virtualColumns}
                virtualRows={virtualRows}
                rows={rows}
                isLoading={false}
                dynamicRowHeight={false}
                rowVirtualizer={rowVirtualizer}
                sorting={sorting}
                onSortingChange={setSorting}
                hasPagination={false}
                filteredColumns={[]}
                containerStyle={styles.table}
                hideRowNumbers
                handleContextMenu={handleContextMenu}
            />
            <ContextMenu
                open={contextMenu.open}
                anchorPosition={contextMenu.position}
                onClose={handleCloseContextMenu}
                value={contextMenu.value}
                metadata={metadata}
                header={contextMenu.header}
                isHeader={contextMenu.isHeader}
            />
        </Stack>
    );
};

export default UniqueValues;
