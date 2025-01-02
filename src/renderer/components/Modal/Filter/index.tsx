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
import { closeModal } from 'renderer/redux/slices/ui';
import FilterInput from 'renderer/components/Modal/Filter/FilterInput';
import validateFilterString from 'renderer/components/Modal/Filter/validateFilterString';
import stringToFilter from 'renderer/components/Modal/Filter/stringToFilter';
import filterToString from 'renderer/components/Modal/Filter/filterToString';
import AppContext from 'renderer/utils/AppContext';
import { setFilter, resetFilter } from 'renderer/redux/slices/data';
import { IUiModal } from 'interfaces/common';
import { Stack } from '@mui/material';

const styles = {
    dialog: {
        minWidth: '600px',
        width: '60%',
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

    const lastOptions = useAppSelector(
        (state) => state.data.filterData.lastOptions,
    );
    const [caseInsensitive, setCaseInsensitive] = useState(
        lastOptions?.caseInsensitive ?? true,
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const metadata = apiService.getOpenedFileMetadata(currentFileId);

    const columnNames = metadata.columns.map((column) =>
        column.name.toLowerCase(),
    );

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
    const handleSetFilter = useCallback(() => {
        if (inputValue === '') {
            dispatch(resetFilter());
            handleClose();
        } else if (validateFilterString(inputValue, columnNames, columnTypes)) {
            const filter = {
                ...stringToFilter(inputValue, columnTypes),
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
    ]);

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

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>Filter Data</DialogTitle>
            <DialogContent>
                <Stack spacing={2} direction="row">
                    <FilterInput
                        inputValue={inputValue}
                        handleSetInputValue={setInputValue}
                        columnNames={columnNames}
                        columnTypes={columnTypes}
                        datasetName={dataset.name}
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
