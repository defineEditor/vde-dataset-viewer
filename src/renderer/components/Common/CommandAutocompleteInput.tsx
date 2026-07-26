import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Autocomplete,
    AutocompleteInputChangeReason,
    Box,
    TextField,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material/styles';
import type {
    CommandAutocompleteCategory,
    DatasetJsonMetadata,
    ISettings,
    UniqueValuesApi,
    FilterValueOptions,
    ColumnType,
} from '@interfaces/common';
import { useCommandAutocomplete } from '@components/hooks/useCommandAutocomplete';
import { getLastFilterCondition } from '@components/hooks/useCommandAutocomplete/utils';

const styles = {
    showAllValuesLi: {
        pointerEvents: 'none',
        opacity: 1,
        '&.MuiAutocomplete-option[aria-disabled="true"]': {
            pointerEvents: 'none',
            opacity: 1,
        },
    },
    chip: {
        height: 15,
        fontSize: 10,
    },
    variableValue: {
        alignItems: 'center',
    },
};

type CommandAutocompleteMode = 'command' | 'filter';

interface CommandAutocompleteInputProps {
    value: string;
    onValueChange: (nextValue: string) => void;
    allColumnNames: string[];
    columnTypes: Record<string, ColumnType>;
    currentFileId: string;
    apiService: UniqueValuesApi;
    settings: ISettings;
    onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    label: string;
    metadata?: DatasetJsonMetadata;
    historyOptions?: string[];
    category?: CommandAutocompleteCategory;
    mode?: CommandAutocompleteMode;
    onSubmit?: () => void;
    onEscape?: () => void;
    placeholder?: string;
    helperText?: React.ReactNode;
    error?: boolean;
    autoFocus?: boolean;
    sx?: SxProps<Theme>;
    textFieldProps?: Omit<
        TextFieldProps,
        | 'autoFocus'
        | 'error'
        | 'fullWidth'
        | 'helperText'
        | 'inputRef'
        | 'label'
        | 'onChange'
        | 'onKeyDown'
        | 'placeholder'
        | 'value'
    >;
    inputRef?: React.RefObject<HTMLInputElement>;
}

const handleRenderOption = (
    props: React.HTMLAttributes<HTMLLIElement> & {
        key: React.Key;
    },
    option: string | React.ReactNode | FilterValueOptions[number],
    _state,
    _ownerState,
): string | React.ReactNode => {
    const { key, ...optionProps } = props;
    const isObject =
        typeof option === 'object' && option !== null && 'value' in option;
    if (
        isObject &&
        option.value === '_show_all_values_' &&
        option.type === 'header'
    ) {
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
            {isObject ? (
                option.type === 'value' ? (
                    option.value
                ) : (
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={styles.variableValue}
                    >
                        <Typography variant="body1">{option.value}</Typography>
                        <Chip
                            label="col"
                            size="small"
                            color="primary"
                            sx={styles.chip}
                        />
                    </Stack>
                )
            ) : (
                option
            )}
        </Box>
    );
};

const buildMissingOperatorValue = ({
    mode,
    operator,
    columnId,
    value,
}: {
    mode: CommandAutocompleteMode;
    operator: string;
    columnId: string;
    value: string;
}): string => {
    if (mode === 'filter') {
        const lastCondition = getLastFilterCondition(value);
        const prefix = value.slice(0, value.length - lastCondition.length);
        return `${prefix}${operator}(${columnId})`;
    }

    const commandParts = value.split(';');
    const updatedCommand = `${value.replace(/^(\s*\S+).*/, '$1')} ${operator}(${columnId})`;
    commandParts.splice(commandParts.length - 1, 1, updatedCommand);
    return commandParts.join(';');
};

