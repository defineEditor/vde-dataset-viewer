import React, { useState, useMemo } from 'react';
import { TextField, Autocomplete } from '@mui/material';
import { useAppSelector } from 'renderer/redux/hooks';
import validateFilterString from 'renderer/components/Modal/Filter/validateFilterString';
import filterToString from 'renderer/components/Modal/Filter/filterToString';

const styles = {
    input: {
        width: '100%',
    },
};

const ManualInput: React.FC<{
    inputValue: string;
    handleSetInputValue: (_value: string) => void;
    columnNames: string[];
    columnTypes: Record<string, 'string' | 'number' | 'boolean'>;
    datasetName: string;
}> = ({
    inputValue,
    handleSetInputValue,
    columnNames,
    columnTypes,
    datasetName,
}) => {
    const [error, setError] = useState(false);
    const [warning, setWarning] = useState(false);

    const recentFilters = useAppSelector(
        (state) => state.data.filterData.recentFilters,
    );

    // Sort by date, but current dataset has the highest priority
    const recentFilterStrings = useMemo(() => {
        const result = recentFilters
            .slice()
            .sort(
                (a, b) =>
                    b.date * (b.datasetName === datasetName ? 10000 : 1) -
                    a.date / (a.datasetName === datasetName ? 10000 : 1),
            )
            .map(({ filter }) => filterToString(filter));
        return result;
    }, [recentFilters, datasetName]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        if (error) {
            setError(false);
        }
        if (validateFilterString(value, columnNames, columnTypes)) {
            setWarning(false);
        } else {
            setWarning(true);
        }
        handleSetInputValue(value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            if (warning) {
                setError(true);
            }
        }
    };

    const handleRecentFilterChange = (
        event: React.SyntheticEvent,
        value: string | null,
        reason: string,
    ) => {
        if (reason === 'selectOption') {
            handleSetInputValue(value || '');
            // Prevent the Enter from activating the filter
            event.stopPropagation();
        }
        if (value) {
            handleSetInputValue(value);
        }
    };

    let color: 'primary' | 'error' | 'warning' | 'success' = 'primary';
    if (error) {
        color = 'error';
    } else if (warning) {
        color = 'warning';
    } else if (inputValue !== '') {
        color = 'success';
    }

    return (
        <Autocomplete
            freeSolo
            options={recentFilterStrings}
            value={inputValue}
            onInputChange={handleRecentFilterChange}
            sx={styles.input}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Filter"
                    autoFocus
                    margin="dense"
                    color={color}
                    size="small"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    error={error}
                    helperText={error ? 'Invalid filter' : ''}
                />
            )}
        />
    );
};

export default ManualInput;
