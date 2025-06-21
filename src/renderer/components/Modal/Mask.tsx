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
    Checkbox,
    FormControlLabel,
    Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { IMask } from 'interfaces/store';
import { closeModal } from 'renderer/redux/slices/ui';
import {
    saveMask,
    selectMask,
    deleteMask,
    clearMask,
} from 'renderer/redux/slices/data';
import { modals } from 'misc/constants';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '80%', lg: '60%', xl: '60%' },
    },
    actions: {
        m: 2,
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
    options: {
        display: 'flex',
        alignItems: 'center',
        mt: 1,
        mb: 2,
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

const Mask: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    const columnNames = metadata?.columns.map((col) => col.name) || [];

    const savedMasks = useAppSelector(
        (state) => state.data.maskData.savedMasks,
    );
    const currentMask = useAppSelector(
        (state) => state.data.maskData.currentMask,
    );

    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [editingMaskId, setEditingMaskId] = useState<string | null>(null);
    const [editingMaskName, setEditingMaskName] = useState<string>('');
    const [sticky, setSticky] = useState<boolean>(
        currentMask !== null ? currentMask?.sticky || false : false,
    );

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.MASK }));
    }, [dispatch]);

    const handleApply = useCallback(() => {
        if (selectedColumns.length > 0) {
            const mask: IMask = {
                name: '',
                id: '',
                sticky,
                columns: selectedColumns,
            };
            dispatch(selectMask(mask));
        }
        handleClose();
    }, [dispatch, selectedColumns, sticky, handleClose]);

    const handleSelectMask = (mask: IMask) => {
        setSelectedColumns(mask.columns);
    };

    const handleStartEditing = (mask: IMask) => {
        setEditingMaskId(mask.id);
        setEditingMaskName(mask.name);
        setSelectedColumns(mask.columns);
    };

    const handleCancelEditing = () => {
        // If it was a new set, remove it
        savedMasks.forEach((mask) => {
            if (mask.id === editingMaskId && mask.name === '') {
                dispatch(deleteMask(mask));
            }
        });
        setEditingMaskId(null);
        setEditingMaskName('');
    };

    const handleSaveNew = () => {
        if (selectedColumns.length === 0) return;

        const mask: IMask = {
            name: '',
            id: '',
            columns: selectedColumns,
        };

        // Generate a unique ID for the new mask
        do {
            mask.id = `mask-${Math.round(Math.random() * 1000000)}`;
        } while (savedMasks.find((savedMask) => savedMask.id === mask.id));

        dispatch(saveMask(mask));
        handleStartEditing(mask);
    };

    const handleSaveEditing = (maskId: string) => {
        let updatedMask = savedMasks.find((mask) => mask.id === maskId);

        if (!editingMaskName.trim() || updatedMask === undefined) return;

        updatedMask = {
            ...updatedMask,
            name: editingMaskName,
            columns: selectedColumns,
        };

        dispatch(saveMask(updatedMask));

        setEditingMaskId(null);
    };

    const handleDeleteMask = (mask: IMask) => {
        dispatch(deleteMask(mask));
    };

    const handleReset = () => {
        dispatch(clearMask());
        handleClose();
    };

    // Initialize with current mask if exists
    useEffect(() => {
        if (currentMask) {
            setSelectedColumns(currentMask.columns);
        }
    }, [currentMask]);

    // Add keyboard shortcut handlers for quick mask selection
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle Ctrl+number keys from 1 to 0
            if (
                event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey
            ) {
                const keyNum = parseInt(event.key, 10);
                // Check if it's a number key from 0-9
                if (!Number.isNaN(keyNum) && keyNum >= 0 && keyNum <= 9) {
                    const maskIndex = keyNum === 0 ? 9 : keyNum - 1;
                    if (savedMasks[maskIndex]) {
                        event.preventDefault();
                        handleSelectMask(savedMasks[maskIndex]);
                        dispatch(selectMask(savedMasks[maskIndex]));
                        handleClose();
                    }
                } else if (event.key === 's' && editingMaskId === null) {
                    handleApply();
                }
            }
        };

        // Add event listener
        window.addEventListener('keydown', handleKeyDown);

        // Remove event listener on cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [savedMasks, dispatch, handleClose, handleApply, editingMaskId]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>Column Visibility</DialogTitle>
            <DialogContent>
                <Box>
                    <Box sx={styles.options}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={sticky}
                                    onChange={(e) =>
                                        setSticky(e.target.checked)
                                    }
                                    name="sticky"
                                />
                            }
                            label="Sticky (persists between dataset changes)"
                        />
                    </Box>
                    <Autocomplete
                        multiple
                        options={columnNames}
                        value={selectedColumns}
                        onChange={(_, newValue) => setSelectedColumns(newValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    label={option}
                                    {...getTagProps({ index })}
                                    sx={
                                        columnNames.includes(option)
                                            ? styles.existingColumn
                                            : styles.nonExistingColumn
                                    }
                                    key={option}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    editingMaskId === null
                                        ? 'Columns'
                                        : `Columns for ${
                                              savedMasks.find(
                                                  (mask) =>
                                                      mask.id === editingMaskId,
                                              )?.name
                                          }`
                                }
                                placeholder="Select columns to display"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {params.InputProps?.endAdornment}
                                            {editingMaskId === null && (
                                                <InputAdornment
                                                    position="end"
                                                    sx={styles.saveNewButton}
                                                >
                                                    <Tooltip title="Save new set (max 10)">
                                                        <IconButton
                                                            onClick={() =>
                                                                handleSaveNew()
                                                            }
                                                            disabled={
                                                                savedMasks.length >=
                                                                    10 ||
                                                                selectedColumns.length ===
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
                                }}
                            />
                        )}
                    />
                </Box>

                {savedMasks.length > 0 && (
                    <>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={styles.setTitle}
                        >
                            Saved Sets
                        </Typography>
                        <List>
                            {savedMasks.map((mask, index) =>
                                editingMaskId === mask.id ? (
                                    <Box
                                        key={mask.id}
                                        sx={styles.editingListItem}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Set Name"
                                            value={editingMaskName}
                                            onChange={(e) =>
                                                setEditingMaskName(
                                                    e.target.value,
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveEditing(mask.id);
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
                                                                            mask.id,
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
                                    <>
                                        <ListItem
                                            key={mask.id}
                                            onClick={() =>
                                                handleSelectMask(mask)
                                            }
                                            component="div"
                                            sx={styles.setItem}
                                            secondaryAction={
                                                <>
                                                    <Tooltip title="Edit set">
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="edit"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartEditing(
                                                                    mask,
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteMask(
                                                                    mask,
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
                                                    mask.name ||
                                                    `Set ${index + 1}`
                                                }
                                                secondary={`${mask.columns.length} columns`}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </>
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

export default Mask;
