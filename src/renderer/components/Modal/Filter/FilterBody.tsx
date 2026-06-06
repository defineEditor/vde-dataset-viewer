import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useContext,
} from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Filter from 'js-array-filter';
import {
    closeModal,
    setFilterInputMode,
    restartCompare,
} from 'renderer/redux/slices/ui';
import ManualInput from 'renderer/components/Modal/Filter/ManualInput';
import {
    setFilter,
    resetFilter,
    setReportFilter,
    resetReportFilter,
} from 'renderer/redux/slices/data';
import {
    DatasetJsonMetadata,
    BasicFilter as IBasicFilter,
    IUiModalFilter,
} from 'interfaces/common';
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
import EditIcon from '@mui/icons-material/Edit';
import { getHeader } from 'renderer/utils/readData';
import { handleTransformation } from 'renderer/utils/transformUtils';

const styles = {
    dialog: {
        maxWidth: '95%',
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '70%', xl: '60%' },
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
    box: {
        display: 'flex',
        alignItems: 'center',
    },
    rowAlignCenter: {
        alignItems: 'center',
    },
};

// Create dummy filter for conversion and validation purposes;
const filterForConversion = new Filter('dataset-json1.1', [], '', {
    caseInsensitiveColNames: true,
});

interface FilterBodyProps {
    type: IUiModalFilter['type'];
    filterType: IUiModalFilter['filterType'];
    fileId: string;
    metadata: DatasetJsonMetadata;
    dataset: { name: string; label: string };
    loadedRecords: number;
    currentBasicFilter: IBasicFilter | null;
    reportTab?: 'details' | 'summary' | 'rules';
    compareFileIds?: string[] | null;
}

