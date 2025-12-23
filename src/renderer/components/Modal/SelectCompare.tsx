import React, { useContext, useEffect, useCallback } from 'react';
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
    Tooltip,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    closeModal,
    setPathname,
    setCompareFiles,
    setIsComparing,
} from 'renderer/redux/slices/ui';
import { modals, paths } from 'misc/constants';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '70%', lg: '50%', xl: '40%' },
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

    const fileBase = useAppSelector((state) => state.ui.compare.fileBase) || '';
    const fileComp = useAppSelector((state) => state.ui.compare.fileComp) || '';

    const handleSwitch = () => {
        dispatch(setCompareFiles({ fileBase: fileComp, fileComp: fileBase }));
    };

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.SELECTCOMPARE }));
    }, [dispatch]);

    const handleCompare = useCallback(() => {
        dispatch(setPathname({ pathname: paths.COMPARE }));
        dispatch(setIsComparing(true));
        handleClose();
    }, [dispatch, handleClose]);

    const handleSelectFile = async (type: 'base' | 'comp') => {
        const result = await apiService.openFileDialog({
            multiple: false,
        });
        if (result && result.length > 0) {
            if (type === 'base') {
                dispatch(setCompareFiles({ fileBase: result[0].fullPath }));
            } else {
                dispatch(setCompareFiles({ fileComp: result[0].fullPath }));
            }
        }
    };

    const handleSelectRecent = (recent: {
        fileBase: string;
        fileComp: string;
    }) => {
        dispatch(
            setCompareFiles({
                fileBase: recent.fileBase,
                fileComp: recent.fileComp,
            }),
        );
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
                        dispatch(
                            setCompareFiles({
                                fileBase: recent.fileBase,
                                fileComp: recent.fileComp,
                            }),
                        );
                        handleCompare();
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
                            onChange={(e) => {
                                dispatch(
                                    setCompareFiles({
                                        fileBase: e.target.value,
                                    }),
                                );
                            }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <>
                                                <Tooltip title="Switch Base and Compare">
                                                    <IconButton
                                                        onClick={handleSwitch}
                                                    >
                                                        <SwapVertIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Select Base File">
                                                    <IconButton
                                                        onClick={() =>
                                                            handleSelectFile(
                                                                'base',
                                                            )
                                                        }
                                                    >
                                                        <FolderOpenIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
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
                            onChange={(e) => {
                                dispatch(
                                    setCompareFiles({
                                        fileComp: e.target.value,
                                    }),
                                );
                            }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title="Select Compare File">
                                                <IconButton
                                                    onClick={() =>
                                                        handleSelectFile('comp')
                                                    }
                                                >
                                                    <FolderOpenIcon />
                                                </IconButton>
                                            </Tooltip>
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
                    onClick={() => handleCompare()}
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
