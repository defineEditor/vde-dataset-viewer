import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Autocomplete,
    AutocompleteInputChangeReason,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    closeModal,
    openModal,
    setDatasetIdColumns,
    setDatasetSorting,
    setGoTo,
} from 'renderer/redux/slices/ui';
import {
    addRecentCommand,
    clearMask,
    resetFilter,
    selectMask,
    setFilter,
} from 'renderer/redux/slices/data';
import { IMask, IUiModal } from 'interfaces/common';
import { modals } from 'misc/constants';
import { parseDatasetCommand } from 'renderer/utils/commandLine';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '85%', md: '60%', lg: '45%', xl: '40%' },
    },
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 1,
    },
    field: {
        mt: 1,
    },
};

const COMMAND_SYNTAX = {
    id: 'id [selectors] - set ID columns',
    idadd: 'idadd|ia [selectors] - add columns to ID columns',
    sort: 'sort [selector] [asc|desc] ... - set sorting',
    sortadd: 'sortadd|osa [selector] [asc|desc] ... - add sorting columns',
    show: 'show [selectors] - show only selected columns',
    showadd: 'showadd|sha [selectors] - add columns to visible columns',
    hide: 'hide [selectors] - hide selected columns',
    hideadd: 'hideadd|ha [selectors] - remove columns from visible columns',
    info: 'info [column] - open variable info',
    filter: 'filter [expression] - replace current filter',
    filteradd: 'filteradd|fa [expression] - append filter with AND',
    go: 'go [row] | [column] | [row:column] | [column:row]',
    reset: 'reset - clear masks, filters, id columns, and sorting',
    selectors:
        'Selectors for multi-column commands: exact names, /regex/, re:regex, COL+, COL-',
} as const;

