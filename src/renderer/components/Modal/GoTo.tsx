import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import Autocomplete, {
    AutocompleteChangeReason,
} from '@mui/material/Autocomplete';
import { closeModal, setGoTo } from 'renderer/redux/slices/ui';
import { IUiModal } from 'interfaces/common';

const styles = {
    dialog: {
        minWidth: '400px',
    },
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 1,
    },
};

const GoTo: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const { apiService } = useContext(AppContext);
    const currentMetadata = apiService.getOpenedFileMetadata(currentFileId);
    const [inputValue, setInputValue] = useState('');
    const [helperText, setHelperText] = useState('');
    const [goToType, setGoToType] = useState('Row');
    const autoCompletecolumnNames = currentMetadata.columns.map(
        (column) => column.name,
    );

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleGoTo = useCallback(() => {
        if (inputValue.includes(':')) {
            // Handle column:row format
            const [colPart, rowPart] = inputValue.split(':');
            const normalizedRowValue = rowPart.replace(/[\s.,]/g, '');
            const rowNumber = Number(normalizedRowValue);

            // Validate row part
            const isRowValid =
                !Number.isNaN(rowNumber) &&
                rowNumber > 0 &&
                rowNumber <= currentMetadata.records;

            // Validate column part
            const columnNames = autoCompletecolumnNames.map((name) =>
                name.toLowerCase(),
            );
            const isColumnValid = columnNames.includes(colPart.toLowerCase());

            if (isColumnValid && isRowValid) {
                dispatch(setGoTo({ column: colPart, row: rowNumber }));
                dispatch(closeModal({ type }));
            } else {
                let errorMessage = '';
                if (!isColumnValid)
                    errorMessage += 'Column name does not exist. ';
                if (!isRowValid)
                    errorMessage += `Row number must be between 1 and ${currentMetadata.records}.`;
                setHelperText(errorMessage.trim());
            }
        } else {
            const normalizedValue = inputValue.replace(/[\s.,]/g, '');
            if (!Number.isNaN(Number(normalizedValue))) {
                // If the input value is a number, go to the row number
                // Check the line is less than the total number of rows
                const rowNumber = Number(normalizedValue);
                if (rowNumber <= currentMetadata.records && rowNumber > 0) {
                    dispatch(setGoTo({ row: rowNumber }));
                    dispatch(closeModal({ type }));
                } else {
                    setHelperText(
                        `Row number does not exist (dataset has ${
                            currentMetadata.records
                        } rows)`,
                    );
                }
            } else {
                // If the input value is a string, go to the column name
                // Check if the column exists;
                const columnNames = autoCompletecolumnNames.map((name) =>
                    name.toLowerCase(),
                );
                if (columnNames.includes(inputValue.toLowerCase())) {
                    dispatch(setGoTo({ column: inputValue }));
                    dispatch(closeModal({ type }));
                } else {
                    setHelperText('Column name does not exist');
                }
            }
        }
    }, [
        dispatch,
        currentMetadata.records,
        autoCompletecolumnNames,
        type,
        inputValue,
    ]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        setHelperText('');

        if (event.target.value.includes(':')) {
            setGoToType('Column:Row');
        } else if (
            !Number.isNaN(Number(event.target.value.replace(/[\s.,]/g, '')))
        ) {
            setGoToType('Row');
        } else {
            setGoToType('Column');
        }
    };

    const handleOptionSelect = (
        event: React.ChangeEvent<{}>,
        value: string | null,
        reason: AutocompleteChangeReason,
    ) => {
        if (reason === 'selectOption' && value) {
            setInputValue(value);
            event.stopPropagation();
            setGoToType('Column');
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                handleGoTo();
                event.preventDefault();
            } else if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose, handleGoTo]);

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>Go To</DialogTitle>
            <DialogContent>
                <Autocomplete
                    freeSolo
                    options={autoCompletecolumnNames}
                    filterOptions={(options, state) => {
                        if (state.inputValue.length < 1) {
                            return [];
                        }
                        return options.filter((option) =>
                            option
                                .toLowerCase()
                                .includes(state.inputValue.toLowerCase()),
                        );
                    }}
                    onChange={handleOptionSelect}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Enter row number, column name, or column:row"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={inputValue}
                            onChange={handleInputChange}
                            helperText={helperText}
                            error={!!helperText}
                            autoFocus
                        />
                    )}
                />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleGoTo}
                    variant="contained"
                    color="primary"
                >
                    Go To {goToType}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GoTo;