const CommandAutocompleteInput: React.FC<CommandAutocompleteInputProps> = ({
    value,
    onValueChange,
    allColumnNames,
    columnTypes,
    currentFileId,
    apiService,
    settings,
    mode = 'command',
    label,
    error = false,
    autoFocus = false,
    metadata = undefined,
    historyOptions = [],
    category = undefined,
    onSubmit = undefined,
    onEscape = undefined,
    onInputKeyDown = undefined,
    placeholder = undefined,
    helperText = undefined,
    sx = undefined,
    textFieldProps = undefined,
    inputRef = undefined,
}) => {
    const internalInputRef = useRef<HTMLInputElement | null>(null);
    const resolvedInputRef = inputRef ?? internalInputRef;

    const [historyRequested, setHistoryRequested] = useState(false);
    const [allValuesColumns, setAllValuesColumns] = useState<string[]>([]);
    const [isInitialInput, setIsInitialInput] = useState(true);

    const { commandAutocomplete, isAutocompleteLoading, resolvedCategory } =
        useCommandAutocomplete({
            apiService,
            allColumnNames,
            category: historyRequested ? 'history' : category,
            columnTypes,
            allValuesColumns,
            command: value,
            currentFileId,
            historyOptions,
            metadata,
            settings,
        });

    const [autocompleteOpen, setAutocompleteOpen] = useState(false);

    useEffect(() => {
        setAutocompleteOpen((prevValue) => {
            if (
                prevValue === false &&
                commandAutocomplete?.tokenType === 'value' &&
                commandAutocomplete.options.length === 1 &&
                typeof commandAutocomplete.options[0] === 'object' &&
                commandAutocomplete.replaceEnd -
                    commandAutocomplete.replaceStart ===
                    commandAutocomplete.options[0].value.length
            ) {
                return false;
            }
            if (mode === 'filter') {
                if (isInitialInput === true) {
                    // If we are in filter and user has not typed anything
                    return false;
                }
            }
            return Boolean(
                commandAutocomplete &&
                (commandAutocomplete.options.length > 0 ||
                    commandAutocomplete.loadingColumnId),
            );
        });
    }, [commandAutocomplete, mode, isInitialInput]);

    const handleOpen = useCallback(
        (event: React.SyntheticEvent) => {
            if (event.type === 'click') {
                setHistoryRequested(true);
                if (mode === 'filter') {
                    setIsInitialInput(false);
                }
            }
        },
        [mode],
    );

    const handleInputChange = useCallback(
        (
            event: React.SyntheticEvent,
            nextValue: string,
            reason: AutocompleteInputChangeReason,
        ) => {
            if (reason === 'selectOption') {
                event.stopPropagation();
                setAutocompleteOpen(false);

                if (resolvedCategory === 'history' || !commandAutocomplete) {
                    onValueChange(nextValue);
                    setHistoryRequested(false);
                    requestAnimationFrame(() => {
                        resolvedInputRef.current?.focus();
                        resolvedInputRef.current?.setSelectionRange(
                            nextValue.length,
                            nextValue.length,
                        );
                    });
                    return;
                }

                let updatedValue = '';
                if (
                    commandAutocomplete.tokenType === 'operator' &&
                    ['missing', 'notMissing'].includes(nextValue)
                ) {
                    updatedValue = buildMissingOperatorValue({
                        mode,
                        operator: nextValue,
                        columnId: commandAutocomplete.columnId,
                        value,
                    });
                } else {
                    let suffix = commandAutocomplete.insertSuffix || '';
                    if (
                        ['in', 'notin'].includes(nextValue.toLowerCase()) &&
                        commandAutocomplete.tokenType === 'operator'
                    ) {
                        suffix += '(';
                    }
                    updatedValue = `${value.slice(
                        0,
                        commandAutocomplete.replaceStart,
                    )}${nextValue}${suffix}${value.slice(
                        commandAutocomplete.replaceEnd,
                    )}`;
                }

                onValueChange(updatedValue);
                setHistoryRequested(false);
                if (isInitialInput) {
                    setIsInitialInput(false);
                }
                return;
            }

            if (reason === 'reset') {
                return;
            }

            if (reason === 'clear') {
                setAutocompleteOpen(false);
            }

            if (isInitialInput) {
                setIsInitialInput(false);
            }
            const lastWord = nextValue.split(' ')?.at(-1) ?? '';
            if (
                commandAutocomplete?.tokenType === 'operator' &&
                ['in', 'notin'].includes(lastWord.toLowerCase())
            ) {
                // Automatically add opening parenthesis
                onValueChange(`${nextValue} (`);
            } else if (
                commandAutocomplete?.tokenType === 'value' &&
                commandAutocomplete.insertSuffix === ', ' &&
                /["\d], \)$/.test(nextValue)
            ) {
                // Automatically remove extra comma when user adds closing parenthesis
                onValueChange(`${nextValue.slice(0, -3)})`);
            } else {
                onValueChange(nextValue);
            }
        },
        [
            commandAutocomplete,
            mode,
            onValueChange,
            resolvedCategory,
            resolvedInputRef,
            value,
            isInitialInput,
        ],
    );

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'ArrowDown' && value.trim() === '') {
                setHistoryRequested(true);
                setIsInitialInput(false);
                event.preventDefault();
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                if (historyRequested) {
                    setHistoryRequested(false);
                    return;
                }
                if (autocompleteOpen) {
                    setAutocompleteOpen(false);
                    return;
                }
                if (onEscape) {
                    onEscape();
                }
                return;
            }

            if (event.key === 'Enter' && onSubmit && !autocompleteOpen) {
                event.preventDefault();
                onSubmit();
            }

            if (
                event.key === 'Enter' &&
                mode === 'filter' &&
                autocompleteOpen
            ) {
                // We selected a value and we do not want to validate it at this moment
                event.preventDefault();
                return;
            }

            if (event.key === 'Tab' && commandAutocomplete?.columnId) {
                event.preventDefault();
                setAllValuesColumns((prev) => {
                    if (prev.includes(commandAutocomplete.columnId)) {
                        return prev;
                    }
                    return [...prev, commandAutocomplete.columnId];
                });
            }

            onInputKeyDown?.(event);
        },
        [
            autocompleteOpen,
            commandAutocomplete?.columnId,
            onEscape,
            onInputKeyDown,
            onSubmit,
            historyRequested,
            value,
            mode,
        ],
    );

    return (
        <Autocomplete
            freeSolo
            forcePopupIcon={value === ''}
            onOpen={value === '' ? handleOpen : undefined}
            options={commandAutocomplete?.options ?? []}
            open={autocompleteOpen}
            loading={isAutocompleteLoading}
            inputValue={value}
            onInputChange={handleInputChange}
            getOptionLabel={(option) =>
                typeof option === 'string'
                    ? option
                    : typeof option === 'object' &&
                        option !== null &&
                        'value' in option
                      ? option.value
                      : String(option)
            }
            renderOption={handleRenderOption}
            onClose={() => {
                if (historyRequested) {
                    setHistoryRequested(false);
                }
                if (value === '' && mode === 'filter') {
                    setIsInitialInput(true);
                }
            }}
            filterOptions={(options) => options}
            sx={sx}
            renderInput={(params) => (
                <TextField
                    {...params}
                    {...textFieldProps}
                    autoFocus={autoFocus}
                    inputRef={resolvedInputRef}
                    fullWidth
                    label={label}
                    placeholder={placeholder}
                    helperText={helperText}
                    error={error}
                    onKeyDown={handleInputKeyDown}
                />
            )}
        />
    );
};

export default CommandAutocompleteInput;
