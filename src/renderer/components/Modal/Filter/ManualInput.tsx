import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useContext,
} from 'react';
import Filter from 'js-array-filter';
import { useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import CommandAutocompleteInput from 'renderer/components/Common/CommandAutocompleteInput';
import type { DatasetJsonMetadata } from 'interfaces/common';

const styles = {
    input: {
        width: '100%',
    },
};

const ManualInput: React.FC<{
    inputValue: string;
    handleSetInputValue: (_value: string) => void;
    datasetName: string;
    fileId: string;
    metadata: DatasetJsonMetadata;
}> = ({ inputValue, handleSetInputValue, datasetName, fileId, metadata }) => {
    const { apiService } = useContext(AppContext);
    const [error, setError] = useState(false);
    const [warning, setWarning] = useState(false);
    const settings = useAppSelector((state) => state.settings);

    const filterForValidation = useMemo(() => {
        return new Filter('dataset-json1.1', metadata.columns, '');
    }, [metadata.columns]);

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
            .map(({ filter }) => filterForValidation.toString(filter));
        return result;
    }, [recentFilters, datasetName, filterForValidation]);

    // Check filter on change
    useEffect(() => {
        if (filterForValidation.validateFilterString(inputValue)) {
            setWarning(false);
        } else {
            setWarning(true);
        }
    }, [inputValue, filterForValidation]);

    const allColumnNames = useMemo(
        () => metadata.columns.map((column) => column.name),
        [metadata.columns],
    );

    const columnTypes = useMemo(() => {
        const types: Record<string, 'numeric' | 'string' | 'boolean'> = {};
        metadata.columns.forEach((column) => {
            if (
                ['integer', 'float', 'double', 'number'].includes(
                    column.dataType,
                )
            ) {
                types[column.name] = 'numeric';
            } else if (['boolean'].includes(column.dataType)) {
                types[column.name] = 'boolean';
            } else {
                types[column.name] = 'string';
            }
        });
        return types;
    }, [metadata.columns]);

    const handleInputChange = useCallback(
        (value: string) => {
            if (error) {
                setError(false);
            }
            handleSetInputValue(value);
        },
        [error, handleSetInputValue],
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            if (warning) {
                setError(true);
            }
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
        <CommandAutocompleteInput
            value={inputValue}
            onValueChange={handleInputChange}
            historyOptions={recentFilterStrings}
            category="filter"
            mode="filter"
            label="Filter"
            helperText={error ? 'Invalid filter' : ''}
            error={error}
            autoFocus
            onInputKeyDown={handleKeyDown}
            sx={styles.input}
            textFieldProps={{
                margin: 'dense',
                color,
                size: 'small',
            }}
            allColumnNames={allColumnNames}
            columnTypes={columnTypes}
            metadata={metadata}
            currentFileId={fileId}
            apiService={apiService}
            settings={settings}
        />
    );
};

export default ManualInput;
