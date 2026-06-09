import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useContext,
    useMemo,
} from 'react';
import { diffChars } from 'diff';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Typography,
    Stack,
    TextField,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setShowAllDifferences,
    setCurrentIssueIndex,
} from 'renderer/redux/slices/ui';
import { DatasetDiff } from 'interfaces/main';
import { IUiControl } from 'interfaces/common';
import AppContext from 'renderer/utils/AppContext';
import { ItemDataArray } from 'js-array-filter';

const styles = {
    dialog: {
        maxWidth: '95%',
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '80%', xl: '70%' },
        maxHeight: '90%',
        minHeight: { xs: '95%', sm: '95%', md: '90%', lg: '90%', xl: '85%' },
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    rowHeader: {
        textAlign: 'center',
    },
    columnButton: {
        textTransform: 'none',
        padding: 0,
        minWidth: 0,
    },
    searchInput: (theme: Theme) => ({
        color: theme.vars?.palette.grey[50],
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.alpha(theme.vars?.palette.grey[50]!, 0.5),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars?.palette.grey[50],
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars?.palette.grey[50],
        },
        '&::placeholder': {
            color: theme.alpha(theme.vars?.palette.grey[50]!, 0.7),
        },
    }),
    searchIcon: (theme: Theme) => ({ color: theme.vars?.palette.grey[50] }),
    rowDiffHeader: {
        backgroundColor: 'action.hover',
    },
    headerIcon: {
        color: 'primary.contrastText',
    },
    rowIcon: {
        ml: 1,
    },
    toggleButtonGroup: (theme: Theme) => ({
        height: 32,
        backgroundColor: theme.alpha(theme.vars?.palette.grey[50]!, 0.1),
        color: theme.alpha(theme.vars?.palette.grey[50]!, 0.7),
        borderColor: theme.alpha(theme.vars?.palette.grey[50]!, 0.3),
        '& .MuiToggleButton-root': {
            color: theme.alpha(theme.vars?.palette.grey[50]!, 0.7),
            borderColor: theme.alpha(theme.vars?.palette.grey[50]!, 0.3),
            '&.Mui-selected': {
                color: theme.vars?.palette.primary.main,
                backgroundColor: theme.vars?.palette.grey[100]!,
            },
            '&:hover': {
                color: theme.vars?.palette.primary.light,
                backgroundColor: theme.alpha(
                    theme.vars?.palette.grey[100]!,
                    0.15,
                ),
            },
        },
    }),
    titleHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowCenter: {
        alignItems: 'center',
    },
};

interface AllDifferencesModalProps {
    datasetDiff: DatasetDiff | null;
    handleSetGoTo: (newGoTo: Partial<IUiControl['goTo']>) => void;
}