const CommandLine: React.FC<IUiModal> = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentMask = useAppSelector(
        (state) => state.data.maskData.currentMask,
    );
    const currentIdColumns = useAppSelector(
        (state) => state.ui.control[currentFileId]?.idCols || [],
    );
    const currentSorting = useAppSelector(
        (state) => state.ui.control[currentFileId]?.sorting || [],
    );
    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter[currentFileId] || null,
    );
    const lastFilterOptions = useAppSelector(
        (state) => state.data.filterData.lastOptions,
    );
    const recentCommands = useAppSelector(
        (state) => state.data.filterData.recentCommands,
    );

    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    const allColumnNames = useMemo(
        () => metadata.columns.map((column) => column.name),
        [metadata],
    );
    const currentVisibleColumns = currentMask?.columns || allColumnNames;
    const dataset = useMemo(
        () =>
            apiService
                .getOpenedFiles()
                .find((file) => file.fileId === currentFileId),
        [apiService, currentFileId],
    );

    const recentCommandStrings = useMemo(() => {
        return recentCommands
            .slice()
            .sort(
                (a, b) =>
                    b.date * (b.datasetName === dataset?.name ? 10000 : 1) -
                    a.date / (a.datasetName === dataset?.name ? 10000 : 1),
            )
            .map((item) => item.command);
    }, [dataset?.name, recentCommands]);

    const [command, setCommand] = useState('');
    const [helperText, setHelperText] = useState({ text: '', isError: false });

    useEffect(() => {
        const commandKey = Object.keys(COMMAND_SYNTAX).find(
            (key) =>
                key !== 'selectors' && command.toLowerCase().startsWith(key),
        );

        if (commandKey) {
            setHelperText({
                text: `${COMMAND_SYNTAX[commandKey as keyof typeof COMMAND_SYNTAX]}. ${COMMAND_SYNTAX.selectors}`,
                isError: false,
            });
            return;
        }

        if (command.trim() !== '' && command.indexOf(' ') > 0) {
            setHelperText({
                text: `Unknown command.`,
                isError: true,
            });
            return;
        }

        setHelperText({ text: '', isError: false });
    }, [command]);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.COMMANDLINE }));
    }, [dispatch]);

    const handleSubmit = useCallback(() => {
        const trimmedCommand = command.trim();
        const result = parseDatasetCommand({
            commandLine: trimmedCommand,
            metadata,
            lastFilterOptions,
            currentFilter,
            currentIdColumns,
            currentSorting,
            currentVisibleColumns,
        });

        if (!result.ok) {
            setHelperText({ text: result.error, isError: true });
            return;
        }

        dispatch(
            addRecentCommand({
                command: trimmedCommand,
                datasetName: dataset?.name || '',
            }),
        );

        const { action } = result;

        switch (action.type) {
            case 'reset-all':
                dispatch(clearMask());
                dispatch(resetFilter({ fileId: currentFileId }));
                dispatch(
                    setDatasetIdColumns({ fileId: currentFileId, idCols: [] }),
                );
                dispatch(
                    setDatasetSorting({ fileId: currentFileId, sorting: [] }),
                );
                handleClose();
                return;
            case 'reset-id-columns':
                dispatch(
                    setDatasetIdColumns({ fileId: currentFileId, idCols: [] }),
                );
                handleClose();
                return;
            case 'reset-sorting':
                dispatch(
                    setDatasetSorting({ fileId: currentFileId, sorting: [] }),
                );
                handleClose();
                return;
            case 'clear-mask':
                dispatch(clearMask());
                handleClose();
                return;
            case 'set-id-columns':
                dispatch(
                    setDatasetIdColumns({
                        fileId: currentFileId,
                        idCols: action.columns,
                    }),
                );
                handleClose();
                return;
            case 'set-sorting':
                dispatch(
                    setDatasetSorting({
                        fileId: currentFileId,
                        sorting: action.sorting,
                    }),
                );
                handleClose();
                return;
            case 'set-mask': {
                const normalizedColumns = allColumnNames.filter((column) =>
                    action.columns.includes(column),
                );

                if (normalizedColumns.length === allColumnNames.length) {
                    dispatch(clearMask());
                    handleClose();
                    return;
                }

                const mask: IMask = {
                    name: '',
                    id: '',
                    sticky: currentMask?.sticky || false,
                    columns: normalizedColumns,
                };

                dispatch(selectMask(mask));
                handleClose();
                return;
            }
            case 'open-variable-info':
                handleClose();
                dispatch(
                    openModal({
                        type: modals.VARIABLEINFO,
                        data: { columnId: action.columnId },
                    }),
                );
                return;
            case 'set-filter':
                dispatch(
                    setFilter({
                        fileId: currentFileId,
                        filter: action.filter,
                        datasetName: dataset?.name || '',
                    }),
                );
                handleClose();
                return;
            case 'set-go-to':
                dispatch(
                    setGoTo({
                        fileId: currentFileId,
                        row: action.row,
                        column: action.column,
                    }),
                );
                handleClose();
                break;
            default:
                break;
        }
    }, [
        allColumnNames,
        command,
        currentFilter,
        currentFileId,
        currentIdColumns,
        currentMask,
        currentSorting,
        currentVisibleColumns,
        dataset?.name,
        dispatch,
        handleClose,
        lastFilterOptions,
        metadata,
    ]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose, handleSubmit]);

    const handleInputChange = useCallback(
        (
            event: React.SyntheticEvent,
            value: string,
            reason: AutocompleteInputChangeReason,
        ) => {
            if (reason === 'selectOption') {
                event.stopPropagation();
            }
            if (reason === 'clear') {
                setHelperText({ text: '', isError: false });
            }
            setCommand(value);
        },
        [],
    );

    if (!metadata) {
        return null;
    }

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>Command Line</DialogTitle>
            <DialogContent>
                <Autocomplete
                    freeSolo
                    options={recentCommandStrings}
                    inputValue={command}
                    onInputChange={handleInputChange}
                    sx={styles.field}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            autoFocus
                            fullWidth
                            label="Command"
                            placeholder="idadd USUBJID AVISIT | sort /A.*/ desc | hide VISIT-"
                            helperText={
                                helperText.text ||
                                'Commands: id<add>, sort<add>, show<add>, hide<add>, filter<add>, info, go, reset'
                            }
                            error={helperText.isError}
                        />
                    )}
                />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    variant="contained"
                >
                    Run
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommandLine;
