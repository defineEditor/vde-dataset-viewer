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
import Filter from 'js-array-filter';
import { closeModal, setFilterInputMode } from 'renderer/redux/slices/ui';
import ManualInput from 'renderer/components/Modal/Filter/ManualInput';
import AppContext from 'renderer/utils/AppContext';
import { setFilter, resetFilter } from 'renderer/redux/slices/data';
import { BasicFilter as IBasicFilter, IUiModal } from 'interfaces/common';
import { Stack, Switch, Typography } from '@mui/material';
import InteractiveInput from 'renderer/components/Modal/Filter/InteractiveInput';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getHeader } from 'renderer/utils/readData';
import { handleTransformation } from 'renderer/utils/transformUtils';

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

const FilterComponent: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentBasicFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter,
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const data = apiService.getOpenedFileData(currentFileId);

    const metadata = apiService.getOpenedFileMetadata(currentFileId);

    const columnNames = metadata.columns.map((column) => column.name);
    const settings = useAppSelector((state) => state.settings);

    const columnTypes = useMemo(() => {
        const types = {};
        const header = getHeader(metadata, settings);
        // Get all columns with formatted dates;
        const dateColumns = header
            .filter((column) => column.numericDatetimeType)
            .map((column) => column.id);
        metadata.columns.forEach((column) => {
            if (column.dataType === 'boolean') {
                types[column.name.toLowerCase()] = 'boolean';
            } else if (
                ['float', 'double', 'integer'].includes(column.dataType) &&
                !dateColumns.includes(column.name)
            ) {
                types[column.name.toLowerCase()] = 'number';
            } else {
                types[column.name.toLowerCase()] = 'string';
            }
        });
        return types;
    }, [metadata, settings]);

    const filterForValidation = useMemo(() => {
        return new Filter('dataset-json1.1', metadata.columns, '');
    }, [metadata.columns]);

    const currentFilterString = useMemo(() => {
        if (currentBasicFilter === null) {
            return '';
        }
        return new Filter(
            'dataset-json1.1',
            metadata.columns,
            currentBasicFilter,
        ).toString();
    }, [currentBasicFilter, metadata.columns]);

    const [inputValue, setInputValue] = useState(currentFilterString);
    const [interactiveFilter, setInteractiveFilter] =
        useState(currentBasicFilter);

    const lastOptions = useAppSelector(
        (state) => state.data.filterData.lastOptions,
    );
    const [caseInsensitive, setCaseInsensitive] = useState(
        lastOptions?.caseInsensitive ?? true,
    );

    const openedFiles = apiService.getOpenedFiles();
    let dataset: { name: string; label: string };
    if (
        openedFiles.length > 0 &&
        openedFiles.some((file) => file.fileId === currentFileId)
    ) {
        dataset = openedFiles.find((file) => file.fileId === currentFileId) as {
            name: string;
            label: string;
        };
    } else {
        dataset = {
            name: '',
            label: '',
        };
    }

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
                const filter = new Filter(
                    'dataset-json1.1',
                    metadata.columns,
                    interactiveFilter,
                );
                setInputValue(filter.toString());
            }
        } else {
            const filter = new Filter(
                'dataset-json1.1',
                metadata.columns,
                inputValue,
            );
            setInteractiveFilter(filter.toBasicFilter());
        }
        dispatch(
            setFilterInputMode(
                inputType === 'interactive' ? 'manual' : 'interactive',
            ),
        );
    };

    const handleChangeInteractive = (filter: IBasicFilter) => {
        setInteractiveFilter(filter);
    };

    const handleSetFilter = useCallback(() => {
        let finalFilter: string;
        const filter = new Filter('dataset-json1.1', metadata.columns, '');
        if (inputType === 'interactive') {
            if (interactiveFilter === null) {
                finalFilter = '';
            } else {
                // If filter contains formatted dates, convert them to numeric values;
                const header = getHeader(metadata, settings);
                // Get all columns with formatted dates;
                const dateColumns = header
                    .filter((column) => column.numericDatetimeType)
                    .map((column) => column.id);

                interactiveFilter.conditions = interactiveFilter.conditions.map(
                    (condition) => {
                        if (dateColumns.includes(condition.variable)) {
                            const numericDatetimeType = header.find(
                                (column) => column.id === condition.variable,
                            )?.numericDatetimeType;
                            if (typeof condition.value === 'string') {
                                condition.value = handleTransformation(
                                    numericDatetimeType,
                                    condition.value,
                                    settings.viewer.dateFormat,
                                );
                            } else if (Array.isArray(condition.value)) {
                                condition.value = condition.value.map(
                                    (value) => {
                                        if (typeof value === 'string') {
                                            return handleTransformation(
                                                numericDatetimeType,
                                                value,
                                                settings.viewer.dateFormat,
                                            ) as number;
                                        }
                                        return value;
                                    },
                                );
                            }
                        }
                        return condition;
                    },
                );
                filter.update(interactiveFilter);
                finalFilter = filter.toString();
            }
        } else {
            finalFilter = inputValue;
        }

        if (finalFilter === '') {
            dispatch(resetFilter());
            handleClose();
        } else if (filter.validateFilterString(finalFilter)) {
            filter.update(finalFilter);
            const basicFilter = {
                ...filter.toBasicFilter(),
                options: { caseInsensitive },
            };
            dispatch(
                setFilter({ filter: basicFilter, datasetName: dataset.name }),
            );
            handleClose();
        }
    }, [
        dataset.name,
        dispatch,
        handleClose,
        inputValue,
        caseInsensitive,
        interactiveFilter,
        inputType,
        settings,
        metadata,
    ]);

    const handleReloadData = () => {
        dispatch(resetFilter());
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSetFilter();
            } else if (event.ctrlKey === true && event.key === 's') {
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

    const isValidFilter = filterForValidation.validateFilterString(inputValue);

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
                        {currentBasicFilter !== null &&
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
                            columns={metadata.columns}
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

export default FilterComponent;
