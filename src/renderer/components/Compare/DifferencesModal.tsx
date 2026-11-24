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
import LayersIcon from '@mui/icons-material/Layers';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
    openSnackbar,
    setShowAllDifferences,
    setCurrentIssueIndex,
} from '@redux/slices/ui';
import { DatasetDiff } from '@interfaces/main';
import { IUiControl } from '@interfaces/common';
import AppContext from '@utils/AppContext';
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
    collapsibleGroupHeader: {
        backgroundColor: 'action.hover',
        cursor: 'pointer',
    },
    groupHeaderWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        pl: 4,
    },
    groupToggleButton: {
        position: 'absolute',
        left: 0,
    },
    groupHeaderContent: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
    },
    groupCount: {
        color: 'text.secondary',
        fontWeight: 400,
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

interface DiffItem {
    row: number;
    rowBase: number | null;
    rowCompare: number | null;
    col: string;
    base: ItemDataArray[number];
    comp: ItemDataArray[number];
    groupKey: string;
    groupLabel: string;
    groupCompactLabel: string;
}

const formatRowLabel = (
    rowBase: number | null | undefined,
    rowCompare: number | null | undefined,
): string => {
    if (typeof rowBase === 'number' && typeof rowCompare === 'number') {
        return rowBase === rowCompare
            ? `${rowBase + 1}`
            : `${rowBase + 1} / ${rowCompare + 1}`;
    }
    if (typeof rowBase === 'number') {
        return `Base ${rowBase + 1}`;
    }
    if (typeof rowCompare === 'number') {
        return `Comp ${rowCompare + 1}`;
    }
    return '-';
};

const formatGroupLabel = (
    groupColumns: string[],
    groupValues?: ItemDataArray,
): string => {
    if (!groupValues || groupColumns.length === 0) return '';
    return groupColumns
        .map((col, idx) => `${col}: ${groupValues[idx] ?? ''}`)
        .join(', ');
};

const formatGroupCompactLabel = (groupValues?: ItemDataArray): string => {
    if (!groupValues || groupValues.length === 0) return '';
    return groupValues
        .map((val) => (val === null || val === undefined ? '' : String(val)))
        .join(' / ');
};

const formatGroupKey = (groupValues?: ItemDataArray): string => {
    if (!groupValues || groupValues.length === 0) return '__ungrouped__';
    return JSON.stringify(
        groupValues.map((val) =>
            val === null || val === undefined ? null : val,
        ),
    );
};

const formatDiffCopyLine = (diff: DiffItem, includeGroup: boolean): string => {
    const rowText = formatRowLabel(diff.rowBase, diff.rowCompare);
    const groupPrefix =
        includeGroup && diff.groupLabel ? `Group: ${diff.groupLabel}\t` : '';
    const colText = diff.col === 'whole::row' ? 'Whole Row' : diff.col;
    return `${groupPrefix}Row: ${rowText}\tColumn: ${colText}\tBase: ${diff.base}\tCompare: ${diff.comp}`;
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

    const groupColumns = useMemo(
        () => datasetDiff?.groupColumns || [],
        [datasetDiff?.groupColumns],
    );
    const hasGroups = groupColumns.length > 0;

    const [viewMode, setViewMode] = useState<'group' | 'row' | 'column'>(
        hasGroups ? 'group' : 'row',
    );
    const [collapsedGroups, setCollapsedGroups] = useState<
        Record<string, boolean>
    >({});

    useEffect(() => {
        setViewMode(hasGroups ? 'group' : 'row');
        setCollapsedGroups({});
    }, [hasGroups, datasetDiff]);

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

    const allDifferences = useMemo<DiffItem[]>(() => {
        if (!datasetDiff) return [];
        const diffs: DiffItem[] = [];
        datasetDiff.data.modifiedRows.forEach((r) => {
            if (r.diff) {
                const groupKey = formatGroupKey(r.groupValues);
                const groupLabel = formatGroupLabel(
                    groupColumns,
                    r.groupValues,
                );
                const groupCompactLabel = formatGroupCompactLabel(
                    r.groupValues,
                );
                Object.entries(r.diff).forEach(([col, [base, comp]]) => {
                    const rowBase =
                        typeof r.rowBase === 'number' ? r.rowBase : null;
                    const rowCompare =
                        typeof r.rowCompare === 'number' ? r.rowCompare : null;
                    diffs.push({
                        row: rowBase ?? rowCompare ?? 0,
                        rowBase,
                        rowCompare,
                        col,
                        base,
                        comp,
                        groupKey,
                        groupLabel,
                        groupCompactLabel,
                    });
                });
            }
        });
        datasetDiff.data.addedRows.forEach((r) => {
            const rowBase = typeof r.rowBase === 'number' ? r.rowBase : null;
            const rowCompare =
                typeof r.rowCompare === 'number' ? r.rowCompare : null;
            diffs.push({
                row: rowBase ?? rowCompare ?? 0,
                rowBase,
                rowCompare,
                col: 'whole::row',
                base: rowBase === null ? 'Row Missing' : '',
                comp: rowCompare === null ? 'Row Missing' : '',
                groupKey: formatGroupKey(r.groupValues),
                groupLabel: formatGroupLabel(groupColumns, r.groupValues),
                groupCompactLabel: formatGroupCompactLabel(r.groupValues),
            });
        });
        datasetDiff.data.deletedRows.forEach((r) => {
            const rowBase = typeof r.rowBase === 'number' ? r.rowBase : null;
            const rowCompare =
                typeof r.rowCompare === 'number' ? r.rowCompare : null;
            diffs.push({
                row: rowBase ?? rowCompare ?? 0,
                rowBase,
                rowCompare,
                col: 'whole::row',
                base: rowBase === null ? 'Row Missing' : '',
                comp: rowCompare === null ? 'Row Missing' : '',
                groupKey: formatGroupKey(r.groupValues),
                groupLabel: formatGroupLabel(groupColumns, r.groupValues),
                groupCompactLabel: formatGroupCompactLabel(r.groupValues),
            });
        });
        return diffs;
    }, [datasetDiff, groupColumns]);

    const handleGoTo = (row: number, column?: string) => {
        // Find index of this difference
        const diffRows = new Set<number>();
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
                String(d.comp).toLowerCase().includes(lowSearch) ||
                d.groupLabel.toLowerCase().includes(lowSearch) ||
                d.groupCompactLabel.toLowerCase().includes(lowSearch),
        );
    }, [allDifferences, searchTerm]);

    const { groupedDifferences, sortedSectionKeys } = useMemo(() => {
        const groups: Record<string, DiffItem[]> = {};
        const insertionOrder: string[] = [];

        filteredDifferences.forEach((d) => {
            let key: string;
            if (viewMode === 'group') {
                key = d.groupKey;
            } else if (viewMode === 'row') {
                key = `${d.rowBase ?? 'null'}|${d.rowCompare ?? 'null'}`;
            } else {
                key = d.col;
            }
            if (!groups[key]) {
                groups[key] = [];
                insertionOrder.push(key);
            }
            groups[key].push(d);
        });

        let sortedKeys: string[];
        if (viewMode === 'row') {
            sortedKeys = insertionOrder.sort((a, b) => {
                const rowA = groups[a][0]?.row ?? 0;
                const rowB = groups[b][0]?.row ?? 0;
                return rowA - rowB;
            });
        } else if (viewMode === 'column') {
            sortedKeys = [...insertionOrder].sort();
        } else {
            // Preserve dataset order for group view
            sortedKeys = insertionOrder;
        }

        return {
            groupedDifferences: groups,
            sortedSectionKeys: sortedKeys,
        };
    }, [filteredDifferences, viewMode]);

    const handleToggleGroup = useCallback((groupKey: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey],
        }));
    }, []);

    const allCollapsed =
        sortedSectionKeys.length > 0 &&
        sortedSectionKeys.every((key) => collapsedGroups[key]);

    const handleToggleAllGroups = useCallback(() => {
        if (allCollapsed) {
            setCollapsedGroups({});
        } else {
            const next: Record<string, boolean> = {};
            sortedSectionKeys.forEach((key) => {
                next[key] = true;
            });
            setCollapsedGroups(next);
        }
    }, [allCollapsed, sortedSectionKeys]);

    const handleCopyItems = useCallback(
        (items: DiffItem[], message: string) => {
            if (items.length === 0) return;
            const text = items
                .map((item) => formatDiffCopyLine(item, hasGroups))
                .join('\n');
            apiService.writeToClipboard(text);
            dispatch(
                openSnackbar({
                    message,
                    type: 'success',
                    props: { duration: 1000 },
                }),
            );
        },
        [apiService, dispatch, hasGroups],
    );

    if (!datasetDiff) {
        if (open) {
            dispatch(setShowAllDifferences(false));
        }
        return null;
    }

    const totalTableCols =
        viewMode === 'group' || (viewMode === 'column' && hasGroups) ? 6 : 5;

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
                            {hasGroups && (
                                <Tooltip title="View differences grouped by group columns">
                                    <ToggleButton value="group">
                                        <LayersIcon fontSize="small" />
                                    </ToggleButton>
                                </Tooltip>
                            )}
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
                        {viewMode === 'group' &&
                            sortedSectionKeys.length > 0 && (
                                <Tooltip
                                    title={
                                        allCollapsed
                                            ? 'Expand all groups'
                                            : 'Collapse all groups'
                                    }
                                >
                                    <IconButton
                                        size="small"
                                        onClick={handleToggleAllGroups}
                                        sx={styles.headerIcon}
                                    >
                                        {allCollapsed ? (
                                            <UnfoldMoreIcon fontSize="small" />
                                        ) : (
                                            <UnfoldLessIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            )}
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
                            onClick={() =>
                                handleCopyItems(
                                    filteredDifferences,
                                    'Copied to clipboard all differences',
                                )
                            }
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
                                {viewMode === 'group' && (
                                    <>
                                        <TableCell>Row</TableCell>
                                        <TableCell>Column</TableCell>
                                    </>
                                )}
                                {viewMode === 'row' && (
                                    <TableCell>Column</TableCell>
                                )}
                                {viewMode === 'column' && (
                                    <>
                                        <TableCell>Row</TableCell>
                                        {hasGroups && (
                                            <TableCell>Group</TableCell>
                                        )}
                                    </>
                                )}
                                <TableCell>Base Value</TableCell>
                                <TableCell>Compare Value</TableCell>
                                <TableCell>Diff</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedSectionKeys.map((sectionKey) => {
                                const sectionItems =
                                    groupedDifferences[sectionKey];
                                const firstItem = sectionItems[0];

                                let sectionTitle = '';
                                if (viewMode === 'group') {
                                    sectionTitle =
                                        firstItem?.groupLabel || 'Group';
                                } else if (viewMode === 'row') {
                                    const rowTitle = `Row ${formatRowLabel(
                                        firstItem?.rowBase ?? null,
                                        firstItem?.rowCompare ?? null,
                                    )}`;
                                    sectionTitle =
                                        hasGroups && firstItem?.groupLabel
                                            ? `${rowTitle} — ${firstItem.groupLabel}`
                                            : rowTitle;
                                } else {
                                    sectionTitle =
                                        sectionKey === 'whole::row'
                                            ? 'Row'
                                            : `Column ${sectionKey}`;
                                }

                                const isGroupView = viewMode === 'group';
                                const isCollapsed =
                                    isGroupView &&
                                    Boolean(collapsedGroups[sectionKey]);

                                return (
                                    <React.Fragment key={sectionKey}>
                                        <TableRow
                                            sx={
                                                isGroupView
                                                    ? styles.collapsibleGroupHeader
                                                    : styles.rowDiffHeader
                                            }
                                            onClick={
                                                isGroupView
                                                    ? () =>
                                                          handleToggleGroup(
                                                              sectionKey,
                                                          )
                                                    : undefined
                                            }
                                        >
                                            <TableCell
                                                colSpan={totalTableCols}
                                                sx={styles.rowHeader}
                                            >
                                                <Stack
                                                    direction="row"
                                                    sx={
                                                        isGroupView
                                                            ? styles.groupHeaderWrapper
                                                            : styles.groupHeaderContent
                                                    }
                                                >
                                                    {isGroupView && (
                                                        <IconButton
                                                            size="small"
                                                            sx={
                                                                styles.groupToggleButton
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleGroup(
                                                                    sectionKey,
                                                                );
                                                            }}
                                                            aria-label={
                                                                isCollapsed
                                                                    ? 'Expand group'
                                                                    : 'Collapse group'
                                                            }
                                                        >
                                                            {isCollapsed ? (
                                                                <ChevronRightIcon fontSize="small" />
                                                            ) : (
                                                                <ExpandMoreIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    )}
                                                    <Typography
                                                        variant="subtitle2"
                                                        component="div"
                                                        sx={
                                                            styles.groupHeaderContent
                                                        }
                                                    >
                                                        <span>
                                                            {sectionTitle}
                                                        </span>
                                                        {isGroupView && (
                                                            <Typography
                                                                component="span"
                                                                variant="subtitle2"
                                                                sx={
                                                                    styles.groupCount
                                                                }
                                                            >
                                                                {`(${sectionItems.length})`}
                                                            </Typography>
                                                        )}
                                                        {sectionKey !==
                                                            'whole::row' && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleCopyItems(
                                                                        sectionItems,
                                                                        `Copied to clipboard ${sectionTitle} differences`,
                                                                    );
                                                                }}
                                                                sx={
                                                                    styles.rowIcon
                                                                }
                                                            >
                                                                <ContentCopyIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        {!isCollapsed &&
                                            sectionItems.map((diff) => {
                                                const isWholeRow =
                                                    diff.col === 'whole::row';
                                                const diffParts = !isWholeRow
                                                    ? diffChars(
                                                          String(diff.base),
                                                          String(diff.comp),
                                                      )
                                                    : [];
                                                const rowLabel = formatRowLabel(
                                                    diff.rowBase,
                                                    diff.rowCompare,
                                                );
                                                const navRow =
                                                    (diff.row || 0) + 1;

                                                return (
                                                    <TableRow
                                                        key={`${diff.rowBase ?? 'n'}-${diff.rowCompare ?? 'n'}-${diff.col}`}
                                                    >
                                                        {viewMode ===
                                                            'group' && (
                                                            <>
                                                                <TableCell>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() =>
                                                                            handleGoTo(
                                                                                navRow,
                                                                                isWholeRow
                                                                                    ? undefined
                                                                                    : diff.col,
                                                                            )
                                                                        }
                                                                        sx={
                                                                            styles.columnButton
                                                                        }
                                                                    >
                                                                        {
                                                                            rowLabel
                                                                        }
                                                                    </Button>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() =>
                                                                            handleGoTo(
                                                                                navRow,
                                                                                isWholeRow
                                                                                    ? undefined
                                                                                    : diff.col,
                                                                            )
                                                                        }
                                                                        sx={
                                                                            styles.columnButton
                                                                        }
                                                                    >
                                                                        {isWholeRow
                                                                            ? 'Whole Row'
                                                                            : diff.col}
                                                                    </Button>
                                                                </TableCell>
                                                            </>
                                                        )}
                                                        {viewMode === 'row' && (
                                                            <TableCell>
                                                                <Button
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleGoTo(
                                                                            navRow,
                                                                            isWholeRow
                                                                                ? undefined
                                                                                : diff.col,
                                                                        )
                                                                    }
                                                                    sx={
                                                                        styles.columnButton
                                                                    }
                                                                >
                                                                    {isWholeRow
                                                                        ? rowLabel
                                                                        : diff.col}
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                        {viewMode ===
                                                            'column' && (
                                                            <>
                                                                <TableCell>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() =>
                                                                            handleGoTo(
                                                                                navRow,
                                                                                isWholeRow
                                                                                    ? undefined
                                                                                    : diff.col,
                                                                            )
                                                                        }
                                                                        sx={
                                                                            styles.columnButton
                                                                        }
                                                                    >
                                                                        {
                                                                            rowLabel
                                                                        }
                                                                    </Button>
                                                                </TableCell>
                                                                {hasGroups && (
                                                                    <TableCell>
                                                                        {
                                                                            diff.groupCompactLabel
                                                                        }
                                                                    </TableCell>
                                                                )}
                                                            </>
                                                        )}
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
                                                                        handleCopyItems(
                                                                            [
                                                                                diff,
                                                                            ],
                                                                            `Copied to clipboard ${diff.col}:${rowLabel} difference`,
                                                                        )
                                                                    }
                                                                >
                                                                    <ContentCopyIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

export default AllDifferencesModal;
