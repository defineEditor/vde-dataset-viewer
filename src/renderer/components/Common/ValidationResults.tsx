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
    TextField,
    InputAdornment,
    TablePagination,
    Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
    openSnackbar,
    setValidationReport,
    setValidationTab,
    setPathname,
    closeModal,
} from 'renderer/redux/slices/ui';
import {
    removeValidationReport,
    setReportLastSaveFolder,
} from 'renderer/redux/slices/data';
import { ValidationReport } from 'interfaces/common';
import { paths, modals } from 'misc/constants';

const styles = {
    container: {
        p: 0,
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
        backgroundColor: 'grey.200',
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
    title: {
        px: 2,
        pt: 2,
        flex: '1 1 1%',
        minHeight: 60,
        overflowY: 'auto',
    },
    listContentContainer: {
        px: 2,
        pb: 1,
        flex: '1 1 99%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
    },
    paginationPaper: {
        backgroundColor: 'grey.200',
        borderTop: 1,
        borderRadius: 0,
        borderColor: 'divider',
    },
    searchInput: {
        color: 'text.primary',
    },
    searchIcon: { color: 'text.secondary' },
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

const getReportTitle = (report: ValidationReport): string => {
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
                      .replace(/.*(?:\/|\\)(.*)\.\w+$/, '$1')
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
    return reportTitle;
};

interface ResultsProps {
    filePaths?: string[];
    closeValidationModal?: true;
}

const ValidationResults: React.FC<ResultsProps> = ({
    filePaths = [],
    closeValidationModal = false,
}) => {
    const dispatch = useAppDispatch();
    const allReports = useAppSelector((state) => state.data.validator.reports);
    const reports = useMemo(() => {
        // Keep only those reports, which have include all the file paths
        const result = Object.values(allReports).slice();
        if (!filePaths || filePaths.length === 0) {
            return result.sort((a, b) => b.date - a.date);
        }
        return result
            .filter((report) => {
                const reportFiles = report.files.map((file) => file.file);
                if (reportFiles.length < filePaths.length) {
                    return false; // Report doesn't include all file paths
                }
                // Check if all file paths match
                return filePaths.every((file) => reportFiles.includes(file));
            })
            .sort((a, b) => b.date - a.date);
    }, [allReports, filePaths]);

    const { apiService } = React.useContext(AppContext);

    // Get report titles;
    const reportTitles = useMemo(() => {
        const titles: { [id: string]: string } = {};
        reports.forEach((report) => {
            titles[report.id] = getReportTitle(report);
        });
        return titles;
    }, [reports]);

    // Confirm delete indicator
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Calculate items per page based on container height
    useEffect(() => {
        const calculateItemsPerPage = () => {
            if (listContainerRef.current) {
                const containerHeight =
                    listContainerRef.current.clientHeight - 60; // Subtract padding/margin/pagination
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
            }
        };

        // Calculate on mount and when container size might change
        calculateItemsPerPage();

        window.addEventListener('resize', calculateItemsPerPage);

        return () => {
            window.removeEventListener('resize', calculateItemsPerPage);
        };
    }, [reports.length]);

    const handleChangePage = (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleDeleteReport = async (
        event: React.MouseEvent<HTMLButtonElement>,
        index: number,
    ) => {
        event.stopPropagation();
        dispatch(removeValidationReport({ id: reports[index].id }));
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

    const lastReportSaveFolder = useAppSelector(
        (state) => state.data.validator.lastReportSaveFolder,
    );

    const handleDownloadReport = async (
        event: React.MouseEvent<HTMLButtonElement>,
        index: number,
    ) => {
        event.stopPropagation();
        const downloadResult = await apiService.downloadValidationReport(
            reports[index].output,
            lastReportSaveFolder,
        );
        if (downloadResult === false) {
            dispatch(
                openSnackbar({
                    message: `Error downloading report`,
                    type: 'error',
                }),
            );
        } else if (downloadResult !== '') {
            dispatch(
                openSnackbar({
                    message: 'Validation report downloaded',
                    type: 'success',
                }),
            );
            dispatch(
                setReportLastSaveFolder(downloadResult), // Save last used folder
            );
        }
    };

    const handleOpenReport = (index: number) => {
        dispatch(setValidationReport(reports[index].output));
        dispatch(setValidationTab('report'));
        dispatch(
            setPathname({
                pathname: paths.VALIDATOR,
            }),
        );
        if (closeValidationModal) {
            dispatch(closeModal({ type: modals.VALIDATOR }));
        }
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

    // Handle search
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Focus search input when Ctrl+F is pressed and Columns tab is active
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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

    // Filter reports based on search term
    const filteredReports = reports.filter((report) => {
        if (!searchTerm) {
            return true;
        }
        const title = reportTitles[report.id] || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // If the number of filtered reports is less than current page start, reset to page 0
    if (filteredReports.length <= page * itemsPerPage && page !== 0) {
        setPage(0);
    }

    // Get sorted reports for pagination
    const totalReports = filteredReports.length;
    const paginatedReports = filteredReports.slice(
        page * itemsPerPage,
        page * itemsPerPage + itemsPerPage,
    );

    return (
        <Box sx={styles.container}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={styles.title}
            >
                <Typography variant="h6" gutterBottom>
                    Validation Results ({filteredReports.length})
                </Typography>
                <TextField
                    placeholder="Ctrl + F to search"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    inputRef={searchInputRef}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={styles.searchIcon} />
                                </InputAdornment>
                            ),
                            sx: styles.searchInput,
                        },
                    }}
                />
            </Stack>
            <Box ref={listContainerRef} sx={styles.listContentContainer}>
                <List>
                    {paginatedReports.map((report, _displayIndex) => {
                        const actualIndex = reports.indexOf(report);
                        const datasetCount = getDatasetCount(report);
                        const { uniqueIssues, totalIssues } = report.summary;

                        let comparisonText = '';
                        if (report.summary.changes) {
                            const { newIssues, changedIssues, resolvedIssues } =
                                report.summary.changes;
                            comparisonText = ` (resolved: ${resolvedIssues || 0}, changed: ${changedIssues || 0}, new: ${newIssues || 0})`;
                        }

                        return (
                            <ListItem
                                key={report.date}
                                onClick={() => handleOpenReport(actualIndex)}
                                sx={
                                    uniqueIssues === 0
                                        ? styles.listItemSuccess
                                        : styles.listItem
                                }
                                secondaryAction={
                                    confirmDelete === report.id ? (
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip
                                                title="Cancel Delete"
                                                enterDelay={1000}
                                            >
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete cancel"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setConfirmDelete(null);
                                                    }}
                                                    size="small"
                                                    color="default"
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip
                                                title="Confirm Delete"
                                                enterDelay={1000}
                                            >
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete confirm"
                                                    onClick={(event) =>
                                                        handleDeleteReport(
                                                            event,
                                                            actualIndex,
                                                        )
                                                    }
                                                    size="small"
                                                    color="default"
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    ) : (
                                        <Stack direction="row" spacing={1}>
                                            <Tooltip
                                                title="Save Report"
                                                enterDelay={1000}
                                            >
                                                <IconButton
                                                    edge="end"
                                                    aria-label="download report"
                                                    onClick={(event) =>
                                                        handleDownloadReport(
                                                            event,
                                                            actualIndex,
                                                        )
                                                    }
                                                    size="small"
                                                    color="default"
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip
                                                title="Delete Report"
                                                enterDelay={1000}
                                            >
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete report"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setConfirmDelete(
                                                            report.id,
                                                        );
                                                    }}
                                                    size="small"
                                                    color="default"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    )
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="medium"
                                        >
                                            {reportTitles[report.id]}
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
                        sx={styles.pagination}
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

export default ValidationResults;