const FilterBody: React.FC<FilterBodyProps> = ({
    fileId,
    type,
    filterType,
    dataset,
    metadata,
    loadedRecords,
    currentBasicFilter,
    reportTab = 'summary',
    compareFileIds = null,
}: FilterBodyProps) => {
    const dispatch = useAppDispatch();

    const { apiService } = useContext(AppContext);

    const [allValuesLoaded, setAllValuesLoaded] = useState<
        Record<string, boolean>
    >({});

    const columnNames = metadata.columns
        .map((column) => column.name)
        .filter((name) => name !== '#');
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

    const toggleCaseInsensitive = () => {
        setCaseInsensitive(!caseInsensitive);
    };

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleResetFilter = () => {
        if (['dataset', 'compare'].includes(filterType)) {
            dispatch(resetFilter({ fileId }));
        } else if (filterType === 'report') {
            dispatch(resetReportFilter());
        }
        // If compare and the filter has changed, reinitiate compare process
        if (filterType === 'compare' && currentBasicFilter !== null) {
            dispatch(restartCompare({ compareId: fileId }));
        }
        handleClose();
    };

    // Unique values used for autocomplete
    const [uniqueValues, setUniqueValues] = useState<{
        [key: string]: Array<string | boolean | number>;
    }>({});

    const getUniqueValues = useCallback(
        async (columns: string[], getAll: boolean = false) => {
            try {
                if (!metadata) {
                    return;
                }
                let values;
                if (
                    filterType === 'compare' &&
                    compareFileIds &&
                    compareFileIds.length === 2
                ) {
                    const valuesBase = await apiService.getUniqueValues({
                        fileId: compareFileIds[0],
                        columnIds: columns,
                        limit: getAll ? 1000 : 100,
                        addCount: false,
                        getAllValues: getAll,
                        metadata,
                        settings,
                    });
                    const valuesCompare = await apiService.getUniqueValues({
                        fileId: compareFileIds[1],
                        columnIds: columns,
                        limit: getAll ? 1000 : 100,
                        addCount: false,
                        getAllValues: getAll,
                        metadata,
                        settings,
                    });
                    // Merge values from both compare files
                    values = {};
                    Object.keys(valuesBase).forEach((column) => {
                        values[column] = {
                            values: Array.from(
                                new Set([
                                    ...valuesBase[column].values,
                                    ...valuesCompare[column].values,
                                ]),
                            ),
                        };
                    });
                } else {
                    values = await apiService.getUniqueValues({
                        fileId,
                        columnIds: columns,
                        limit: getAll ? 1000 : 100,
                        addCount: false,
                        getAllValues: getAll,
                        metadata,
                        settings,
                    });
                }

                const newValues = {};

                Object.keys(values).forEach((column) => {
                    newValues[column] = values[column].values;
                    // Add show all values text
                    newValues[column].unshift('_show_all_values_');
                });
                setUniqueValues((prev) => ({
                    ...prev,
                    ...newValues,
                }));
            } catch (_error) {
                const newValues = {};
                columns.forEach((column) => {
                    newValues[column] = [];
                });
                setUniqueValues((prev) => ({
                    ...prev,
                    ...newValues,
                }));
            } finally {
                if (getAll) {
                    const newFlags = {};
                    columns.forEach((column) => {
                        newFlags[column] = true;
                    });
                    setAllValuesLoaded((prev) => ({
                        ...prev,
                        ...newFlags,
                    }));
                }
            }
        },
        [metadata, settings, apiService, fileId, filterType, compareFileIds],
    );

    useEffect(() => {
        setUniqueValues((prev) => {
            // Remove _show_all_values_ option where all values were already loaded
            const newValues = { ...prev };
            Object.keys(newValues).forEach((column) => {
                if (
                    allValuesLoaded[column] &&
                    prev[column][0] === '_show_all_values_'
                ) {
                    newValues[column] = prev[column].slice(1);
                }
            });
            return newValues;
        });
    }, [allValuesLoaded]);

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
                const updatedInteractiveFilter: IBasicFilter = {
                    ...interactiveFilter,
                };

                // Update interactive filter by removing all incomplete conditions
                const incompleteConditions: number[] = [];
                updatedInteractiveFilter.conditions.forEach(
                    (condition, index) => {
                        if (
                            !condition.variable ||
                            !condition.operator ||
                            condition.value === undefined
                        ) {
                            incompleteConditions.push(index);
                        }
                    },
                );

                if (incompleteConditions.length > 0) {
                    incompleteConditions
                        .sort()
                        .reverse()
                        .forEach((index) => {
                            updatedInteractiveFilter.conditions.splice(
                                index,
                                1,
                            );
                            updatedInteractiveFilter.connectors.splice(
                                Math.max(index - 1, 0),
                                1,
                            );
                        });
                }
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
                if (['dataset', 'compare'].includes(filterType)) {
                    dispatch(resetFilter({ fileId }));
                } else if (filterType === 'report') {
                    dispatch(resetReportFilter());
                }
                // In case of compare we need to reinitiate the compare process;
                if (filterType === 'compare') {
                    dispatch(restartCompare({ compareId: fileId }));
                }

                handleClose();
            } else if (newFilter.validateFilterString(finalFilter)) {
                newFilter.update(finalFilter);
                const basicFilter = {
                    ...newFilter.toBasicFilter(),
                    options: { caseInsensitive },
                };
                if (['dataset', 'compare'].includes(filterType)) {
                    dispatch(
                        setFilter({
                            fileId,
                            filter: basicFilter,
                            datasetName: dataset.name,
                        }),
                    );
                } else if (filterType === 'report') {
                    dispatch(
                        setReportFilter({ filter: basicFilter, reportTab }),
                    );
                }
                // In case of compare we need to reinitiate the compare process;
                if (filterType === 'compare') {
                    dispatch(restartCompare({ compareId: fileId }));
                }
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
            filterType,
            reportTab,
            fileId,
        ],
    );

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
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
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
                    </Stack>
                    {inputType === 'interactive' ? (
                        <InteractiveInput
                            filter={interactiveFilter}
                            onChange={handleChangeInteractive}
                            columnNames={columnNames}
                            columnTypes={columnTypes}
                            uniqueValues={uniqueValues}
                            onGetUniqueValues={getUniqueValues}
                        />
                    ) : (
                        <ManualInput
                            inputValue={inputValue}
                            handleSetInputValue={setInputValue}
                            datasetName={dataset.name}
                            fileId={fileId}
                            metadata={metadata}
                        />
                    )}
                    {['dataset', 'compare'].includes(filterType) && (
                        <>
                            <Typography
                                variant="h6"
                                sx={styles.recentFiltersTitle}
                            >
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
                                                        disabled={
                                                            !filterItem.isValid
                                                        }
                                                    />
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={filterForConversion.toString(
                                                        filterItem.filter,
                                                    )}
                                                    slotProps={{
                                                        primary:
                                                            filterItem.isValid
                                                                ? {
                                                                      color: 'textPrimary',
                                                                  }
                                                                : {
                                                                      color: 'textDisabled',
                                                                  },
                                                    }}
                                                />
                                                <Tooltip title="Edit filter">
                                                    <Box sx={styles.box}>
                                                        <IconButton
                                                            edge="end"
                                                            aria-label="edit"
                                                            disabled={
                                                                /* For interactive mode, cannot edit invalid filter */
                                                                !filterItem.isValid &&
                                                                inputType ===
                                                                    'interactive'
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
                                                    </Box>
                                                </Tooltip>
                                            </ListItem>
                                            {index <
                                                Math.min(
                                                    recentFilters.length,
                                                    10,
                                                ) -
                                                    1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                            </List>
                        </>
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

export default FilterBody;
