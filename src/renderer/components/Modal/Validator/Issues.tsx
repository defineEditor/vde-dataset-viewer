import React, { useEffect, useContext, useMemo } from 'react';
import {
    Box,
    Stack,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import AppContext from 'renderer/utils/AppContext';
import { IssueSummaryItem } from 'interfaces/core.report';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setGoTo,
    setIssueFilter,
    setShowIssues,
} from 'renderer/redux/slices/ui';
import { setReport } from 'renderer/redux/slices/data';
import getReportTitle from 'renderer/utils/getReportTitle';
import transformReport from 'renderer/components/Validator/Report/transformReport';

const styles = {
    container: {
        padding: 2,
        height: '100%',
        backgroundColor: 'grey.50',
    },
    header: {
        mb: 1,
        p: 1,
    },
    listContainer: {
        overflow: 'auto',
        backgroundColor: 'grey.50',
    },
    listItem: {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        p: 0,
    },
    listItemButton: {
        border: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        px: 2,
        width: 'calc(100% - 48px)',
    },
    noIssues: {
        textAlign: 'center',
        py: 4,
        color: 'text.secondary',
    },
    issueMessage: {
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: 'text.secondary',
        mt: 0.5,
    },
    coreId: {
        fontWeight: 'bold',
        color: 'primary.main',
    },
    primaryContent: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    issueCountChip: {
        scale: 0.8,
    },
    toggleAll: {
        mx: 2,
    },
    searchInput: {
        color: 'text.primary',
    },
    searchIcon: { color: 'text.secondary' },
};

interface IssuesProps {
    datasetName: string;
    fileId: string;
    filteredIssues: string[];
    setFilteredIssues: React.Dispatch<React.SetStateAction<string[]>>;
    onClose: () => void;
}

