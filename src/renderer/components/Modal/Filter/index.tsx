import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useContext,
} from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import { closeModal, setFilterInputMode } from 'renderer/redux/slices/ui';
import ManualInput from 'renderer/components/Modal/Filter/ManualInput';
import validateFilterString from 'renderer/components/Modal/Filter/validateFilterString';
import stringToFilter from 'renderer/components/Modal/Filter/stringToFilter';
import filterToString from 'renderer/components/Modal/Filter/filterToString';
import AppContext from 'renderer/utils/AppContext';
import { setFilter, resetFilter } from 'renderer/redux/slices/data';
import { Filter as IFilter, IUiModal } from 'interfaces/common';
import { Stack, Switch, Typography } from '@mui/material';
import InteractiveInput from 'renderer/components/Modal/Filter/InteractiveInput';
import RefreshIcon from '@mui/icons-material/Refresh';

const styles = {
    dialog: {
        minWidth: '50%',
    },
    caseInsensitive: {
        minWidth: '170px',
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 2,
    },
};

const Filter: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter,
    );
    const currentFilterString = useMemo(() => {
        return currentFilter ? filterToString(currentFilter) : '';
    }, [currentFilter]);
    const [inputValue, setInputValue] = useState(currentFilterString);
    const [interactiveFilter, setInteractiveFilter] = useState(currentFilter);

    const lastOptions = useAppSelector(
        (state) => state.data.filterData.lastOptions,
    );
    const [caseInsensitive, setCaseInsensitive] = useState(
        lastOptions?.caseInsensitive ?? true,
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const data = apiService.getOpenedFileData(currentFileId);

    const metadata = apiService.getOpenedFileMetadata(currentFileId);

    const columnNames = metadata.columns.map((column) => column.name);

    const columnTypes = useMemo(() => {
        const types = {};
        metadata.columns.forEach((column) => {
            if (column.dataType === 'boolean') {
                types[column.name.toLowerCase()] = 'boolean';
            } else if (
                ['float', 'double', 'integer'].includes(column.dataType)
            ) {
                types[column.name.toLowerCase()] = 'number';
            } else {
                types[column.name.toLowerCase()] = 'string';
            }
        });
        return types;
    }, [metadata.columns]);

    const dataset = useAppSelector(
        (state) => state.data.openedFileIds[state.ui.currentFileId],
    );

    const toggleCaseInsensitive = () => {
        setCaseInsensitive(!caseInsensitive);
    };

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleResetFilter = () => {
        dispatch(resetFilter());
        handleClose();
    };

    // Unique values used for autocomplete
    const [uniqueValues, setUniqueValues] = useState<{
        [key: string]: Array<string | boolean | number>;
    }>({});

    const getUniqueValues = useCallback(
        (columns: string[]) => {
            const newValues = {};
            columns.forEach((column) => {
                if (
                    data.length > 0 &&
                    Object.prototype.hasOwnProperty.call(data[0], column)
                ) {
                    const columnValues = [
                        ...new Set(data.map((row) => row[column])),
                    ];
                    newValues[column] = columnValues;
                }
            });
            setUniqueValues((prev) => ({
                ...prev,
                ...newValues,
            }));
        },
        [data],
    );

    // Update unique values when filter is loaded or data is updated
    const loadedRecords = useAppSelector(
        (state) => state.data.loadedRecords[currentFileId],
    );
    const filterColumns = interactiveFilter
        ? Object.values(interactiveFilter.conditions)
              .map((value) => value.variable)
              .filter((value) => value !== '')
              .filter((value) =>
                  metadata.columns
                      .map((column) => column.name.toLowerCase())
                      .includes(value.toLowerCase()),
              )
              .sort()
              .join('#$%')
        : '';
    useEffect(() => {
        if (filterColumns !== '' && loadedRecords > 0) {
            const columns = filterColumns.split('#$%');
            // Use proper column names from metadata
            const properColumnNames = metadata.columns
                .map((column) => column.name)
                .filter((column) =>
                    columns
                        .map((value) => value.toLowerCase())
                        .includes(column.toLowerCase()),
                );
            getUniqueValues(properColumnNames);
        }
    }, [getUniqueValues, filterColumns, loadedRecords, metadata.columns]);

    const inputType = useAppSelector(
        (state) => state.ui.viewer.filterInputMode,
    );

    const toggleInputType = () => {
        if (inputType === 'interactive') {
            if (interactiveFilter === null) {
                setInputValue('');
            } else {
                const newString = filterToString(interactiveFilter);
                setInputValue(newString);
            }
        } else {
            const newFilter = stringToFilter(inputValue, columnTypes);
            setInteractiveFilter(newFilter);
        }
        dispatch(
            setFilterInputMode(
                inputType === 'interactive' ? 'manual' : 'interactive',
            ),
        );
    };

    const handleChangeInteractive = (filter: IFilter) => {
        setInteractiveFilter(filter);
    };

    const handleSetFilter = useCallback(() => {
        let finalFilter: string;
        if (inputType === 'interactive') {
            if (interactiveFilter === null) {
                finalFilter = '';
            } else {
                finalFilter = filterToString(interactiveFilter);
            }
        } else {
            finalFilter = inputValue;
        }
        if (finalFilter === '') {
            dispatch(resetFilter());
            handleClose();
        } else if (
            validateFilterString(finalFilter, columnNames, columnTypes)
        ) {
            const filter = {
                ...stringToFilter(finalFilter, columnTypes),
                options: { caseInsensitive },
            };
            dispatch(setFilter({ filter, datasetName: dataset.name }));
            handleClose();
        }
    }, [
        columnNames,
        columnTypes,
        dataset.name,
        dispatch,
        handleClose,
        inputValue,
        caseInsensitive,
        interactiveFilter,
        inputType,
    ]);

    const handleReloadData = () => {
        dispatch(resetFilter());
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSetFilter();
            } else if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose, handleSetFilter]);

    const isValidFilter = validateFilterString(
        inputValue,
        columnNames,
        columnTypes,
    );

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>Filter Data</DialogTitle>
            <DialogContent>
                <Stack spacing={2} direction="column">
                    <Stack spacing={2} direction="row">
                        <FormControlLabel
                            sx={styles.caseInsensitive}
                            control={
                                <Switch
                                    checked={inputType === 'interactive'}
                                    onChange={toggleInputType}
                                    disabled={!isValidFilter}
                                    name="inputType"
                                    color="primary"
                                />
                            }
                            label={`${
                                inputType === 'interactive'
                                    ? 'Interactive'
                                    : 'Manual'
                            } Input`}
                        />
                        <FormControlLabel
                            sx={styles.caseInsensitive}
                            control={
                                <Checkbox
                                    checked={caseInsensitive}
                                    onChange={toggleCaseInsensitive}
                                    name="caseInsensitive"
                                />
                            }
                            label="Case Insensitive"
                        />
                        {currentFilter !== null &&
                            inputType === 'interactive' && (
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                >
                                    <Typography variant="caption" color="info">
                                        Value selection is limited to filtered
                                        data
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={handleReloadData}
                                        color="primary"
                                        aria-label="refresh-data"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Stack>
                            )}
                    </Stack>
                    {inputType === 'interactive' ? (
                        <InteractiveInput
                            filter={interactiveFilter}
                            onChange={handleChangeInteractive}
                            columnNames={columnNames}
                            columnTypes={columnTypes}
                            uniqueValues={uniqueValues}
                        />
                    ) : (
                        <ManualInput
                            inputValue={inputValue}
                            handleSetInputValue={setInputValue}
                            columnNames={columnNames}
                            columnTypes={columnTypes}
                            datasetName={dataset.name}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleResetFilter} color="primary">
                    Reset
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSetFilter}
                    disabled={!isValidFilter}
                    color="primary"
                    variant="contained"
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Filter;
