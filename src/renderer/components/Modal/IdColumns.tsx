import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    Typography,
    Chip,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Tooltip,
    IconButton,
    InputAdornment,
    Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { closeModal, setDatasetIdColumns } from 'renderer/redux/slices/ui';
import { saveIdColumnSet, deleteIdColumnSet } from 'renderer/redux/slices/data';
import { IIdColumnSet } from 'interfaces/store';
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
    existingColumn: {
        backgroundColor: 'primary.main',
        color: '#ffffff',
    },
    nonExistingColumn: {
        backgroundColor: 'secondary.main',
    },
    editingListItem: {
        padding: '8px 16px',
    },
    saveNewButton: {
        position: 'absolute',
        right: 70,
        top: '50%',
        transform: 'translateY(-50%)',
    },
    setTitle: {
        mt: 2,
        textAlign: 'center',
    },
    setItem: {
        cursor: 'pointer',
        backgroundColor: 'grey.100',
    },
    shortcutChip: {
        backgroundColor: 'grey.300',
        fontSize: '0.75rem',
        height: 24,
        minWidth: 55,
        fontWeight: 'bold',
        mr: 4,
    },
};

interface IdColumnOption {
    id: string;
    label: string;
}

const IdColumns: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentIdCols = useAppSelector(
        (state) => state.ui.control[currentFileId]?.idCols || [],
    );
    const savedSets = useAppSelector(
        (state) => state.data.idColumnData.savedSets,
    );

    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    const columnOptions: IdColumnOption[] =
        metadata?.columns.map((col) => ({
            id: col.name,
            label: col.name,
        })) || [];

    const [idCols, setIdCols] = useState<string[]>(currentIdCols);
    const [editingSetId, setEditingSetId] = useState<string | null>(null);
    const [editingSetName, setEditingSetName] = useState<string>('');

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.IDCOLUMNS }));
    }, [dispatch]);

    const handleApply = useCallback(() => {
        dispatch(
            setDatasetIdColumns({
                fileId: currentFileId,
                idCols,
            }),
        );
        handleClose();
    }, [currentFileId, dispatch, handleClose, idCols]);

    const handleReset = useCallback(() => {
        dispatch(
            setDatasetIdColumns({
                fileId: currentFileId,
                idCols: [],
            }),
        );
        handleClose();
    }, [currentFileId, dispatch, handleClose]);

    useEffect(() => {
        setIdCols(currentIdCols);
    }, [currentIdCols]);

    const handleSelectSet = useCallback((savedSet: IIdColumnSet) => {
        setIdCols(savedSet.columns);
    }, []);

    const handleStartEditing = useCallback((savedSet: IIdColumnSet) => {
        setEditingSetId(savedSet.id);
        setEditingSetName(savedSet.name);
        setIdCols(savedSet.columns);
    }, []);

    const handleCancelEditing = useCallback(() => {
        savedSets.forEach((savedSet) => {
            if (savedSet.id === editingSetId && savedSet.name === '') {
                dispatch(deleteIdColumnSet(savedSet));
            }
        });
        setEditingSetId(null);
        setEditingSetName('');
    }, [dispatch, editingSetId, savedSets]);

    const handleSaveNew = useCallback(() => {
        if (idCols.length === 0) return;

        const savedSet: IIdColumnSet = {
            name: '',
            id: '',
            columns: idCols,
        };

        do {
            savedSet.id = `id-columns-${Math.round(Math.random() * 1000000)}`;
        } while (
            savedSets.find((existingSet) => existingSet.id === savedSet.id)
        );

        dispatch(saveIdColumnSet(savedSet));
        handleStartEditing(savedSet);
    }, [dispatch, handleStartEditing, idCols, savedSets]);

    const handleSaveEditing = useCallback(
        (setId: string) => {
            let updatedSet = savedSets.find(
                (savedSet) => savedSet.id === setId,
            );

            if (!editingSetName.trim() || updatedSet === undefined) return;

            updatedSet = {
                ...updatedSet,
                name: editingSetName,
                columns: idCols,
            };

            dispatch(saveIdColumnSet(updatedSet));
            setEditingSetId(null);
        },
        [dispatch, editingSetName, idCols, savedSets],
    );

    const handleDeleteSet = useCallback(
        (savedSet: IIdColumnSet) => {
            dispatch(deleteIdColumnSet(savedSet));
        },
        [dispatch],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey
            ) {
                const keyNum = parseInt(event.key, 10);
                if (!Number.isNaN(keyNum) && keyNum >= 0 && keyNum <= 9) {
                    const setIndex = keyNum === 0 ? 9 : keyNum - 1;
                    if (savedSets[setIndex]) {
                        event.preventDefault();
                        handleSelectSet(savedSets[setIndex]);
                        dispatch(
                            setDatasetIdColumns({
                                fileId: currentFileId,
                                idCols: savedSets[setIndex].columns,
                            }),
                        );
                        handleClose();
                    }
                } else if (event.key === 's' && editingSetId === null) {
                    event.preventDefault();
                    handleApply();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        currentFileId,
        dispatch,
        editingSetId,
        handleApply,
        handleClose,
        handleSelectSet,
        savedSets,
    ]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>ID Columns</DialogTitle>
            <DialogContent>
                <Box>
                    <Autocomplete
                        multiple
                        sx={styles.field}
                        options={columnOptions}
                        value={idCols.map((item) => {
                            const existingOption = columnOptions.find(
                                (option) => option.id === item,
                            );
                            return (
                                existingOption ?? {
                                    id: item,
                                    label: item,
                                }
                            );
                        })}
                        onChange={(_event, newValue) => {
                            setIdCols(newValue.map((option) => option.id));
                        }}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionLabel={(option) => option.label}
                        renderValue={(value, getItemProps) =>
                            value.map((option, index) => (
                                <Chip
                                    label={option.label}
                                    {...getItemProps({ index })}
                                    sx={
                                        columnOptions.some(
                                            (column) => column.id === option.id,
                                        )
                                            ? styles.existingColumn
                                            : styles.nonExistingColumn
                                    }
                                    key={option.id}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    editingSetId === null
                                        ? 'Columns'
                                        : `Columns for ${
                                              savedSets.find(
                                                  (savedSet) =>
                                                      savedSet.id ===
                                                      editingSetId,
                                              )?.name
                                          }`
                                }
                                placeholder="Select ID columns"
                                fullWidth
                                slotProps={{
                                    ...(params.slotProps ?? {}),
                                    input: {
                                        ...(params.slotProps?.input ?? {}),
                                        endAdornment: (
                                            <>
                                                {
                                                    params.slotProps?.input
                                                        ?.endAdornment
                                                }
                                                {editingSetId === null && (
                                                    <InputAdornment
                                                        position="end"
                                                        sx={
                                                            styles.saveNewButton
                                                        }
                                                    >
                                                        <Tooltip title="Save new set (max 10)">
                                                            <IconButton
                                                                onClick={() =>
                                                                    handleSaveNew()
                                                                }
                                                                disabled={
                                                                    savedSets.length >=
                                                                        10 ||
                                                                    idCols.length ===
                                                                        0
                                                                }
                                                                edge="end"
                                                            >
                                                                <SaveIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )}
                                            </>
                                        ),
                                    },
                                }}
                            />
                        )}
                    />
                </Box>

                {savedSets.length > 0 && (
                    <>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={styles.setTitle}
                        >
                            Saved Sets
                        </Typography>
                        <List>
                            {savedSets.map((savedSet, index) =>
                                editingSetId === savedSet.id ? (
                                    <Box
                                        key={savedSet.id}
                                        sx={styles.editingListItem}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Set Name"
                                            value={editingSetName}
                                            onChange={(event) =>
                                                setEditingSetName(
                                                    event.target.value,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    handleSaveEditing(
                                                        savedSet.id,
                                                    );
                                                }
                                            }}
                                            autoFocus
                                            variant="outlined"
                                            margin="dense"
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <>
                                                            <Tooltip title="Save">
                                                                <IconButton
                                                                    onClick={() =>
                                                                        handleSaveEditing(
                                                                            savedSet.id,
                                                                        )
                                                                    }
                                                                    edge="end"
                                                                >
                                                                    <SaveIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Cancel">
                                                                <IconButton
                                                                    onClick={
                                                                        handleCancelEditing
                                                                    }
                                                                    edge="end"
                                                                >
                                                                    <CancelIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    ),
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <React.Fragment key={savedSet.id}>
                                        <ListItem
                                            onClick={() =>
                                                handleSelectSet(savedSet)
                                            }
                                            component="div"
                                            sx={styles.setItem}
                                            secondaryAction={
                                                <>
                                                    <Tooltip title="Edit set">
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="edit"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                handleStartEditing(
                                                                    savedSet,
                                                                );
                                                            }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete set">
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="delete"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                handleDeleteSet(
                                                                    savedSet,
                                                                );
                                                            }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Chip
                                                    label={`Ctrl+${index === 9 ? 0 : index + 1}`}
                                                    sx={styles.shortcutChip}
                                                    size="small"
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    savedSet.name ||
                                                    `Set ${index + 1}`
                                                }
                                                secondary={`${savedSet.columns.length} columns`}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ),
                            )}
                        </List>
                    </>
                )}
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

export default IdColumns;