const Issues: React.FC<IssuesProps> = ({
    datasetName,
    fileId,
    filteredIssues,
    setFilteredIssues,
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    // Handle report loading
    const currentReportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const report = useAppSelector(
        (state) =>
            state.data.validator.reportData[currentReportId || ''] || null,
    );

    useEffect(() => {
        const getReport = async () => {
            if (currentReportId) {
                // Check if report is already loaded;
                if (report) {
                    return;
                }
                const newReport =
                    await apiService.getValidationReport(currentReportId);
                if (newReport === null) {
                    dispatch(
                        openSnackbar({
                            message: 'Validation report could not be loaded',
                            type: 'error',
                        }),
                    );
                } else {
                    // Convert everything to dataset-json format
                    const transformedReport = transformReport(newReport);
                    dispatch(
                        setReport({
                            reportId: currentReportId,
                            report: transformedReport,
                        }),
                    );
                }
            }
        };
        getReport();
    }, [currentReportId, report, apiService, dispatch]);

    // Search functionality
    const [searchTerm, setSearchTerm] = React.useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Handle Ctrl+F keyboard shortcut
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
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

    const basicReport =
        useAppSelector(
            (state) => state.data.validator.reports[currentReportId || ''],
        ) || null;

    // Check if issue can be shown in a dataset
    const allIssueLocations = useMemo(() => {
        if (report === null) {
            return {};
        }
        // Get columns
        const metadata = apiService.getOpenedFileMetadata(fileId);
        let dataColumns: string[] = [];
        if (metadata) {
            dataColumns = metadata.columns.map((col) => col.name);
        }

        // Search for issues which have both row and variable in this dataset
        const locationsArray = report.Issue_Details.filter(
            (issue) => issue.row && issue.variables.length > 0,
        )
            .map((issue) => {
                const row = Number(issue.row);
                const columns: string[] = issue.variables.filter((variable) =>
                    dataColumns.includes(variable),
                );
                return {
                    core_id: issue.core_id,
                    row,
                    columns,
                };
            })
            .filter(
                (issue) => !Number.isNaN(issue.row) && issue.columns.length > 0,
            );

        // Convert to object;
        const result: Record<string, { columns: string[]; row: number }[]> = {};
        locationsArray.forEach((item) => {
            if (!result[item.core_id]) {
                result[item.core_id] = [];
            }
            result[item.core_id].push({ columns: item.columns, row: item.row });
        });

        return result;
    }, [report, fileId, apiService]);

    const issuesWithLocations = Object.keys(allIssueLocations);

    if (report === null) {
        return null;
    }

    const reportTitle = basicReport === null ? '' : getReportTitle(basicReport);

    // Filter issues for the current dataset
    const datasetIssues = report.Issue_Summary.filter(
        (issue: IssueSummaryItem) =>
            issue.dataset.toLowerCase() === datasetName.toLowerCase(),
    );

    // Sort issues by number of occurrences (highest first), then by core_id
    const sortedIssues = datasetIssues.sort((a, b) => {
        return a.core_id.localeCompare(b.core_id);
    });

    // Filter issues based on search term
    const filteredSortedIssues = sortedIssues.filter((issue) => {
        if (!searchTerm) {
            return true;
        }
        const searchLower = searchTerm.toLowerCase();
        return (
            issue.core_id.toLowerCase().includes(searchLower) ||
            issue.message.toLowerCase().includes(searchLower)
        );
    });

    const totalIssues = datasetIssues.reduce(
        (sum, issue) => sum + issue.issues,
        0,
    );

    const toggleFilter = (coreId: string) => {
        if (!filteredIssues.includes(coreId)) {
            setFilteredIssues((prev) => [...prev, coreId]);
        } else {
            setFilteredIssues((prev) => prev.filter((id) => id !== coreId));
        }
    };

    const toggleAll = () => {
        if (filteredIssues.length === 0) {
            setFilteredIssues(sortedIssues.map((issue) => issue.core_id));
        } else {
            setFilteredIssues([]);
        }
    };

    const handleOpenIssue = (coreId: string) => () => {
        const issueLocation = allIssueLocations[coreId][0];

        dispatch(
            setIssueFilter({
                id: fileId,
                filter: [coreId],
            }),
        );
        // Set show issues
        dispatch(
            setShowIssues({
                id: fileId,
                show: true,
            }),
        );
        // Set goto
        dispatch(
            setGoTo({
                row: issueLocation.row,
                column: issueLocation.columns[0],
            }),
        );
        onClose();
    };

    return (
        <Stack spacing={1} sx={styles.container}>
            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box sx={styles.header}>
                    <Typography variant="h4" color="primary.main">
                        {datasetName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {datasetIssues.length} unique issue
                        {datasetIssues.length !== 1 ? 's' : ''} • {totalIssues}{' '}
                        issue{totalIssues !== 1 ? 's' : ''} total
                        {searchTerm && (
                            <span>
                                {' '}
                                • {filteredSortedIssues.length} matching
                            </span>
                        )}
                        {` • ${reportTitle}`}
                    </Typography>
                </Box>
                <Box>
                    <TextField
                        variant="outlined"
                        placeholder="Ctrl + F to search"
                        size="small"
                        inputRef={searchInputRef}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        sx={{ mb: 2 }}
                    />
                    <Tooltip title="Toggle all filters">
                        <IconButton
                            edge="end"
                            onClick={toggleAll}
                            size="small"
                            sx={styles.toggleAll}
                        >
                            {filteredIssues.length === 0 ? (
                                <VisibilityIcon />
                            ) : (
                                <VisibilityOffIcon />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Stack>

            {/* Issues List */}
            <Box sx={styles.listContainer}>
                {sortedIssues.length === 0 ? (
                    <Box sx={styles.noIssues}>
                        <Typography variant="h6">No Issues Found</Typography>
                    </Box>
                ) : filteredSortedIssues.length === 0 ? (
                    <Box sx={styles.noIssues}>
                        <Typography variant="h6">No Matching Issues</Typography>
                        <Typography variant="body2">
                            Try adjusting your search terms
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {filteredSortedIssues.map((issue) => {
                            const hasLocation = issuesWithLocations.includes(
                                issue.core_id,
                            );
                            return (
                                <React.Fragment key={issue.core_id}>
                                    <ListItem
                                        sx={styles.listItem}
                                        secondaryAction={
                                            <Tooltip
                                                title={
                                                    filteredIssues.includes(
                                                        issue.core_id,
                                                    )
                                                        ? 'Hide Issue'
                                                        : 'Show Issue'
                                                }
                                            >
                                                <IconButton
                                                    edge="end"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        toggleFilter(
                                                            issue.core_id,
                                                        );
                                                    }}
                                                    disabled={!hasLocation}
                                                    size="small"
                                                >
                                                    {filteredIssues.includes(
                                                        issue.core_id,
                                                    ) && hasLocation ? (
                                                        <VisibilityOffIcon />
                                                    ) : (
                                                        <VisibilityIcon />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        }
                                    >
                                        <ListItemButton
                                            sx={styles.listItemButton}
                                            onClick={handleOpenIssue(
                                                issue.core_id,
                                            )}
                                            selected={
                                                hasLocation &&
                                                filteredIssues.includes(
                                                    issue.core_id,
                                                )
                                            }
                                            disabled={!hasLocation}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box
                                                        sx={
                                                            styles.primaryContent
                                                        }
                                                    >
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={styles.coreId}
                                                        >
                                                            {issue.core_id}
                                                        </Typography>
                                                        <Chip
                                                            label={issue.issues}
                                                            size="small"
                                                            sx={
                                                                styles.issueCountChip
                                                            }
                                                            color="warning"
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="body2"
                                                        sx={styles.issueMessage}
                                                    >
                                                        {issue.message}
                                                    </Typography>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Stack>
    );
};

export default Issues;
