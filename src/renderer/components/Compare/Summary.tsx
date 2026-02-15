import React, { useMemo, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Button,
    Chip,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Stack,
    Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AppContext from 'renderer/utils/AppContext';
import { openNewDataset } from 'renderer/utils/readData';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset, openSnackbar } from 'renderer/redux/slices/ui';
import { addRecent } from 'renderer/redux/slices/data';

const styles = {
    root: {
        p: 2,
        height: '100%',
        overflow: 'hidden',
        flexWrap: 'wrap',
    },
    section: {
        mb: 3,
    },
    chip: {
        ml: 1,
    },
    columnItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.5,
    },
    successMessage: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'success.main',
        my: 2,
    },
    table: {
        borderCollapse: 'separate',
    },
    tableCellLabel: {
        borderBottom: 'none',
        pl: 0,
        width: '300px',
        fontWeight: '500',
        color: 'grey.800',
    },
    tableCellValue: {
        whiteSpace: 'wrap',
        borderBottom: 'none',
        pr: 0,
    },
    tableCellVariableName: {
        fontWeight: 'bold',
        width: '150px',
        borderBottom: 'none',
    },
    summary: {
        p: 2,
        flex: 1,
        minWidth: '300px',
        overflow: 'hidden',
    },
    columnSummary: {
        flex: 1,
        p: 2,
        maxHeight: '100%',
        minWidth: '300px',
        overflow: 'auto',
        paddingBottom: '32px',
    },
    settings: {
        mt: 2,
        p: 2,
        flex: 1,
        overflow: 'hidden',
    },
    booleanIcon: {
        color: 'grey.700',
    },
    pathButton: {
        textTransform: 'none',
        padding: 0,
        minWidth: 0,
    },
};

const settingsLabels = {
    tolerance: 'Tolerance',
    ignoreWhiteSpaces: 'Ignore White Spaces',
    ignorePattern: 'Column Ignore Pattern',
    idColumns: 'ID Columns',
    ignoreColumnCase: 'Ignore Column Case',
    reorderCompareColumns: 'Reorder Compare Columns',
    maxDiffCount: 'Max Differences to Show',
    ignoreValueCase: 'Case Insensitive',
    maxColumnDiffCount: 'Max Differences for Columns',
};

