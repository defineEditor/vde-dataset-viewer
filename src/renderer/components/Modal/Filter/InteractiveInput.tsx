import React from 'react';
import {
    TextField,
    Button,
    Stack,
    IconButton,
    Autocomplete,
    MenuItem,
    Box,
    Fab,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import { AutocompleteChangeReason } from '@mui/material/Autocomplete';
import {
    operatorLabels,
    stringOperators,
    numberOperators,
    booleanOperators,
    operatorHumanFriendlyLabels,
    filterRegex,
} from 'js-array-filter';
import { BasicFilter, Connector, FilterCondition } from 'interfaces/common';

const styles = {
    columnSelect: {
        minWidth: '150px',
    },
    operator: {
        width: '140px',
        mt: 2,
    },
    valueSelect: {
        minWidth: '250px',
    },
    connector: {
        width: '70px',
        textAlign: 'center',
    },
};

const updateConditionVariable = (
    condition: FilterCondition,
    newVariable: string,
    columnTypes: Record<string, 'string' | 'number' | 'boolean'>,
): FilterCondition => {
    const newCondition = { ...condition };
    newCondition.variable = newVariable;
    // Check if the operator matches the new column type
    const columnType = columnTypes[newVariable.toLowerCase()];
    if (columnType === 'string') {
        if (!stringOperators.includes(newCondition.operator)) {
            newCondition.operator = 'eq';
        }
        newCondition.value = '';
    } else if (columnType === 'number') {
        if (!numberOperators.includes(newCondition.operator)) {
            newCondition.operator = 'eq';
        }
        newCondition.value = null;
    } else if (columnType === 'boolean') {
        if (!booleanOperators.includes(newCondition.operator)) {
            newCondition.operator = 'eq';
        }
        newCondition.value = null;
    }
    return newCondition;
};

const handleSingleValue = (
    value: string,
    columnType: 'string' | 'number' | 'boolean',
    handleNull: boolean = true,
): string | number | boolean | null => {
    let newValue: string | number | boolean | null;

    if (value === 'null' && handleNull) {
        newValue = null;
    } else if (columnType === 'string') {
        newValue = value;
    } else if (columnType === 'number') {
        if (value === '') {
            newValue = null;
        } else {
            newValue = parseFloat(value);
        }
    } else if (columnType === 'boolean') {
        if (value === '') {
            newValue = null;
        } else {
            newValue = value === 'true';
        }
    } else {
        newValue = value;
    }
    return newValue;
};

const updateConditionValue = (
    condition: FilterCondition,
    newValue: string | string[],
    columnTypes: Record<string, 'string' | 'number' | 'boolean'>,
): FilterCondition => {
    const newCondition = { ...condition };
    const columnType = columnTypes[condition.variable.toLowerCase()];
    if (Array.isArray(newValue)) {
        newCondition.value = newValue.map((value) =>
            handleSingleValue(value, columnType, false),
        ) as unknown as string[] | number[];
    } else {
        newCondition.value = handleSingleValue(newValue, columnType);
    }
    return newCondition;
};

const ValueAutocomplete: React.FC<{
    condition: FilterCondition;
    columnTypes: Record<string, 'string' | 'number' | 'boolean'>;
    columnNames: string[];
    uniqueValues: { [key: string]: Array<string | boolean | number> };
    onSelectChange: (
        _event: React.ChangeEvent<{}>,
        value: string | string[] | null,
        reason: AutocompleteChangeReason,
    ) => void;
    onInputChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void;
}> = ({
    condition,
    columnTypes,
    columnNames,
    onSelectChange,
    onInputChange,
    uniqueValues,
}) => {
    const columnType = columnTypes[condition.variable.toLowerCase()];
    const isMultiple = ['in', 'notin'].includes(condition.operator);
    let textValue: string | string[];
    if (isMultiple) {
        if (['number', 'boolean'].includes(columnType)) {
            textValue =
                condition.value === null || !Array.isArray(condition.value)
                    ? []
                    : (condition.value.map((value) =>
                          value.toString(),
                      ) as string[]);
        } else {
            textValue =
                condition.value === null || !Array.isArray(condition.value)
                    ? []
                    : (condition.value as string[]);
        }
    } else if (['number', 'boolean'].includes(columnType)) {
        textValue = condition.value === null ? '' : condition.value.toString();
    } else {
        textValue = condition.value as string;
    }

    // Get proper column name
    const columnName = columnNames.find(
        (name) => name.toLowerCase() === condition.variable.toLowerCase(),
    );

    let valueOptions: string[] = [];

    if (columnName !== undefined && uniqueValues[columnName]) {
        valueOptions = uniqueValues[columnName].map((value) =>
            value === null ? 'null' : value.toString(),
        );
    }

    return (
        <Autocomplete
            freeSolo
            multiple={isMultiple}
            sx={styles.valueSelect}
            options={valueOptions}
            value={textValue}
            filterOptions={(options, state) => {
                const filteredOptions = options.filter((option) =>
                    option
                        .toLowerCase()
                        .includes(state.inputValue.toLowerCase()),
                );
                const isNew = !filteredOptions.includes(state.inputValue);
                if (isNew) {
                    filteredOptions.push(state.inputValue);
                }
                return filteredOptions;
            }}
            onChange={onSelectChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Value"
                    variant="outlined"
                    type={
                        columnTypes[condition.variable.toLowerCase()] ===
                        'number'
                            ? 'number'
                            : 'text'
                    }
                    fullWidth
                    margin="normal"
                    onChange={isMultiple ? () => {} : onInputChange}
                    autoFocus
                />
            )}
        />
    );
};

