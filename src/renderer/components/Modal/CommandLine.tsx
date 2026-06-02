import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
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
    Typography,
    Box,
} from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    closeModal,
    openModal,
    setDatasetIdColumns,
    setDatasetSorting,
    setMask,
    setGoTo,
} from 'renderer/redux/slices/ui';
import {
    addRecentCommand,
    resetFilter,
    setFilter,
} from 'renderer/redux/slices/data';
import { IMask, IUiModal } from 'interfaces/common';
import { modals } from 'misc/constants';
import { parseDatasetCommand } from 'renderer/utils/commandLine';
import {
    getCommandHelperText,
    useCommandAutocomplete,
} from 'renderer/components/hooks/useCommandAutocomplete';

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
    showAllValuesLi: {
        pointerEvents: 'none',
        opacity: 1,
        '&.MuiAutocomplete-option[aria-disabled="true"]': {
            pointerEvents: 'none',
            opacity: 1,
        },
    },
};

const emptyArray: unknown[] = [];

const handleRenderOption = (
    props: React.HTMLAttributes<HTMLLIElement> & {
        key: React.Key;
    },
    option: string | React.ReactNode,
    _state,
    _ownerState,
): string | React.ReactNode => {
    const { key, ...optionProps } = props;
    if (option === '_show_all_values_') {
        return (
            <Box
                key={key}
                component="li"
                {...optionProps}
                aria-disabled
                onMouseDown={(event: React.MouseEvent<HTMLLIElement>) => {
                    event.preventDefault();
                }}
                onClick={(event: React.MouseEvent<HTMLLIElement>) => {
                    event.preventDefault();
                }}
                sx={styles.showAllValuesLi}
            >
                <Typography variant="caption" color="primary">
                    Press Tab to show all values (max 1000)
                </Typography>
            </Box>
        );
    }
    return (
        <Box key={key} component="li" {...optionProps}>
            {option}
        </Box>
    );
};

