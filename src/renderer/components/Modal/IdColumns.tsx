import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
} from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { closeModal, setDatasetIdColumns } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '70%', lg: '50%', xl: '50%' },
    },
    actions: {
        m: 2,
    },
    field: {
        mt: 2,
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
};

interface IdColumnOption {
    id: string;
    label: string;
}

const IdColumns: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentIdCols = useAppSelector(
        (state) => state.ui.control[currentFileId]?.idCols || [],
    );

    const metadata = apiService.getOpenedFileMetadata(currentFileId);
    const columnOptions: IdColumnOption[] =
        metadata?.columns.map((col) => ({
            id: col.name,
            label: col.name,
        })) || [];

    const [idCols, setIdCols] = useState<string[]>(currentIdCols);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type: modals.IDCOLUMNS }));
    }, [dispatch]);

    const handleApply = useCallback(() => {
        dispatch(
            setDatasetIdColumns({
                fileId: currentFileId,
                idCols,
            }),
        );
        handleClose();
    }, [currentFileId, dispatch, handleClose, idCols]);

    const handleReset = useCallback(() => {
        dispatch(
            setDatasetIdColumns({
                fileId: currentFileId,
                idCols: [],
            }),
        );
        handleClose();
    }, [currentFileId, dispatch, handleClose]);

    useEffect(() => {
        setIdCols(currentIdCols);
    }, [currentIdCols]);

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>ID Columns</DialogTitle>
            <DialogContent>
                <Autocomplete
                    multiple
                    sx={styles.field}
                    options={columnOptions}
                    value={idCols
                        .map((item) =>
                            columnOptions.find((option) => option.id === item),
                        )
                        .filter((option): option is IdColumnOption => !!option)}
                    onChange={(_event, newValue) => {
                        setIdCols(newValue.map((option) => option.id));
                    }}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Columns"
                            placeholder="Select ID columns"
                            fullWidth
                        />
                    )}
                />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleReset} color="primary">
                    Reset
                </Button>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleApply}
                    color="primary"
                    variant="contained"
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default IdColumns;
