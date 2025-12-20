import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    IconButton,
    Autocomplete,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Chip,
    Divider,
    InputAdornment,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    closeModal,
    openSnackbar,
    setPathname,
} from 'renderer/redux/slices/ui';
import { addRecentCompare, setCompareData } from 'renderer/redux/slices/data';
import { modals, paths } from 'misc/constants';
import AppContext from 'renderer/utils/AppContext';

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
    fileInput: {
        display: 'flex',
        alignItems: 'center',
        mb: 2,
    },
    shortcutChip: {
        backgroundColor: 'grey.300',
        fontSize: '0.75rem',
        height: 24,
        minWidth: 55,
        fontWeight: 'bold',
        mr: 4,
    },
    setItem: {
        cursor: 'pointer',
        backgroundColor: 'grey.100',
    },
    setTitle: {
        mt: 2,
        textAlign: 'center',
    },
};

const SelectCompare: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const recentCompares = useAppSelector(
        (state) => state.data.compare.recentCompares,
    );

    const [fileBase, setFileBase] = useState<string>('');
    const [fileComp, setFileComp] = useState<string>('');

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.SELECTCOMPARE }));
    }, [dispatch]);

    const handleCompare = useCallback(
        (filePathBase: string, filePathComp: string) => {
            const compare = async () => {
                const result = await apiService.compareDatasets(
                    filePathBase,
                    filePathComp,
                    {},
                    { encoding: 'default', bufferSize: 10000 },
                );
                if ('error' in result) {
                    dispatch(
                        openSnackbar({
                            type: 'error',
                            message: result.error,
                        }),
                    );
                } else {
                    dispatch(
                        setCompareData({
                            fileBase: filePathBase,
                            fileComp: filePathComp,
                            datasetDiff: result,
                        }),
                    );
                    dispatch(
                        addRecentCompare({
                            fileBase: filePathBase,
                            fileComp: filePathComp,
                        }),
                    );
                    dispatch(setPathname({ pathname: paths.COMPARE }));
                    handleClose();
                }
            };
            if (filePathBase && filePathComp) {
                // Initialte compare
                compare();
            }
        },
        [dispatch, handleClose, apiService],
    );

    const handleSelectFile = async (type: 'base' | 'comp') => {
        const result = await apiService.openFileDialog({
            multiple: false,
        });
        if (result && result.length > 0) {
            if (type === 'base') {
                setFileBase(result[0].fullPath);
            } else {
                setFileComp(result[0].fullPath);
            }
        }
    };

    const handleSelectRecent = (recent: {
        fileBase: string;
        fileComp: string;
    }) => {
        setFileBase(recent.fileBase);
        setFileComp(recent.fileComp);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey
            ) {
                const keyNum = parseInt(event.key, 10);
                if (!Number.isNaN(keyNum) && keyNum >= 1 && keyNum <= 5) {
                    const index = keyNum - 1;
                    if (recentCompares[index]) {
                        event.preventDefault();
                        const recent = recentCompares[index];
                        handleCompare(recent.fileBase, recent.fileComp);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [recentCompares, dispatch, handleClose, handleCompare]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>
                Select Files for Comparison
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Box sx={styles.fileInput}>
                        <TextField
                            fullWidth
                            label="Base File"
                            value={fileBase}
                            onChange={(e) => setFileBase(e.target.value)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    handleSelectFile('base')
                                                }
                                            >
                                                <FolderOpenIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Box>
                    <Box sx={styles.fileInput}>
                        <TextField
                            fullWidth
                            label="Compare File"
                            value={fileComp}
                            onChange={(e) => setFileComp(e.target.value)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    handleSelectFile('comp')
                                                }
                                            >
                                                <FolderOpenIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Box>

                    <Autocomplete
                        options={recentCompares}
                        getOptionLabel={(option) =>
                            `${option.fileBase} - ${option.fileComp}`
                        }
                        onChange={(_, newValue) => {
                            if (newValue) {
                                handleSelectRecent(newValue);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Recent Compares"
                                placeholder="Search recent compares..."
                            />
                        )}
                        filterOptions={(options, { inputValue }) => {
                            return options.filter(
                                (option) =>
                                    option.fileBase
                                        .toLowerCase()
                                        .includes(inputValue.toLowerCase()) ||
                                    option.fileComp
                                        .toLowerCase()
                                        .includes(inputValue.toLowerCase()),
                            );
                        }}
                        renderOption={(props, option) => {
                            return (
                                <ListItem {...props}>
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Base: {option.fileBase}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Comp: {option.fileComp}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            );
                        }}
                    />
                </Box>

                {recentCompares.length > 0 && (
                    <>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={styles.setTitle}
                        >
                            Quick Select (Last 5)
                        </Typography>
                        <List>
                            {recentCompares.slice(0, 5).map((recent, index) => (
                                <>
                                    <ListItem
                                        onClick={() =>
                                            handleSelectRecent(recent)
                                        }
                                        component="div"
                                        sx={styles.setItem}
                                    >
                                        <ListItemAvatar>
                                            <Chip
                                                label={`Ctrl+${index + 1}`}
                                                sx={styles.shortcutChip}
                                                size="small"
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`Base: ${recent.fileBase}`}
                                            secondary={`Comp: ${recent.fileComp}`}
                                        />
                                    </ListItem>
                                    <Divider />
                                </>
                            ))}
                        </List>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={() => handleCompare(fileBase, fileComp)}
                    color="primary"
                    variant="contained"
                    disabled={!fileBase || !fileComp}
                >
                    Compare
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectCompare;
