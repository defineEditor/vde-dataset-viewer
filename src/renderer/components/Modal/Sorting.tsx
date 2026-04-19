import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    Chip,
    Box,
    IconButton,
    Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { closeModal, setDatasetSorting } from 'renderer/redux/slices/ui';
import { IUiControl } from 'interfaces/common';
import { modals } from 'misc/constants';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '70%', lg: '50%', xl: '50%' },
    },
    actions: {
        m: 2,
    },
    field: {
        mt: 2,
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    chip: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
        '.MuiChip-deleteIcon': {
            color: 'grey.100',
        },
    },
    chipLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
    },
    chipButton: {
        color: 'grey.100',
        p: 0.25,
    },
};

interface SortingOption {
    id: string;
    label: string;
}

type DatasetSorting = IUiControl['sorting'];

const Sorting: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentSorting = useAppSelector(
        (state) => state.ui.control[currentFileId]?.sorting || [],
    );

    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    const columnOptions: SortingOption[] =
        metadata?.columns.map((col) => ({
            id: col.name,
            label: col.name,
        })) || [];

    const [sorting, setSorting] = useState<DatasetSorting>(currentSorting);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.SORTING }));
    }, [dispatch]);

    const handleApply = useCallback(() => {
        dispatch(
            setDatasetSorting({
                fileId: currentFileId,
                sorting,
            }),
        );
        handleClose();
    }, [dispatch, currentFileId, sorting, handleClose]);

    const handleReset = useCallback(() => {
        dispatch(
            setDatasetSorting({
                fileId: currentFileId,
                sorting: [],
            }),
        );
        handleClose();
    }, [dispatch, currentFileId, handleClose]);

    const handleSortingSelectionChange = useCallback(
        (_: React.SyntheticEvent, newValue: SortingOption[]) => {
            setSorting((previousSorting) =>
                newValue.map((option) => {
                    const existingSort = previousSorting.find(
                        (item) => item.id === option.id,
                    );
                    return {
                        id: option.id,
                        desc: existingSort?.desc || false,
                    };
                }),
            );
        },
        [],
    );

    const handleToggleDirection = useCallback((columnId: string) => {
        setSorting((previousSorting) =>
            previousSorting.map((item) =>
                item.id === columnId ? { ...item, desc: !item.desc } : item,
            ),
        );
    }, []);

    useEffect(() => {
        setSorting(currentSorting);
    }, [currentSorting]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>Sorting</DialogTitle>
            <DialogContent>
                <Autocomplete
                    multiple
                    sx={styles.field}
                    options={columnOptions}
                    value={sorting
                        .map((item) =>
                            columnOptions.find(
                                (option) => option.id === item.id,
                            ),
                        )
                        .filter((option): option is SortingOption => !!option)}
                    onChange={handleSortingSelectionChange}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    getOptionLabel={(option) => option.label}
                    renderValue={(value, getItemProps) =>
                        value.map((option, index) => {
                            const tagProps = getItemProps({ index });
                            const currentSort = sorting.find(
                                (item) => item.id === option.id,
                            );

                            return (
                                <Chip
                                    {...tagProps}
                                    key={option.id}
                                    sx={styles.chip}
                                    label={
                                        <Box sx={styles.chipLabel}>
                                            <span>{option.label}</span>
                                            <Tooltip
                                                title={
                                                    currentSort?.desc
                                                        ? 'Descending'
                                                        : 'Ascending'
                                                }
                                            >
                                                <IconButton
                                                    size="small"
                                                    sx={styles.chipButton}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        handleToggleDirection(
                                                            option.id,
                                                        );
                                                    }}
                                                >
                                                    {currentSort?.desc ? (
                                                        <ArrowDownwardIcon fontSize="inherit" />
                                                    ) : (
                                                        <ArrowUpwardIcon fontSize="inherit" />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Columns"
                            placeholder="Select columns to sort by"
                            fullWidth
                        />
                    )}
                />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleReset} color="primary">
                    Reset
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleApply}
                    color="primary"
                    variant="contained"
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Sorting;