const InteractiveInput: React.FC<{
    filter: BasicFilter | null;
    onChange: (_filter: BasicFilter) => void;
    columnNames: string[];
    columnTypes: Record<string, 'string' | 'number' | 'boolean'>;
    uniqueValues: { [key: string]: Array<string | boolean | number> };
}> = ({ columnNames, columnTypes, filter, onChange, uniqueValues }) => {
    let nonNullFilter: BasicFilter;
    if (filter === null || filter.conditions.length === 0) {
        nonNullFilter = {
            conditions: [{ variable: '', operator: 'eq', value: '' }],
            connectors: [],
        };
    } else {
        nonNullFilter = filter;
    }

    const { conditions } = nonNullFilter;
    const { connectors } = nonNullFilter;

    const handleAddCondition = (connector: Connector) => {
        const newCondition = {
            variable: '',
            operator: 'eq' as FilterCondition['operator'],
            value: '',
        };
        const newConditions = [...conditions, newCondition];
        const newFilter = {
            conditions: newConditions,
            connectors: [...connectors, connector],
        };
        onChange(newFilter);
    };

    const handleRemoveCondition = (index: number) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        const newConnectors = connectors.filter((_, i) => i !== index - 1);
        const newFilter = {
            conditions: newConditions,
            connectors: newConnectors,
        };
        onChange(newFilter);
    };

    const handleColumnSelect =
        (index: number) =>
        (
            event: React.ChangeEvent<{}>,
            value: string | null,
            reason: AutocompleteChangeReason,
        ) => {
            event.stopPropagation();
            if (reason === 'selectOption' && value) {
                const newCondition = updateConditionVariable(
                    conditions[index],
                    value,
                    columnTypes,
                );
                const newConditions = [...conditions];
                newConditions[index] = newCondition;
                const newFilter = {
                    conditions: newConditions,
                    connectors,
                };
                onChange(newFilter);
            }
        };

    const handleColumnChange =
        (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const newCondition = updateConditionVariable(
                conditions[index],
                event.target.value,
                columnTypes,
            );
            const newConditions = [...conditions];
            newConditions[index] = newCondition;
            const newFilter = {
                conditions: newConditions,
                connectors,
            };
            onChange(newFilter);
        };

    const handleOperatorChange =
        (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const newCondition = { ...conditions[index] };
            newCondition.operator = event.target
                .value as FilterCondition['operator'];
            if (filterRegex.function.test(newCondition.operator)) {
                newCondition.isFunction = true;
                newCondition.value = null;
            } else if (newCondition.isFunction) {
                delete newCondition.isFunction;
            }
            const newConditions = [...conditions];
            newConditions[index] = newCondition;
            const newFilter = {
                conditions: newConditions,
                connectors,
            };
            onChange(newFilter);
        };

    const handleValueSelect =
        (index: number) =>
        (
            event: React.ChangeEvent<{}>,
            value: string | string[] | null,
            reason: AutocompleteChangeReason,
        ) => {
            event.stopPropagation();
            if (reason === 'selectOption' && value) {
                const newCondition = updateConditionValue(
                    conditions[index],
                    value,
                    columnTypes,
                );
                const newConditions = [...conditions];
                newConditions[index] = newCondition;
                const newFilter = {
                    conditions: newConditions,
                    connectors,
                };
                onChange(newFilter);
            } else if (reason === 'removeOption') {
                const newCondition = updateConditionValue(
                    conditions[index],
                    value || [],
                    columnTypes,
                );
                const newConditions = [...conditions];
                newConditions[index] = newCondition;
                const newFilter = {
                    conditions: newConditions,
                    connectors,
                };
                onChange(newFilter);
            }
        };

    const handleValueChange =
        (index: number) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newCondition = updateConditionValue(
                conditions[index],
                event.target.value,
                columnTypes,
            );
            const newConditions = [...conditions];
            newConditions[index] = newCondition;
            const newFilter = {
                conditions: newConditions,
                connectors,
            };
            onChange(newFilter);
        };

    const toggleConnector = (index: number) => {
        const newConnectors = [...connectors];
        newConnectors[index - 1] =
            connectors[index - 1] === 'and' ? 'or' : 'and';
        const newFilter = {
            conditions,
            connectors: newConnectors,
        };
        onChange(newFilter);
    };

    return (
        <div>
            {conditions.map((condition, index) => (
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                >
                    {index === 0 ? (
                        <Box sx={styles.connector}>
                            <Fab
                                color="primary"
                                size="small"
                                onClick={() =>
                                    handleAddCondition(
                                        connectors[index - 1] === 'and'
                                            ? 'or'
                                            : 'and',
                                    )
                                }
                            >
                                <AddIcon />
                            </Fab>
                        </Box>
                    ) : (
                        <Box sx={styles.connector}>
                            <Button
                                variant="contained"
                                onClick={() => toggleConnector(index)}
                            >
                                {connectors[index - 1]}
                            </Button>
                        </Box>
                    )}
                    <Autocomplete
                        freeSolo
                        sx={styles.columnSelect}
                        options={columnNames.map((name) => name.toUpperCase())}
                        value={condition.variable.toUpperCase()}
                        filterOptions={(options, state) => {
                            return options.filter((option) =>
                                option
                                    .toLowerCase()
                                    .includes(state.inputValue.toLowerCase()),
                            );
                        }}
                        onChange={handleColumnSelect(index)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Column"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                onChange={handleColumnChange(index)}
                                autoFocus
                            />
                        )}
                    />
                    <Box>
                        <TextField
                            label="Operator"
                            select
                            variant="outlined"
                            fullWidth
                            sx={styles.operator}
                            margin="normal"
                            value={condition.operator}
                            onChange={handleOperatorChange(index)}
                            autoFocus
                        >
                            {Object.keys(operatorLabels)
                                .filter((operator) => {
                                    const columnType =
                                        columnTypes[
                                            condition.variable.toLowerCase()
                                        ];
                                    if (columnType === 'string') {
                                        return stringOperators.includes(
                                            operator,
                                        );
                                    }
                                    if (columnType === 'number') {
                                        return numberOperators.includes(
                                            operator,
                                        );
                                    }
                                    if (columnType === 'boolean') {
                                        return booleanOperators.includes(
                                            operator,
                                        );
                                    }

                                    if (operator === 'eq') {
                                        return true;
                                    }
                                    return false;
                                })
                                .map((operator) => (
                                    <MenuItem key={operator} value={operator}>
                                        {operatorHumanFriendlyLabels[operator]}
                                    </MenuItem>
                                ))}
                        </TextField>
                    </Box>
                    {condition.isFunction !== true && (
                        <ValueAutocomplete
                            condition={condition}
                            columnTypes={columnTypes}
                            columnNames={columnNames}
                            uniqueValues={uniqueValues}
                            onSelectChange={handleValueSelect(index)}
                            onInputChange={handleValueChange(index)}
                        />
                    )}
                    {index > 0 && (
                        <IconButton
                            onClick={() => handleRemoveCondition(index)}
                        >
                            <RemoveCircleOutlineIcon />
                        </IconButton>
                    )}
                </Stack>
            ))}
        </div>
    );
};

export default InteractiveInput;
