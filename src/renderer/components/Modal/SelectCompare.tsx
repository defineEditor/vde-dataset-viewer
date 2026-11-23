import React, { useContext, useEffect, useCallback, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Stack,
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
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ModalTitle from '@components/Modal/ModalTitle';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
    closeModal,
    setPathname,
    setCompareFiles,
    initializeCompare,
    closeCompare,
    openSnackbar,
} from '@redux/slices/ui';
import { modals, paths } from '@/misc/constants';
import AppContext from '@utils/AppContext';

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
    input: {
        mt: 2,
    },
    flag: {
        mb: 1,
    },
    groupColumn: {
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
    },
};

const SelectCompare: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const recentCompares = useAppSelector(
        (state) => state.data.compare.recentCompares,
    );

    const fileBaseState =
        useAppSelector((state) => state.ui.compare.fileBase) || '';
    const fileCompState =
        useAppSelector((state) => state.ui.compare.fileComp) || '';
    const groupColumnsState =
        useAppSelector((state) => state.ui.compare.groupColumns) || [];

    const ignoreWhiteSpacesSettings = useAppSelector(
        (state) => state.settings.compare.ignoreWhiteSpaces,
    );
    const ignoreValueCaseSettings = useAppSelector(
        (state) => state.settings.compare.ignoreValueCase,
    );
    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const [ignoreWhiteSpaces, setIgnoreWhiteSpaces] = useState<boolean>(
        ignoreWhiteSpacesSettings,
    );
    const [ignoreValueCase, setIgnoreValueCase] = useState<boolean>(
        ignoreValueCaseSettings,
    );
    const [groupColumnsFlag, setGroupColumnsFlag] = useState<boolean>(
        groupColumnsState.length > 0,
    );
    const [groupColumns, setGroupColumns] =
        useState<string[]>(groupColumnsState);
    const [sharedColumns, setSharedColumns] = useState<string[]>([]);

    const [fileComp, setFileComp] = useState<string>(fileCompState);
    const [fileBase, setFileBase] = useState<string>(fileBaseState);

    const resetGroupColumns = useCallback(() => {
        setGroupColumns([]);
    }, []);

    const handleUpdateFileBase = (event) => {
        resetGroupColumns();
        setFileBase(event.target.value);
    };

    const handleUpdateFileComp = (event) => {
        resetGroupColumns();
        setFileComp(event.target.value);
    };

    const handleSwitch = () => {
        setFileBase(fileComp);
        setFileComp(fileBase);
    };

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.SELECTCOMPARE }));
    }, [dispatch]);

    const handleCompare = useCallback(
        (newFileBase: string, newFileComp: string) => {
            // If there is an open compare, close it first
            if (currentCompareId) {
                dispatch(closeCompare({ compareId: currentCompareId }));
            }
            dispatch(
                setCompareFiles({
                    fileBase: newFileBase,
                    fileComp: newFileComp,
                }),
            );
            dispatch(setPathname({ pathname: paths.COMPARE }));
            dispatch(
                initializeCompare({
                    fileBase: newFileBase,
                    fileComp: newFileComp,
                    groupColumns,
                    customSettings: {
                        ignoreWhiteSpaces,
                        ignoreValueCase,
                    },
                }),
            );
            handleClose();
        },
        [
            dispatch,
            handleClose,
            currentCompareId,
            ignoreWhiteSpaces,
            ignoreValueCase,
            groupColumns,
        ],
    );

    // Read the columns of both files and open the group columns selection
    const handleGetColumns = useCallback(async () => {
        if (!fileBase || !fileComp) {
            return;
        }

        try {
            if (fileBase === fileComp) {
                // This makes no sense, so no need to check columns
                return;
            }

            const [baseColumns, compColumns] = await Promise.all([
                apiService.getFileColumns(fileBase),
                apiService.getFileColumns(fileComp),
            ]);

            const compColumnSet = new Set(
                compColumns.map((column) => column.name.toLowerCase()),
            );
            const newSharedColumns = baseColumns
                .filter((column) =>
                    compColumnSet.has(column.name.toLowerCase()),
                )
                .map((column) => column.name);

            if (newSharedColumns.length === 0) {
                dispatch(
                    openSnackbar({
                        message: 'The selected files do not share any columns',
                        type: 'warning',
                    }),
                );
                setSharedColumns([]);
                return;
            }
            setSharedColumns(newSharedColumns);

            // Drop previously selected columns that are not shared anymore
            const newSharedColumnSet = new Set(
                newSharedColumns.map((column) => column.toLowerCase()),
            );
            const stillAvailable = groupColumns.filter((column) =>
                newSharedColumnSet.has(column.toLowerCase()),
            );
            if (stillAvailable.length !== groupColumns.length) {
                setGroupColumns(stillAvailable);
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    message: (error as Error).message,
                    type: 'error',
                }),
            );
        }
    }, [apiService, dispatch, fileBase, fileComp, groupColumns]);

    const handleToggleGroupColumnsFlag = (newValue: boolean) => {
        setGroupColumnsFlag(newValue);
        if (newValue) {
            handleGetColumns();
        } else {
            resetGroupColumns();
        }
    };

    const handleSelectFile = async (type: 'base' | 'comp') => {
        const result = await apiService.openFileDialog({
            multiple: false,
        });
        if (result && result.length > 0) {
            resetGroupColumns();
            if (type === 'base') {
                setFileBase(result[0].fullPath);
            } else {
                setFileComp(result[0].fullPath);
            }
        }
        // Refresh the list of columns
        if (groupColumnsFlag) {
            handleGetColumns();
        }
    };

    const handleSelectRecent = (recent: {
        fileBase: string;
        fileComp: string;
        groupColumns?: string[];
    }) => {
        setFileBase(recent.fileBase);
        setFileComp(recent.fileComp);
        if (recent.groupColumns && recent.groupColumns.length > 0) {
            setGroupColumns(recent.groupColumns);
            setGroupColumnsFlag(true);
        } else {
            resetGroupColumns();
        }
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
                        resetGroupColumns();
                        handleCompare(recent.fileBase, recent.fileComp);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        recentCompares,
        dispatch,
        handleClose,
        handleCompare,
        resetGroupColumns,
    ]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <ModalTitle
                sx={styles.title}
                title="Select Files for Comparison"
                helpId="SELECTCOMPARE"
                onClose={handleClose}
            />
            <DialogContent>
                <Stack sx={styles.input}>
                    <Stack direction="row">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ignoreWhiteSpaces}
                                    onChange={() =>
                                        setIgnoreWhiteSpaces(!ignoreWhiteSpaces)
                                    }
                                    name="compare.ignoreWhiteSpaces"
                                />
                            }
                            label="Ignore White Spaces"
                            sx={styles.flag}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ignoreValueCase}
                                    onChange={() =>
                                        setIgnoreValueCase(!ignoreValueCase)
                                    }
                                    name="compare.ignoreValueCase"
                                />
                            }
                            label="Case Insensitive"
                            sx={styles.flag}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={groupColumnsFlag}
                                    onChange={() =>
                                        handleToggleGroupColumnsFlag(
                                            !groupColumnsFlag,
                                        )
                                    }
                                    name="compare.groupColumnsFlag"
                                />
                            }
                            label="Group records"
                            sx={styles.flag}
                        />
                    </Stack>

                    <Box sx={styles.fileInput}>
                        <TextField
                            fullWidth
                            label="Base File"
                            value={fileBase}
                            onChange={handleUpdateFileBase}
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
                            onChange={handleUpdateFileComp}
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

                    {groupColumnsFlag && (
                        <Box sx={styles.fileInput}>
                            <Autocomplete
                                multiple
                                fullWidth
                                options={sharedColumns}
                                value={groupColumns}
                                onChange={(_event, newValue) => {
                                    setGroupColumns(newValue);
                                }}
                                renderValue={(value, getItemProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option}
                                            {...getItemProps({ index })}
                                            sx={styles.groupColumn}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        helperText="Datasets must be sorted by the selected group columns for correct comparison"
                                        placeholder={
                                            groupColumns.length === 0
                                                ? 'Select group columns'
                                                : undefined
                                        }
                                        fullWidth
                                    />
                                )}
                            />
                        </Box>
                    )}

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
                </Stack>

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
                                <React.Fragment
                                    key={recent.fileBase + recent.fileComp}
                                >
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
                                            disableTypography
                                            primary={
                                                <Stack direction="column">
                                                    <Box>
                                                        Base: {recent.fileBase}
                                                    </Box>
                                                    <Box>
                                                        Comp: {recent.fileComp}
                                                    </Box>
                                                </Stack>
                                            }
                                            secondary={
                                                recent.groupColumns
                                                    ? `Group columns: ${recent.groupColumns.join(', ')}`
                                                    : undefined
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
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
