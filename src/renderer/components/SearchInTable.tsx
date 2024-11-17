import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { ISearchInTableProps } from 'interfaces/common';

const defaultSearchStyles = {
    searchField: {
        marginTop: 0,
        marginLeft: 1,
        marginRight: 1,
    },
    inputField: {
        '&.MuiAutocomplete-inputRoot': {
            paddingTop: 0,
            borderRadius: 0,
        },
    },
    inputAdornment: {
        alignSelf: 'normal',
    },
};

const SearchInTable: React.FC<ISearchInTableProps> = ({
    header,
    onSearchUpdate,
    searchStyles,
    width,
    margin,
    disabled,
}: ISearchInTableProps) => {
    // Search
    const searchFieldRef = useRef<HTMLElement>(null);
    const [options, setOptions] = useState<string[]>([]);

    useEffect(() => {
        // Get options from the header
        if (header.length > 0) {
            const dataOptions: string[] = [];
            header.forEach((column) => {
                if (column.hidden !== true && column.searchable !== false) {
                    dataOptions.push(`${column.id}:`);
                }
            });
            setOptions(dataOptions);
        }
    }, [header]);

    // Ctrl+F listener
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === '70') {
                searchFieldRef?.current?.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [searchFieldRef]);

    const handleSearchUpdate = (event: React.KeyboardEvent, value?: string) => {
        if (value !== undefined) {
            onSearchUpdate?.(value as string);
        } else if ((event.target as HTMLInputElement).value !== undefined) {
            onSearchUpdate?.(
                (event.target as HTMLInputElement).value as string
            );
        }
    };

    const handleChange = (
        event: React.KeyboardEvent,
        value: string,
        reason: string
    ) => {
        if (reason === 'selectOption') {
            // Do nothing
        } else if (reason === 'clear') {
            handleSearchUpdate(event, '');
        } else if (reason === 'createOption' && event?.key === 'Enter') {
            handleSearchUpdate(event, value);
        }
    };

    const handleSearchKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        // Need to handle special case when the input is blank, as the onChange event is not triggered by autocomplete
        if (
            event.key === 'Enter' &&
            (event.target as HTMLInputElement).value === ''
        ) {
            handleSearchUpdate(event);
        }
    };

    return (
        <Autocomplete
            clearOnEscape={false}
            options={options}
            disabled={disabled}
            freeSolo
            fullWidth
            onChange={(event, value, reason) => {
                handleChange(
                    event as React.KeyboardEvent<HTMLInputElement>,
                    value as string,
                    reason as string
                );
            }}
            sx={{ ...searchStyles?.searchField, maxWidth: width }}
            renderInput={(params) => (
                <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...params}
                    placeholder="Filter"
                    margin={margin}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    variant="filled"
                    sx={searchStyles?.searchField}
                    onKeyDown={handleSearchKeyDown}
                    InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        sx: searchStyles?.inputField,
                        startAdornment: (
                            <InputAdornment
                                disablePointerEvents
                                position="start"
                                sx={searchStyles?.inputAdornment}
                            >
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    inputRef={searchFieldRef}
                />
            )}
        />
    );
};

SearchInTable.defaultProps = {
    onSearchUpdate: () => {},
    searchStyles: defaultSearchStyles,
    width: 580,
    margin: 'dense',
    disabled: false,
};

export default SearchInTable;