const Summary: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );
    const compareData = useAppSelector(
        (state) => state.data.compare.data[currentCompareId],
    );

    const ignoreColumnCase = useAppSelector(
        (state) => state.settings.compare.ignoreColumnCase,
    );
    const { datasetDiff, fileBase, fileComp } = compareData || {};

    const columnsStats = useMemo(() => {
        if (!datasetDiff) return {};
        const { data, metadata } = datasetDiff;
        const stats: Record<string, { dataDiffs: number; metaDiffs: number }> =
            {};

        // Count data diffs
        data.modifiedRows.forEach((row) => {
            if (row.diff) {
                Object.keys(row.diff).forEach((col) => {
                    if (!stats[col])
                        stats[col] = { dataDiffs: 0, metaDiffs: 0 };
                    stats[col].dataDiffs++;
                });
            }
        });

        // Count metadata diffs
        Object.keys(metadata.attributeDiffs).forEach((col) => {
            if (!stats[col]) stats[col] = { dataDiffs: 0, metaDiffs: 0 };
            stats[col].metaDiffs = Object.keys(
                metadata.attributeDiffs[col],
            ).length;
        });

        return stats;
    }, [datasetDiff]);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const handleOpenDataset = async (filePath: string | number | null) => {
        if (typeof filePath !== 'string') return;
        // Dispatch an event to open the dataset in a new tab
        const newDataInfo = await openNewDataset(apiService, 'local', filePath);
        if (newDataInfo.errorMessage) {
            if (newDataInfo.errorMessage !== 'cancelled') {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: newDataInfo.errorMessage,
                    }),
                );
            }
            return;
        }
        dispatch(
            addRecent({
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                path: newDataInfo.path,
            }),
        );
        dispatch(
            openDataset({
                fileId: newDataInfo.fileId,
                type: newDataInfo.type,
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                mode: 'local',
                totalRecords: newDataInfo.metadata.records,
                currentFileId,
            }),
        );
    };

    if (!datasetDiff) return null;

    const { metadata, summary } = datasetDiff;

    const isDataEqual = summary.totalDiffs === 0;
    const isMetadataEqual =
        metadata.missingInBase.length === 0 &&
        metadata.missingInCompare.length === 0 &&
        Object.keys(metadata.attributeDiffs).length === 0 &&
        Object.keys(metadata.positionDiffs).length === 0 &&
        Object.keys(metadata.dsAttributeDiffs).length === 0;

    const sortedColumns = Object.keys(columnsStats).sort();

    const allEqual = isDataEqual && isMetadataEqual;
    // In case all equal, show a simplified summary
    const summaryNoIssuesData = [
        { label: 'Base File', value: fileBase },
        { label: 'Compare File', value: fileComp },
        { label: 'Base Rows', value: summary.baseRows },
        { label: 'Compare Rows', value: summary.compareRows },
        {
            label: 'Total Records Compared',
            value: summary.totalRowsChecked,
        },
        {
            label: 'Total Columns Compared',
            value: metadata.commonCols.length,
        },
    ];
    let maxReachedText = '';
    if (summary && summary.maxDiffReached) {
        maxReachedText = ' * (Max limit reached)';
    }

    const summaryData = [
        ...summaryNoIssuesData,
        {
            label: 'Total Records Different',
            value: summary.totalDiffs + maxReachedText,
        },
        {
            label: 'First Row with Difference',
            value:
                summary.firstDiffRow !== null ? summary.firstDiffRow + 1 : '-',
        },
        {
            label: 'Last Row with Difference',
            value: summary.lastDiffRow !== null ? summary.lastDiffRow + 1 : '-',
        },
        {
            label: 'Columns with Metadata Differences',
            value: summary.colsWithMetadataDiffs,
        },
        {
            label: 'Columns with Data Differences',
            value: summary.colsWithDataDiffs,
        },
        {
            label: 'Columns with All Data Equal',
            value: summary.colsWithoutDiffs,
        },
    ];

    const settingsData: { label: string; value: string | boolean }[] = [];
    Object.keys(datasetDiff.settings)
        .filter(
            (key) =>
                datasetDiff.settings[key] !== undefined &&
                !(
                    Array.isArray(datasetDiff.settings[key]) &&
                    datasetDiff.settings[key].length === 0
                ),
        )
        .forEach((key) => {
            settingsData.push({
                label: settingsLabels[key] || key,
                value:
                    typeof datasetDiff.settings[key] === 'boolean'
                        ? datasetDiff.settings[key]
                        : String(datasetDiff.settings[key]),
            });
        });

    return (
        <Stack
            sx={styles.root}
            direction="row"
            justifyContent="space-around"
            alignItems="flex-start"
            spacing={2}
            useFlexGap
        >
            {allEqual ? (
                <Paper sx={styles.summary}>
                    <Typography variant="h6" gutterBottom>
                        Comparison Summary
                    </Typography>
                    <Table
                        size="small"
                        aria-label="comparison-summary-no-diffs"
                        sx={styles.table}
                    >
                        <TableBody>
                            {summaryNoIssuesData.map((item) => (
                                <TableRow key={item.label}>
                                    <TableCell sx={styles.tableCellLabel}>
                                        {item.label}
                                    </TableCell>
                                    <TableCell sx={styles.tableCellValue}>
                                        {item.label === 'Base File' ||
                                        item.label === 'Compare File' ? (
                                            <Tooltip title={item.value || ''}>
                                                <Button
                                                    variant="text"
                                                    sx={styles.pathButton}
                                                    onClick={() => {
                                                        handleOpenDataset(
                                                            item.value,
                                                        );
                                                    }}
                                                >
                                                    {item.value}
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            <span>{item.value}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={styles.successMessage}>
                        <CheckCircleIcon />
                        <Typography>Datasets are equal</Typography>
                    </Box>
                </Paper>
            ) : (
                <>
                    <Stack>
                        <Paper sx={styles.summary}>
                            <Typography variant="h6" gutterBottom>
                                Comparison Summary
                            </Typography>
                            <Table
                                size="small"
                                aria-label="comparison-summary"
                                sx={styles.table}
                            >
                                <TableBody>
                                    {summaryData.map((item) => (
                                        <TableRow key={item.label}>
                                            <TableCell
                                                sx={styles.tableCellLabel}
                                            >
                                                {item.label}
                                            </TableCell>
                                            <TableCell
                                                sx={styles.tableCellValue}
                                            >
                                                {item.label === 'Base File' ||
                                                item.label ===
                                                    'Compare File' ? (
                                                    <Tooltip
                                                        title={item.value || ''}
                                                    >
                                                        <Button
                                                            variant="text"
                                                            sx={
                                                                styles.pathButton
                                                            }
                                                            onClick={() => {
                                                                handleOpenDataset(
                                                                    item.value,
                                                                );
                                                            }}
                                                        >
                                                            {item.value}
                                                        </Button>
                                                    </Tooltip>
                                                ) : (
                                                    <span>{item.value}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Paper sx={styles.settings}>
                            <Typography variant="h6" gutterBottom>
                                Comparison Settings
                            </Typography>
                            <Table
                                size="small"
                                aria-label="comparison-settings"
                                sx={styles.table}
                            >
                                <TableBody>
                                    {settingsData.map((item) => (
                                        <TableRow key={item.label}>
                                            <TableCell
                                                sx={styles.tableCellLabel}
                                            >
                                                {item.label}
                                            </TableCell>
                                            <TableCell
                                                sx={styles.tableCellValue}
                                            >
                                                {String(item.value).length >
                                                20 ? (
                                                    <Tooltip
                                                        title={item.value || ''}
                                                    >
                                                        <span>
                                                            {item.value}
                                                        </span>
                                                    </Tooltip>
                                                ) : item.value === true ? (
                                                    <CheckCircleOutlineIcon
                                                        sx={styles.booleanIcon}
                                                    />
                                                ) : item.value === false ? (
                                                    <RadioButtonUncheckedIcon
                                                        sx={styles.booleanIcon}
                                                    />
                                                ) : (
                                                    <span>{item.value}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Stack>

                    <Paper sx={styles.columnSummary}>
                        <Typography variant="h6" gutterBottom>
                            Column Summary
                        </Typography>
                        {metadata.missingInBase.length === 0 &&
                        metadata.missingInCompare.length === 0 &&
                        Object.keys(metadata.positionDiffs).length === 0 ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Base and Compare have the same columns
                            </Typography>
                        ) : (
                            <List dense>
                                {metadata.missingInBase.length > 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary="Columns in Compare and not in Base"
                                            secondary={metadata.missingInBase.join(
                                                ', ',
                                            )}
                                        />
                                    </ListItem>
                                )}
                                {metadata.missingInCompare.length > 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary="Columns in Base and not in Compare"
                                            secondary={metadata.missingInCompare.join(
                                                ', ',
                                            )}
                                        />
                                    </ListItem>
                                )}
                                {metadata.missingInBase.length === 0 &&
                                    metadata.missingInCompare.length === 0 &&
                                    Object.keys(metadata.positionDiffs).length >
                                        0 && (
                                        <ListItem>
                                            <ListItemText
                                                primary="Columns with Position Differences"
                                                secondary={Object.keys(
                                                    metadata.positionDiffs,
                                                )
                                                    .map(
                                                        (col) =>
                                                            `${col} (Base: ${metadata.positionDiffs[col].base}, Compare: ${metadata.positionDiffs[col].compare})`,
                                                    )
                                                    .join(', ')}
                                            />
                                        </ListItem>
                                    )}
                            </List>
                        )}
                        {sortedColumns.length > 0 && (
                            <>
                                <Typography
                                    variant="subtitle1"
                                    component="span"
                                >
                                    Differences in{' '}
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    color="warning"
                                    component="span"
                                >
                                    Data
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    component="span"
                                >
                                    /
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    color="info"
                                    component="span"
                                >
                                    Metadata
                                </Typography>
                                <Table
                                    size="small"
                                    aria-label="comparison-summary"
                                    sx={styles.table}
                                >
                                    <TableBody>
                                        {sortedColumns.map((col) => (
                                            <TableRow key={col}>
                                                <TableCell
                                                    sx={
                                                        styles.tableCellVariableName
                                                    }
                                                >
                                                    {col}
                                                    {summary.maxColDiffReached.includes(
                                                        ignoreColumnCase
                                                            ? col.toLowerCase()
                                                            : col,
                                                    ) && ' *'}
                                                </TableCell>
                                                <TableCell
                                                    sx={styles.tableCellValue}
                                                >
                                                    {columnsStats[col]
                                                        .dataDiffs > 0 && (
                                                        <Chip
                                                            label={`${columnsStats[col].dataDiffs}`}
                                                            size="small"
                                                            color="warning"
                                                            variant="filled"
                                                            sx={styles.chip}
                                                        />
                                                    )}
                                                    {columnsStats[col]
                                                        .metaDiffs > 0 && (
                                                        <Chip
                                                            label={`${columnsStats[col].metaDiffs}`}
                                                            size="small"
                                                            color="info"
                                                            variant="filled"
                                                            sx={styles.chip}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </Paper>
                </>
            )}
        </Stack>
    );
};

export default Summary;
