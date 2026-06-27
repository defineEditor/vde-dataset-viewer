import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
import { getCommandHelperText } from 'renderer/components/hooks/useCommandAutocomplete';
import CommandAutocompleteInput from 'renderer/components/Common/CommandAutocompleteInput';

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
        mt: 4,
    },
};

const emptyArray: unknown[] = [];

const CommandLine: React.FC<IUiModal> = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

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
                <CommandAutocompleteInput
                    value={command}
                    onValueChange={setCommand}
                    historyOptions={recentCommandStrings}
                    label="Command"
                    placeholder="id USUBJID; idadd AVISIT; sort /A.*/ desc"
                    helperText={
                        helperText.text ||
                        'Commands: id<add>, sort<add>, show<add>, hide<add>, filter<add>, info, go, reset. Separate multiple commands with ;'
                    }
                    error={helperText.isError}
                    autoFocus
                    onSubmit={handleSubmit}
                    onEscape={handleClose}
                    sx={styles.field}
                    mode="command"
                    allColumnNames={allColumnNames}
                    columnTypes={columnTypes}
                    metadata={metadata}
                    currentFileId={currentFileId}
                    apiService={apiService}
                    settings={settings}
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
