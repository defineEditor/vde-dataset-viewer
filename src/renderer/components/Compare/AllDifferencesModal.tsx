import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { setShowAllDifferences } from 'renderer/redux/slices/ui';
import { DatasetDiff } from 'interfaces/main';
import { IUiControl } from 'interfaces/common';
import { diffChars } from 'diff';

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
    searchInput: {
        color: 'white',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    searchIcon: { color: 'white' },
    rowDiffHeader: {
        backgroundColor: '#f5f5f5',
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
    const open = useAppSelector((state) => state.ui.compare.showAllDifferences);

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

    const handleGoTo = (row: number, column: string) => {
        handleSetGoTo({ row, column, cellSelection: true });
        handleClose();
    };

    if (!datasetDiff) return null;

    const modifiedRowsFiltered = datasetDiff.data.modifiedRows.filter(
        (rowDiff) => {
            if (searchTerm.trim() === '') return true;
            return Object.keys(rowDiff.diff || {}).some(
                (colName) =>
                    colName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (rowDiff.diff || {})[colName]?.some((val) =>
                        String(val)
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                    ),
            );
        },
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slotProps={{ paper: { sx: styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>
                <Stack
                    alignItems="center"
                    justifyContent="space-between"
                    direction="row"
                >
                    <Typography variant="h6">Dataset Differences</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
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
                        <IconButton onClick={handleClose}>
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
                                <TableCell>Column</TableCell>
                                <TableCell>Base Value</TableCell>
                                <TableCell>Compare Value</TableCell>
                                <TableCell>Diff</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modifiedRowsFiltered.map((rowDiff) => (
                                <React.Fragment key={rowDiff.rowBase}>
                                    <TableRow sx={styles.rowDiffHeader}>
                                        <TableCell
                                            colSpan={4}
                                            sx={styles.rowHeader}
                                        >
                                            <Typography variant="subtitle2">
                                                Row {rowDiff.rowBase}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    {rowDiff.diff &&
                                        Object.entries(rowDiff.diff).map(
                                            ([colName, [baseVal, compVal]]) => {
                                                const diffParts = diffChars(
                                                    String(baseVal),
                                                    String(compVal),
                                                );
                                                return (
                                                    <TableRow key={colName}>
                                                        <TableCell>
                                                            <Button
                                                                size="small"
                                                                onClick={() =>
                                                                    handleGoTo(
                                                                        (rowDiff.rowBase ||
                                                                            0) +
                                                                            1,
                                                                        colName,
                                                                    )
                                                                }
                                                                sx={
                                                                    styles.columnButton
                                                                }
                                                            >
                                                                {colName}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell>
                                                            {String(baseVal)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {String(compVal)}
                                                        </TableCell>
                                                        <TableCell>
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
                                                                                        ? 'lightgreen'
                                                                                        : part.removed
                                                                                          ? 'salmon'
                                                                                          : 'transparent',
                                                                            };
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