const CommandLine: React.FC<IUiModal> = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const settings = useAppSelector((state) => state.settings);
    const currentMask = useAppSelector(
        (state) => state.ui.control[currentFileId]?.mask,
    );
    const currentIdColumns = useAppSelector(
        (state) =>
            state.ui.control[currentFileId]?.idCols || (emptyArray as string[]),
    );
    const currentSorting = useAppSelector(
        (state) =>
            state.ui.control[currentFileId]?.sorting ||
            (emptyArray as Record<string, string>[]),
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
        () => metadata?.columns.map((column) => column.name) ?? [],
        [metadata],
    );
    const columnTypes = useMemo(() => {
        if (!metadata) {
            return {};
        }
        const types: Record<string, 'numeric' | 'string' | 'boolean'> = {};
        metadata.columns.forEach((col) => {
            if (
                ['integer', 'float', 'double', 'number'].includes(col.dataType)
            ) {
                types[col.name] = 'numeric';
            } else if (['boolean'].includes(col.dataType)) {
                types[col.name] = 'boolean';
            } else {
                types[col.name] = 'string';
            }
        });
        return types;
    }, [metadata]);
    const currentVisibleColumns = currentMask?.columns ?? allColumnNames;

    const recentCommandStrings = useMemo(() => {
        return recentCommands
            .slice()
            .sort((a, b) => b.date - a.date)
            .map((item) => item.command);
    }, [recentCommands]);

    const [command, setCommand] = useState('');
    const [helperText, setHelperText] = useState({ text: '', isError: false });
    const [historyRequested, setHistoryRequested] = useState(false);
    const [allValuesColumns, setAllValuesColumns] = useState<string[]>([]);
    const showHistory = historyRequested;
    const { commandAutocomplete, isAutocompleteLoading, resolvedCategory } =
        useCommandAutocomplete({
            apiService,
            allColumnNames,
            category: showHistory ? 'history' : undefined,
            columnTypes,
            allValuesColumns,
            command,
            currentFileId,
            historyOptions: recentCommandStrings,
            metadata,
            settings,
        });

    const autocompleteOptions = commandAutocomplete?.options ?? [];

    const [autocompleteOpen, setAutocompleteOpen] = useState(false);

    useEffect(() => {
        setAutocompleteOpen((prevValue) => {
            if (
                prevValue === false &&
                commandAutocomplete?.tokenType === 'value' &&
                commandAutocomplete.options.length === 1 &&
                commandAutocomplete.replaceEnd -
                    commandAutocomplete.replaceStart ===
                    commandAutocomplete.options[0].length
            ) {
                return false;
            }
            return Boolean(
                commandAutocomplete &&
                (commandAutocomplete.options.length > 0 ||
                    commandAutocomplete.loadingColumnId),
            );
        });
    }, [commandAutocomplete]);

    useEffect(() => {
        setHelperText(getCommandHelperText(command));
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
            }),
        );

        result.actions.forEach((action) => {
            switch (action.type) {
                case 'resetAll':
                    dispatch(setMask({ fileId: currentFileId, mask: null }));
                    dispatch(resetFilter({ fileId: currentFileId }));
                    dispatch(
                        setDatasetIdColumns({
                            fileId: currentFileId,
                            idCols: [],
                        }),
                    );
                    dispatch(
                        setDatasetSorting({
                            fileId: currentFileId,
                            sorting: [],
                        }),
                    );
                    break;
                case 'resetIdColumns':
                    dispatch(
                        setDatasetIdColumns({
                            fileId: currentFileId,
                            idCols: [],
                        }),
                    );
                    break;
                case 'resetSorting':
                    dispatch(
                        setDatasetSorting({
                            fileId: currentFileId,
                            sorting: [],
                        }),
                    );
                    break;
                case 'clearMask':
                    dispatch(setMask({ fileId: currentFileId, mask: null }));
                    break;
                case 'setIdColumns':
                    dispatch(
                        setDatasetIdColumns({
                            fileId: currentFileId,
                            idCols: action.columns,
                        }),
                    );
                    break;
                case 'setSorting':
                    dispatch(
                        setDatasetSorting({
                            fileId: currentFileId,
                            sorting: action.sorting,
                        }),
                    );
                    break;
                case 'setMask': {
                    const normalizedColumns = allColumnNames.filter((column) =>
                        action.columns.includes(column),
                    );

                    if (normalizedColumns.length === allColumnNames.length) {
                        dispatch(
                            setMask({ fileId: currentFileId, mask: null }),
                        );
                        break;
                    }

                    const mask: IMask = {
                        name: '',
                        id: '',
                        sticky: currentMask?.sticky || false,
                        columns: normalizedColumns,
                    };

                    dispatch(setMask({ fileId: currentFileId, mask }));
                    break;
                }
                case 'openVariableInfo':
                    dispatch(
                        openModal({
                            type: modals.VARIABLEINFO,
                            data: { columnId: action.columnId },
                        }),
                    );
                    break;
                case 'setFilter':
                    dispatch(
                        setFilter({
                            fileId: currentFileId,
                            filter: action.filter,
                            datasetName: metadata?.name || '',
                        }),
                    );
                    break;
                case 'setGoTo':
                    dispatch(
                        setGoTo({
                            fileId: currentFileId,
                            row: action.row,
                            column: action.column,
                        }),
                    );
                    break;
                default:
                    break;
            }
        });

        handleClose();
    }, [
        allColumnNames,
        command,
        currentFilter,
        currentFileId,
        currentIdColumns,
        currentMask,
        currentSorting,
        currentVisibleColumns,
        dispatch,
        handleClose,
        lastFilterOptions,
        metadata,
    ]);

    const handleInputChange = useCallback(
        (
            _event: React.SyntheticEvent,
            value: string,
            reason: AutocompleteInputChangeReason,
        ) => {
            if (reason === 'selectOption') {
                setAutocompleteOpen(false);

                if (resolvedCategory === 'history' || !commandAutocomplete) {
                    setCommand(value);
                    setHistoryRequested(false);
                    requestAnimationFrame(() => {
                        inputRef.current?.focus();
                        inputRef.current?.setSelectionRange(
                            value.length,
                            value.length,
                        );
                    });
                    return;
                }

                // If a comparator function is selected, we need to transform the command to the function call;
                let nextCommand = '';
                if (
                    commandAutocomplete.tokenType === 'operator' &&
                    ['missing', 'notMissing'].includes(value)
                ) {
                    const commandParts = command.split(';');
                    const updatedCommand = `${command.replace(/^(\s*\S+).*/, '$1')} ${value}(${commandAutocomplete.columnId})`;
                    commandParts.splice(
                        commandParts.length - 1,
                        1,
                        updatedCommand,
                    );
                    nextCommand = commandParts.join(';');
                } else {
                    let suffix = commandAutocomplete.insertSuffix || '';
                    // If in or notin are used, add the opening parenthesis.
                    if (
                        ['in', 'notin'].includes(value.toLowerCase()) &&
                        commandAutocomplete.tokenType === 'operator'
                    ) {
                        suffix += '(';
                    }
                    nextCommand = `${command.slice(
                        0,
                        commandAutocomplete.replaceStart,
                    )}${value}${suffix}${command.slice(
                        commandAutocomplete.replaceEnd,
                    )}`;
                }

                setCommand(nextCommand);
                setHistoryRequested(false);

                // requestAnimationFrame(() => {
                //     const nextCursor =
                //         commandAutocomplete.replaceStart +
                //         value.length +
                //         commandAutocomplete.insertSuffix.length;
                //     inputRef.current?.focus();
                //     inputRef.current?.setSelectionRange(nextCursor, nextCursor);
                // });
                return;
            }

            if (reason === 'reset') {
                return;
            }

            if (reason === 'clear') {
                setAutocompleteOpen(false);
                setHelperText({ text: '', isError: false });
            }

            setCommand(value);
        },
        [command, commandAutocomplete, resolvedCategory],
    );

    const handleOpen = useCallback((event: React.SyntheticEvent) => {
        if (event.type === 'click') {
            setHistoryRequested(true);
        }
    }, []);

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'ArrowDown' && command.trim() === '') {
                setHistoryRequested(true);
                event.preventDefault();
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                if (showHistory) {
                    setHistoryRequested(false);
                    return;
                }
                if (autocompleteOpen) {
                    setAutocompleteOpen(false);
                    return;
                }
                handleClose();
                return;
            }

            if (event.key === 'Enter' && !autocompleteOpen) {
                event.preventDefault();
                handleSubmit();
            }

            if (event.key === 'Tab' && commandAutocomplete?.columnId) {
                event.preventDefault();
                setAllValuesColumns((prev) => {
                    if (prev.includes(commandAutocomplete.columnId!)) {
                        return prev;
                    }
                    return [...prev, commandAutocomplete.columnId!];
                });
            }
        },
        [
            command,
            commandAutocomplete?.columnId,
            handleClose,
            handleSubmit,
            autocompleteOpen,
            showHistory,
        ],
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
                    forcePopupIcon={command === ''}
                    onOpen={command === '' ? handleOpen : undefined}
                    options={autocompleteOptions}
                    open={autocompleteOpen}
                    loading={isAutocompleteLoading}
                    inputValue={command}
                    onInputChange={handleInputChange}
                    renderOption={handleRenderOption}
                    onClose={() => {
                        if (showHistory) {
                            setHistoryRequested(false);
                        }
                    }}
                    filterOptions={(options) => options}
                    sx={styles.field}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            autoFocus
                            inputRef={inputRef}
                            fullWidth
                            label="Command"
                            placeholder="id USUBJID; idadd AVISIT; sort /A.*/ desc"
                            onKeyDown={handleInputKeyDown}
                            helperText={
                                helperText.text ||
                                'Commands: id<add>, sort<add>, show<add>, hide<add>, filter<add>, info, go, reset. Separate multiple commands with ;'
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
