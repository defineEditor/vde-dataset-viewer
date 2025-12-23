import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAppSelector } from 'renderer/redux/hooks';

const styles = {
    root: {
        p: 2,
        height: '100%',
        overflow: 'auto',
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
    },
    tableCellValue: {
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
    },
    columnSummary: {
        flex: 1,
        p: 2,
        minWidth: '300px',
    },
};

const Summary: React.FC = () => {
    const compareData = useAppSelector((state) => state.data.compare);

    const { datasetDiff, fileBase, fileComp } = compareData;

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

    if (!datasetDiff) return null;

    const { metadata, summary } = datasetDiff;

    const isDataEqual = summary.totalDiffs === 0;
    const isMetadataEqual =
        metadata.missingInBase.length === 0 &&
        metadata.missingInCompare.length === 0 &&
        Object.keys(metadata.attributeDiffs).length === 0 &&
        Object.keys(metadata.dsAttributeDiffs).length === 0;

    const sortedColumns = Object.keys(columnsStats).sort();

    const allEqual = isDataEqual && isMetadataEqual;
    // In case all equal, show a simplified summary
    const summaryNoIssuesData = [
        { label: 'Base File', value: fileBase },
        { label: 'Compare File', value: fileComp },
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
                                        {item.value}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={styles.successMessage}>
                        <CheckCircleIcon />
                        <Typography>All values are equal</Typography>
                    </Box>
                </Paper>
            ) : (
                <>
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
                                        <TableCell sx={styles.tableCellLabel}>
                                            {item.label}
                                        </TableCell>
                                        <TableCell sx={styles.tableCellValue}>
                                            {item.value}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    <Paper sx={styles.columnSummary}>
                        <Typography variant="h6" gutterBottom>
                            Column Summary
                        </Typography>
                        {metadata.missingInBase.length === 0 &&
                        metadata.missingInCompare.length === 0 ? (
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
                                                        col,
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
