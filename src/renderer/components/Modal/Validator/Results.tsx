import React, { useState, useRef, useEffect, useMemo } from 'react';
import AppContext from 'renderer/utils/AppContext';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Stack,
    Box,
    Paper,
    TablePagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { removeValidationReport } from 'renderer/redux/slices/data';
import { ValidationReport } from 'interfaces/common';

const styles = {
    container: {
        p: 2,
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    emptyState: {
        textAlign: 'center',
        mt: 4,
        color: 'text.secondary',
    },
    listContainer: {
        flex: '1 1 auto',
        overflow: 'auto',
    },
    pagination: {
        display: 'flex',
        flex: '0 1 auto',
        justifyContent: 'flex-end',
        mt: 1,
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
    listContentContainer: {
        flexGrow: 1,
        minHeight: 0,
        overflowY: 'auto',
    },
    paginationPaper: {
        mt: 'auto',
        borderTop: 1,
        borderRadius: 0,
        borderColor: 'divider',
    },
};

interface ResultsProps {
    filePaths?: string[];
}

const Results: React.FC<ResultsProps> = ({ filePaths = [] }) => {
    const dispatch = useAppDispatch();
    const allReports = useAppSelector((state) => state.data.validator.reports);
    const reports = useMemo(() => {
        // Keep only those reports, which have include all the file paths
        if (!filePaths || filePaths.length === 0) {
            return allReports; // No filtering if no file paths provided
        }
        return allReports.filter((report) => {
            const reportFiles = report.files.map((file) => file.file);
            if (reportFiles.length < filePaths.length) {
                return false; // Report doesn't include all file paths
            }
            // Check if all file paths match
            return filePaths.every((file) => reportFiles.includes(file));
        });
    }, [allReports, filePaths]);

    const { apiService } = React.useContext(AppContext);

    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Calculate items per page based on container height
    useEffect(() => {
        const calculateItemsPerPage = () => {
            if (listContainerRef.current) {
                const containerHeight =
                    listContainerRef.current.clientHeight - 16 - 20; // Subtract padding/margin
                const itemHeight = 80; // Each list item with margin is 80px
                const calculatedItems = Math.floor(
                    containerHeight / itemHeight,
                );
                // Ensure at least 1 item is shown, and maximum reasonable limit
                const newItemsPerPage = Math.max(
                    1,
                    Math.min(calculatedItems, 50),
                );
                setItemsPerPage(newItemsPerPage);
                // Reset page if current page would be invalid
                if (page > 0) {
                    const maxPage = Math.max(
                        0,
                        Math.ceil(reports.length / newItemsPerPage) - 1,
                    );
                    if (page > maxPage) {
                        setPage(maxPage);
                    }
                }
            }
        };

        // Calculate on mount and when container size might change
        calculateItemsPerPage();

        // Add resize observer to recalculate when container size changes
        const resizeObserver = new ResizeObserver(calculateItemsPerPage);
        if (listContainerRef.current) {
            resizeObserver.observe(listContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [reports.length, page]);

    const handleChangePage = (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleDeleteReport = async (index: number) => {
        dispatch(removeValidationReport({ index }));
        const deleteResult = await apiService.deleteValidationReport(
            reports[index].output,
        );
        if (deleteResult === false) {
            dispatch(
                openSnackbar({
                    message: `Error deleting report`,
                    type: 'error',
                }),
            );
        } else {
            dispatch(
                openSnackbar({
                    message: 'Validation report deleted',
                    type: 'success',
                }),
            );
        }

        // Reset page to 0 if current page would be empty after deletion
        const newTotalReports = reports.length - 1;
        const maxPage = Math.max(
            0,
            Math.ceil(newTotalReports / itemsPerPage) - 1,
        );
        if (page > maxPage) {
            setPage(maxPage);
        }
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

    if (reports.length === 0) {
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

    // Get sorted reports for pagination
    const sortedReports = reports.slice().sort((a, b) => b.date - a.date);

    const totalReports = sortedReports.length;
    const paginatedReports = sortedReports.slice(
        page * itemsPerPage,
        page * itemsPerPage + itemsPerPage,
    );

    return (
        <Box sx={styles.container}>
            <Typography variant="h6" gutterBottom>
                Validation Results ({reports.length})
            </Typography>
            <Box ref={listContainerRef} sx={styles.listContentContainer}>
                <List>
                    {paginatedReports.map((report, _displayIndex) => {
                        const actualIndex = sortedReports.indexOf(report);
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

                        // Use first 5 dataset names and add (+ X more) if applicable
                        const datasetNames = report.files
                            ? report.files
                                  .slice(0, 5)
                                  .map((file) =>
                                      file.file
                                          .replace(
                                              /.*(?:\/|\\)(.*)\.\w+$/,
                                              '$1',
                                          )
                                          .toUpperCase(),
                                  )
                                  .join(', ')
                            : '';
                        const additionalCount =
                            report.files && report.files.length > 5
                                ? ` (+${report.files.length - 5} more)`
                                : '';

                        const reportTitle =
                            `${datasetNames}${additionalCount || ''} ` +
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
                                                handleDeleteReport(actualIndex)
                                            }
                                            size="small"
                                            color="default"
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
            {totalReports > itemsPerPage && (
                <Paper elevation={0} sx={styles.paginationPaper}>
                    <TablePagination
                        component="div"
                        count={totalReports}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={itemsPerPage}
                        rowsPerPageOptions={[]}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default Results;