const AllDifferencesModal: React.FC<AllDifferencesModalProps> = ({
    datasetDiff,
    handleSetGoTo,
}) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const theme = useTheme();

    const open = useAppSelector((state) => state.ui.compare.showAllDifferences);

    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const handleClose = useCallback(() => {
        dispatch(setShowAllDifferences(false));
    }, [dispatch]);

    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
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
    }, [handleClose]);

    const [viewMode, setViewMode] = useState<'row' | 'column'>('row');

    const allDifferences = useMemo(() => {
        if (!datasetDiff) return [];
        const diffs: Array<{
            row: number;
            col: string;
            base: ItemDataArray[number];
            comp: ItemDataArray[number];
        }> = [];
        datasetDiff.data.modifiedRows.forEach((r) => {
            if (r.diff) {
                Object.entries(r.diff).forEach(([col, [base, comp]]) => {
                    diffs.push({
                        row: r.rowBase || 0,
                        col,
                        base,
                        comp,
                    });
                });
            }
        });
        datasetDiff.data.addedRows.forEach((r) => {
            diffs.push({
                row: r.rowBase || r.rowCompare || 0,
                col: 'whole::row',
                base: r.rowBase === null ? 'Row Missing' : '',
                comp: r.rowCompare === null ? 'Row Missing' : '',
            });
        });
        datasetDiff.data.deletedRows.forEach((r) => {
            diffs.push({
                row: r.rowBase || r.rowCompare || 0,
                col: 'whole::row',
                base: r.rowBase === null ? 'Row Missing' : '',
                comp: r.rowCompare === null ? 'Row Missing' : '',
            });
        });
        return diffs;
    }, [datasetDiff]);

    const handleGoTo = (row: number, column?: string) => {
        // Find index of this difference
        const diffRows = new Set();
        allDifferences.forEach((diff) => {
            diffRows.add(diff.row);
        });
        // Get position of the row in the unique diff rows
        const newIndex = Array.from(diffRows).indexOf(row - 1);
        dispatch(
            setCurrentIssueIndex({
                id: currentCompareId,
                index: newIndex,
            }),
        );
        handleSetGoTo({
            row,
            column,
            cellSelection: column !== undefined,
        });
        handleClose();
    };

    const filteredDifferences = useMemo(() => {
        if (!searchTerm.trim()) return allDifferences;
        const lowSearch = searchTerm.toLowerCase();
        return allDifferences.filter(
            (d) =>
                d.col.toLowerCase().includes(lowSearch) ||
                String(d.base).toLowerCase().includes(lowSearch) ||
                String(d.comp).toLowerCase().includes(lowSearch),
        );
    }, [allDifferences, searchTerm]);

    const groupedDifferences = useMemo(() => {
        const groups: Record<string, typeof filteredDifferences> = {};
        filteredDifferences.forEach((d) => {
            const key = viewMode === 'row' ? String(d.row) : d.col;
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });
        return groups;
    }, [filteredDifferences, viewMode]);

    const sortedGroupKeys = useMemo(() => {
        const keys = Object.keys(groupedDifferences);
        if (viewMode === 'row') {
            return keys.sort((a, b) => Number(a) - Number(b));
        }
        return keys.sort();
    }, [groupedDifferences, viewMode]);

    const handleCopy = (row?: number, column?: string) => {
        if (!datasetDiff) return;
        // If row and column are provided, copy that specific cell's diff
        if (row !== undefined && column !== undefined) {
            const rowDiff = datasetDiff.data.modifiedRows.find(
                (r) => r.rowBase === row,
            );
            if (rowDiff && rowDiff.diff && rowDiff.diff[column]) {
                const [baseVal, compVal] = rowDiff.diff[column];
                const diffText = `Row: ${row}\tColumn: ${column}\tBase: ${baseVal}\tCompare: ${compVal}`;
                apiService.writeToClipboard(diffText);
                dispatch(
                    openSnackbar({
                        message: `Copied to clipboard ${column}:${row} difference`,
                        type: 'success',
                        props: { duration: 1000 },
                    }),
                );
                return;
            }
        }

        // If row is specified, copy all diffs for that row
        if (row !== undefined) {
            const rowDiff = datasetDiff.data.modifiedRows.find(
                (r) => r.rowBase === row,
            );
            if (rowDiff && rowDiff.diff) {
                let diffText = '';
                Object.entries(rowDiff.diff).forEach(
                    ([colName, [baseVal, compVal]]) => {
                        diffText += `Row: ${row}\tColumn: ${colName}\tBase: ${baseVal}\tCompare: ${compVal}\n`;
                    },
                );
                apiService.writeToClipboard(diffText);
                dispatch(
                    openSnackbar({
                        message: `Copied to clipboard row ${row + 1} difference`,
                        type: 'success',
                        props: { duration: 1000 },
                    }),
                );
                return;
            }
        }

        // If column is specified, copy all diffs for that column
        if (column !== undefined) {
            let diffText = '';
            datasetDiff.data.modifiedRows.forEach((rowDiff) => {
                if (rowDiff.diff && rowDiff.diff[column]) {
                    const [baseVal, compVal] = rowDiff.diff[column];
                    diffText += `Row: ${rowDiff.rowBase}\tColumn: ${column}\tBase: ${baseVal}\tCompare: ${compVal}\n`;
                }
            });
            if (diffText) {
                apiService.writeToClipboard(diffText);
                dispatch(
                    openSnackbar({
                        message: `Copied to clipboard column ${column} differences`,
                        type: 'success',
                        props: { duration: 1000 },
                    }),
                );
                return;
            }
        }

        // If no specific row/column, copy all differences
        let diffsText = '';
        datasetDiff.data.modifiedRows.forEach((rowDiff) => {
            if (rowDiff.diff) {
                Object.entries(rowDiff.diff).forEach(
                    ([colName, [baseVal, compVal]]) => {
                        diffsText += `Row: ${rowDiff.rowBase}\tColumn: ${colName}\tBase: ${baseVal}\tCompare: ${compVal}\n`;
                    },
                );
            }
        });
        apiService.writeToClipboard(diffsText.trim());
        dispatch(
            openSnackbar({
                message: 'Copied to clipboard all differences',
                type: 'success',
                props: { duration: 1000 },
            }),
        );
    };

    if (!datasetDiff) {
        if (open) {
            dispatch(setShowAllDifferences(false));
        }
        return null;
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slotProps={{ paper: { sx: styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>
                <Stack direction="row" sx={styles.titleHeader}>
                    <Stack direction="row" spacing={2} sx={styles.rowCenter}>
                        <Typography variant="h6">
                            Dataset Differences
                        </Typography>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_e, newView) => {
                                if (newView) setViewMode(newView);
                            }}
                            size="small"
                            sx={styles.toggleButtonGroup}
                        >
                            <Tooltip title="View differences grouped by rows">
                                <ToggleButton value="row">
                                    <ViewListIcon fontSize="small" />
                                </ToggleButton>
                            </Tooltip>
                            <Tooltip title="View differences grouped by columns">
                                <ToggleButton value="column">
                                    <ViewColumnIcon fontSize="small" />
                                </ToggleButton>
                            </Tooltip>
                        </ToggleButtonGroup>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={styles.rowCenter}>
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
                                            <SearchIcon
                                                sx={styles.searchIcon}
                                            />
                                        </InputAdornment>
                                    ),
                                    sx: styles.searchInput,
                                },
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={() => handleCopy()}
                            sx={styles.headerIcon}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={handleClose}
                            sx={styles.headerIcon}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {viewMode === 'row' ? 'Column' : 'Row'}
                                </TableCell>
                                <TableCell>Base Value</TableCell>
                                <TableCell>Compare Value</TableCell>
                                <TableCell>Diff</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedGroupKeys.map((groupKey) => (
                                <React.Fragment key={groupKey}>
                                    <TableRow sx={styles.rowDiffHeader}>
                                        <TableCell
                                            colSpan={5}
                                            sx={styles.rowHeader}
                                        >
                                            <Typography variant="subtitle2">
                                                {viewMode === 'row'
                                                    ? `Row ${Number(groupKey) + 1}`
                                                    : groupKey === 'whole::row'
                                                      ? 'Row'
                                                      : `Column ${groupKey}`}
                                                {groupKey !== 'whole::row' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            viewMode === 'row'
                                                                ? handleCopy(
                                                                      Number(
                                                                          groupKey,
                                                                      ),
                                                                  )
                                                                : handleCopy(
                                                                      undefined,
                                                                      groupKey,
                                                                  )
                                                        }
                                                        sx={styles.rowIcon}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    {groupedDifferences[groupKey].map(
                                        (diff) => {
                                            const isWholeRow =
                                                diff.col === 'whole::row';
                                            const diffParts = !isWholeRow
                                                ? diffChars(
                                                      String(diff.base),
                                                      String(diff.comp),
                                                  )
                                                : [];
                                            return (
                                                <TableRow
                                                    key={`${diff.row}-${diff.col}`}
                                                >
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                handleGoTo(
                                                                    (diff.row ||
                                                                        0) + 1,
                                                                    isWholeRow
                                                                        ? undefined
                                                                        : diff.col,
                                                                )
                                                            }
                                                            sx={
                                                                styles.columnButton
                                                            }
                                                        >
                                                            {viewMode === 'row'
                                                                ? isWholeRow
                                                                    ? diff.row +
                                                                      1
                                                                    : diff.col
                                                                : diff.row + 1}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        {String(diff.base)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {String(diff.comp)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!isWholeRow && (
                                                            <span>
                                                                {diffParts.map(
                                                                    (
                                                                        part,
                                                                        i,
                                                                    ) => {
                                                                        const style =
                                                                            {
                                                                                backgroundColor:
                                                                                    part.added
                                                                                        ? theme.alpha(
                                                                                              theme
                                                                                                  .vars!
                                                                                                  .palette
                                                                                                  .success
                                                                                                  .main,
                                                                                              0.32,
                                                                                          )
                                                                                        : part.removed
                                                                                          ? theme.alpha(
                                                                                                theme
                                                                                                    .vars!
                                                                                                    .palette
                                                                                                    .error
                                                                                                    .main,
                                                                                                0.5,
                                                                                            )
                                                                                          : 'transparent',
                                                                            } as React.CSSProperties;
                                                                        return (
                                                                            <span
                                                                                key={
                                                                                    // eslint-disable-next-line react/no-array-index-key
                                                                                    i
                                                                                }
                                                                                style={
                                                                                    style
                                                                                }
                                                                            >
                                                                                {
                                                                                    part.value
                                                                                }
                                                                            </span>
                                                                        );
                                                                    },
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!isWholeRow && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        diff.row,
                                                                        diff.col,
                                                                    )
                                                                }
                                                            >
                                                                <ContentCopyIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

export default AllDifferencesModal;
