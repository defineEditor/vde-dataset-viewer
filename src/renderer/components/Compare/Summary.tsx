import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAppSelector } from 'renderer/redux/hooks';

const styles = {
    root: {
        p: 2,
        height: '100%',
        overflow: 'auto',
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
        mb: 2,
    },
    table: {
        borderCollapse: 'separate',
    },
    tableCellLabel: {
        borderBottom: 'none',
        pl: 0,
        width: '200px',
    },
    tableCellValue: {
        borderBottom: 'none',
        pr: 0,
    },
};

const Summary: React.FC = () => {
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.datasetDiff,
    );

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
    let maxReachedText = '';
    if (summary && summary.maxDiffReached) {
        maxReachedText = ' * (Max limit reached)';
    }

    return (
        <Box sx={styles.root}>
            {allEqual ? (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Comparison Summary
                    </Typography>
                    <Box sx={styles.successMessage}>
                        <CheckCircleIcon />
                        <Typography>All values are equal</Typography>
                    </Box>
                </Paper>
            ) : (
                <>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Comparison Summary
                        </Typography>
                        <Table
                            size="small"
                            aria-label="comparison-summary"
                            sx={styles.table}
                        >
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={styles.tableCellLabel}>
                                        Total Records Different
                                    </TableCell>
                                    <TableCell sx={styles.tableCellValue}>
                                        {summary.totalDiffs}
                                        {maxReachedText}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={styles.tableCellLabel}>
                                        First Row with Difference
                                    </TableCell>
                                    <TableCell sx={styles.tableCellValue}>
                                        {summary.firstDiffRow !== null
                                            ? summary.firstDiffRow + 1
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={styles.tableCellLabel}>
                                        Last Row with Difference
                                    </TableCell>
                                    <TableCell sx={styles.tableCellValue}>
                                        {summary.lastDiffRow !== null
                                            ? summary.lastDiffRow + 1
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={styles.tableCellLabel}>
                                        Columns with Differences
                                    </TableCell>
                                    <TableCell sx={styles.tableCellValue}>
                                        {sortedColumns.length}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Column Summary
                        </Typography>
                        {metadata.missingInBase.length === 0 &&
                        metadata.missingInCompare.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
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
                                <Typography variant="h6" gutterBottom>
                                    Differences in Columns
                                </Typography>
                                <List dense>
                                    {sortedColumns.map((col) => (
                                        <React.Fragment key={col}>
                                            <ListItem sx={styles.columnItem}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 'bold' }}
                                                >
                                                    {col}
                                                    {summary.maxColDiffReached.includes(
                                                        col,
                                                    ) && ' *'}
                                                </Typography>
                                                <Box>
                                                    {columnsStats[col]
                                                        .dataDiffs > 0 && (
                                                        <Chip
                                                            label={`${columnsStats[col].dataDiffs} data diffs`}
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            sx={styles.chip}
                                                        />
                                                    )}
                                                    {columnsStats[col]
                                                        .metaDiffs > 0 && (
                                                        <Chip
                                                            label={`${columnsStats[col].metaDiffs} meta diffs`}
                                                            size="small"
                                                            color="warning"
                                                            variant="outlined"
                                                            sx={styles.chip}
                                                        />
                                                    )}
                                                </Box>
                                            </ListItem>
                                            <Divider component="li" />
                                        </React.Fragment>
                                    ))}
                                </List>
                            </>
                        )}
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default Summary;
