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
import {
    Stack,
    Switch,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Chip,
    Tooltip,
} from '@mui/material';
import InteractiveInput from 'renderer/components/Modal/Filter/InteractiveInput';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { getHeader } from 'renderer/utils/readData';
import { handleTransformation } from 'renderer/utils/transformUtils';

const styles = {
    dialog: {
        maxWidth: '90%',
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
    recentFiltersTitle: {
        mt: 2,
        textAlign: 'center',
    },
    filterItem: {
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
    filtersList: {
        maxHeight: 320,
        overflow: 'auto',
    },
};

// Create dummy filter for conversion and validation purposes;
const filterForConversion = new Filter('dataset-json1.1', [], '', {
    caseInsensitiveColNames: true,
});

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
    const recentFilters = useAppSelector(
        (state) => state.data.filterData.recentFilters,
    );

    const recentFiltersValidated = useMemo(() => {
        return recentFilters.map((filter) => {
            const filterString = filterForConversion.toString(filter.filter);
            const isValid =
                filterForValidation.validateFilterString(filterString);
            return {
                ...filter,
                isValid,
            };
        });
    }, [recentFilters, filterForValidation]);

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

    const handleSetFilter = useCallback(
        (filter?: IBasicFilter) => {
            let finalFilter: string;
            const newFilter = new Filter(
                'dataset-json1.1',
                metadata.columns,
                '',
            );
            if (filter !== undefined) {
                finalFilter = newFilter.toString(filter);
            } else if (inputType === 'interactive') {
                if (interactiveFilter === null) {
                    finalFilter = '';
                } else {
                    // If filter contains formatted dates, convert them to numeric values;
                    const header = getHeader(metadata, settings);
                    // Get all columns with formatted dates;
                    const dateColumns = header
                        .filter((column) => column.numericDatetimeType)
                        .map((column) => column.id);

                    const conditionsUpdated = interactiveFilter.conditions.map(
                        (condition) => {
                            if (dateColumns.includes(condition.variable)) {
                                const numericDatetimeType = header.find(
                                    (column) =>
                                        column.id === condition.variable,
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
                    newFilter.update({
                        ...interactiveFilter,
                        conditions: conditionsUpdated,
                    });
                    finalFilter = newFilter.toString();
                }
            } else {
                finalFilter = inputValue;
            }

            if (finalFilter === '') {
                dispatch(resetFilter());
                handleClose();
            } else if (newFilter.validateFilterString(finalFilter)) {
                newFilter.update(finalFilter);
                const basicFilter = {
                    ...newFilter.toBasicFilter(),
                    options: { caseInsensitive },
                };
                dispatch(
                    setFilter({
                        filter: basicFilter,
                        datasetName: dataset.name,
                    }),
                );
                handleClose();
            }
        },
        [
            dataset.name,
            dispatch,
            handleClose,
            inputValue,
            caseInsensitive,
            interactiveFilter,
            inputType,
            settings,
            metadata,
        ],
    );

    const handleReloadData = () => {
        dispatch(resetFilter());
    };

    const handleSelectFilter = useCallback(
        (filter: IBasicFilter) => {
            if (inputType === 'interactive') {
                setInteractiveFilter(filter);
            } else {
                setInputValue(filterForConversion.toString(filter));
            }
        },
        [inputType],
    );

    // Shortcuts
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
            } else if (
                event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey
            ) {
                const keyNum = parseInt(event.key, 10);
                // Check if it's a number key from 0-9
                if (!Number.isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
                    const filterIndex = keyNum - 1;
                    if (recentFiltersValidated[filterIndex]?.isValid) {
                        event.preventDefault();
                        handleSetFilter(
                            recentFiltersValidated[filterIndex].filter,
                        );
                    }
                } else if (event.key === '0') {
                    if (recentFiltersValidated[9]?.isValid) {
                        event.preventDefault();
                        handleSetFilter(recentFiltersValidated[9].filter);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        handleClose,
        handleSetFilter,
        recentFiltersValidated,
        handleSelectFilter,
    ]);

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
                    <Typography variant="h6" sx={styles.recentFiltersTitle}>
                        Recent Filters
                    </Typography>
                    <List sx={styles.filtersList}>
                        {recentFiltersValidated
                            .slice(0, 5)
                            .map((filterItem, index) => (
                                <React.Fragment key={filterItem.date}>
                                    <ListItem sx={styles.filterItem}>
                                        <ListItemAvatar>
                                            <Chip
                                                label={`Ctrl+${index === 9 ? 0 : index + 1}`}
                                                sx={styles.shortcutChip}
                                                size="small"
                                                disabled={!filterItem.isValid}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={filterForConversion.toString(
                                                filterItem.filter,
                                            )}
                                            slotProps={{
                                                primary: filterItem.isValid
                                                    ? { color: 'textPrimary' }
                                                    : {
                                                          color: 'textDisabled',
                                                      },
                                            }}
                                        />
                                        <Tooltip title="Edit filter">
                                            <IconButton
                                                edge="end"
                                                aria-label="edit"
                                                disabled={
                                                    /* For interactive mode, cannot edit invalid filter */
                                                    !filterItem.isValid &&
                                                    inputType === 'interactive'
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectFilter(
                                                        filterItem.filter,
                                                    );
                                                }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItem>
                                    {index <
                                        Math.min(recentFilters.length, 10) -
                                            1 && <Divider />}
                                </React.Fragment>
                            ))}
                    </List>
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
                    onClick={() => handleSetFilter()}
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
