import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete, {
    AutocompleteChangeReason,
} from '@mui/material/Autocomplete';
import { closeModal, setGoTo } from 'renderer/redux/slices/ui';
import { IUiModal } from 'interfaces/common';

const styles = {
    dialog: {
        minWidth: '400px',
    },
};

const ModalGoTo: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const currentMetadata = useAppSelector(
        (state) => state.data.openedFileMetadata[state.ui.currentFileId],
    );
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
        if (!Number.isNaN(Number(inputValue))) {
            // If the input value is a number, go to the row number
            // Check the line is less than the total number of rows
            const rowNumber = Number(inputValue);
            if (rowNumber <= currentMetadata.records && rowNumber > 0) {
                dispatch(setGoTo({ row: rowNumber }));
                dispatch(closeModal({ type }));
            } else {
                setHelperText('Row number does not exist');
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
    }, [
        dispatch,
        currentMetadata.records,
        autoCompletecolumnNames,
        type,
        inputValue,
    ]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        if (!Number.isNaN(Number(event.target.value))) {
            setGoToType('Row');
        } else {
            setGoToType('Column');
        }
    };

    const handleOptionSelect = (
        _event: React.ChangeEvent<{}>,
        value: string | null,
        reason: AutocompleteChangeReason,
    ) => {
        if (reason === 'selectOption' && value) {
            setInputValue(value);
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
            <DialogTitle>Go To</DialogTitle>
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
                            label="Enter row number or column name"
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
            <DialogActions>
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

export default ModalGoTo;
