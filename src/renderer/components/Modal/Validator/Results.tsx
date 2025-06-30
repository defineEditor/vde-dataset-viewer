import React from 'react';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Stack,
    Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { removeValidationReport } from 'renderer/redux/slices/data';
import { ValidationReport } from 'interfaces/common';

const styles = {
    container: {
        p: 2,
        height: '100%',
        overflow: 'auto',
    },
    emptyState: {
        textAlign: 'center',
        mt: 4,
        color: 'text.secondary',
    },
    listItem: {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        '&:hover': {
            backgroundColor: 'action.hover',
        },
    },
    listItemSuccess: {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Light green
        '&:hover': {
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
        },
    },
    noIssuesText: {
        color: '#4caf50',
        fontWeight: 'medium',
    },
};

interface ResultsProps {}

const Results: React.FC<ResultsProps> = () => {
    const dispatch = useAppDispatch();
    const validatorData = useAppSelector((state) => state.data.validator);

    const handleDeleteReport = (index: number) => {
        dispatch(removeValidationReport({ index }));
    };

    const handleOpenReport = (_report: ValidationReport) => {
        // TODO: Implement open report functionality
    };

    const getDatasetCount = (report: ValidationReport): number => {
        try {
            // Parse the output to count datasets if it's JSON
            const output = JSON.parse(report.output);
            return output.files?.length || 0;
        } catch {
            // If parsing fails, try to count from files array
            return report.files?.length || 0;
        }
    };

    const getTimeAgo = (date: number): string => {
        const now = new Date();
        const reportDate = new Date(date);
        const diffMs = now.getTime() - reportDate.getTime();

        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 31; // Average month length
        const year = day * 366; // Average year length with leap years

        if (diffMs < minute) {
            return 'just now';
        }
        if (diffMs < hour) {
            const minutes = Math.floor(diffMs / minute);
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        }
        if (diffMs < day) {
            const hours = Math.floor(diffMs / hour);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        if (diffMs < week) {
            const days = Math.floor(diffMs / day);
            return `${days} day${days === 1 ? '' : 's'} ago`;
        }
        if (diffMs < month) {
            const weeks = Math.floor(diffMs / week);
            return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        }
        if (diffMs < year) {
            const months = Math.floor(diffMs / month);
            return `${months} month${months === 1 ? '' : 's'} ago`;
        }
        const years = Math.floor(diffMs / year);
        return `${years} year${years === 1 ? '' : 's'} ago`;
    };

    if (validatorData.reports.length === 0) {
        return (
            <Box sx={styles.container}>
                <Typography variant="h6" gutterBottom>
                    Validation Results
                </Typography>
                <Box sx={styles.emptyState}>
                    <Typography variant="body1">
                        No validation reports available
                    </Typography>
                    <Typography variant="body2">
                        Run a validation to see results here
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={styles.container}>
            <Typography variant="h6" gutterBottom>
                Validation Results ({validatorData.reports.length})
            </Typography>
            <List>
                {validatorData.reports
                    .slice()
                    .sort((a, b) => b.date - a.date)
                    .map((report, index) => {
                        const datasetCount = getDatasetCount(report);
                        const {
                            uniqueIssues,
                            totalIssues,
                            newIssues,
                            changedIssues,
                            resolvedIssues,
                        } = report.summary;
                        const date = new Date(report.date);
                        const reportDate =
                            `${date.getFullYear()}` +
                            `-${String(date.getMonth() + 1).padStart(2, '0')}` +
                            `-${String(date.getDate()).padStart(2, '0')}` +
                            ` ${String(date.getHours()).padStart(2, '0')}:` +
                            `${String(date.getMinutes()).padStart(2, '0')}:` +
                            `${String(date.getSeconds()).padStart(2, '0')}`;

                        const reportTitle =
                            `${reportDate} (${getTimeAgo(report.date)} ago)` ||
                            'Validation Report';

                        const hasComparison =
                            newIssues !== undefined ||
                            changedIssues !== undefined ||
                            resolvedIssues !== undefined;
                        const comparisonText = hasComparison
                            ? ` (resolved: ${resolvedIssues || 0}, changed: ${changedIssues || 0}, new: ${newIssues || 0})`
                            : '';

                        return (
                            <ListItem
                                key={report.date}
                                sx={
                                    uniqueIssues === 0
                                        ? styles.listItemSuccess
                                        : styles.listItem
                                }
                                secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            edge="end"
                                            aria-label="open report"
                                            onClick={() =>
                                                handleOpenReport(report)
                                            }
                                            size="small"
                                        >
                                            <OpenInNewIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete report"
                                            onClick={() =>
                                                handleDeleteReport(index)
                                            }
                                            size="small"
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="medium"
                                        >
                                            {reportTitle}
                                        </Typography>
                                    }
                                    secondary={
                                        <Stack spacing={0.5}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {uniqueIssues === 0 ? (
                                                    <Box
                                                        sx={styles.noIssuesText}
                                                    >
                                                        No issues found
                                                    </Box>
                                                ) : (
                                                    <>
                                                        Dataset Count:{' '}
                                                        {datasetCount}, Unique
                                                        Issues: {uniqueIssues},
                                                        Total Issues:{' '}
                                                        {totalIssues}
                                                        {comparisonText}
                                                    </>
                                                )}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                            </ListItem>
                        );
                    })}
            </List>
        </Box>
    );
};

export default Results;
