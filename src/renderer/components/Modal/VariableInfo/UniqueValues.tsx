import React, {
    useState,
    useMemo,
    useCallback,
    useContext,
    useRef,
} from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContextMenu from 'renderer/components/DatasetView/ContextMenu';
import AppContext from 'renderer/utils/AppContext';
import {
    IHeaderCell,
    ITableData,
    DatasetJsonMetadata,
} from 'interfaces/common';
import { Typography, LinearProgress } from '@mui/material';
import DatasetView from 'renderer/components/DatasetView';
import { useAppSelector } from 'renderer/redux/hooks';
import useWidth from 'renderer/components/hooks/useWidth';
import useScrollbarWidth from 'renderer/components/hooks/useScrollbarWidth';

const styles = {
    container: {
        width: '100%',
        height: '100%',
        overflow: 'none',
    },
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
    loading: boolean;
    onGetValues: () => void;
    onClose: () => void;
    columnId: string;
    searchTerm?: string;
}> = ({
    counts,
    hasAllValues,
    onGetValues,
    loading,
    onClose,
    totalRecords,
    columnId,
    searchTerm = '',
}) => {
    const { apiService } = useContext(AppContext);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const datasetMetadata = apiService.getOpenedFileMetadata(currentFileId);
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

    const metadata: DatasetJsonMetadata = useMemo(() => {
        return {
            datasetJSONCreationDateTime: new Date().toISOString(),
            datasetJSONVersion: '1.1',
            records: data.length,
            name: `unique_values`,
            label: 'Unique values',
            columns: [
                {
                    itemOID: 'value',
                    name: 'value',
                    label: 'Value',
                    dataType: 'string',
                },
                {
                    itemOID: 'Frequency',
                    name: 'frequency',
                    label: 'Frequency',
                    dataType: 'string',
                },
            ],
        };
    }, [data]);

    // Form header with dynamic scrollbar width measurement
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = useWidth(containerRef);

    // Use the hook instead of inline measurement
    const scrollbarWidth = useScrollbarWidth();

    // Account for scrollbar width in column sizing
    const header: ITableData['header'] = useMemo(
        () => [
            {
                id: 'value',
                label: 'Value',
                size:
                    (containerWidth || 510) -
                    Math.max(150, containerWidth * 0.3) -
                    scrollbarWidth,
            },
            {
                id: 'frequency',
                label: 'Frequency',
                cell: renderFrequencyCell,
                size: Math.max(150, containerWidth * 0.3),
            },
        ],
        [containerWidth, scrollbarWidth],
    );

    const uniqueValuesData: ITableData = useMemo(() => {
        return {
            header,
            data,
            metadata,
            appliedFilter: null,
            fileId: '',
        };
    }, [data, metadata, header]);

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
            const cellHeader: IHeaderCell = {
                id: columnId,
                label: '',
            };
            const value = data[rowIndex] ? data[rowIndex].value : '';

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header: cellHeader,
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

    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        hideRowNumbers: true,
        showLabel: true,
        width: containerWidth || undefined,
    };

    return (
        <Stack
            direction="column"
            sx={styles.container}
            spacing={2}
            ref={containerRef}
        >
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
            <DatasetView
                key="unique-values"
                tableData={uniqueValuesData}
                isLoading={loading}
                settings={updatedSettings}
                handleContextMenu={handleContextMenu}
                currentPage={1}
                currentMask={null}
            />
            <ContextMenu
                open={contextMenu.open}
                anchorPosition={contextMenu.position}
                onClose={handleCloseContextMenu}
                value={contextMenu.value}
                metadata={datasetMetadata}
                header={contextMenu.header}
                isHeader={contextMenu.isHeader}
            />
        </Stack>
    );
};

export default UniqueValues;
