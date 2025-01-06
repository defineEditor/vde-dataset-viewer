import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { closeModal, openSnackbar } from 'renderer/redux/slices/ui';
import { addApi, updateApi } from 'renderer/redux/slices/api';
import { IApiRecord, IUiModalEditApi } from 'interfaces/common';

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

const EditApi: React.FC<IUiModalEditApi> = ({ type, data }) => {
    const { apiId } = data;
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const apiRecords = useAppSelector((state) => state.api.apiRecords);

    let initialApiRecord: IApiRecord;

    if (apiRecords[apiId] !== undefined) {
        initialApiRecord = apiRecords[apiId];
    } else {
        initialApiRecord = {
            id: '',
            address: '',
            name: '',
            key: '',
            lastAccessDate: 0,
        };
    }

    const [apiRecord, setApiRecord] = useState<IApiRecord>(initialApiRecord);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleAddApi = useCallback(() => {
        const testAndAddApi = async () => {
            // Check if can connect to api
            const result = await apiService.getApiAbout(apiRecord);
            const updatedApiRecord: IApiRecord = {
                ...apiRecord,
                id: apiRecord.address,
                lastAccessDate: Date.now(),
            };

            if (result !== null) {
                if (apiId === '') {
                    // New API is added
                    dispatch(addApi(updatedApiRecord));
                } else {
                    dispatch(updateApi({ apiId, apiRecord: updatedApiRecord }));
                }
                dispatch(closeModal({ type }));
                dispatch(
                    openSnackbar({
                        type: 'success',
                        message: `Connected to ${apiRecord.address}`,
                    }),
                );
            } else {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: 'Could not connect to the new API',
                    }),
                );
            }
        };

        testAndAddApi();
    }, [dispatch, apiRecord, type, apiService, apiId]);

    const handleInputChange =
        (field: keyof IApiRecord) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setApiRecord({ ...apiRecord, [field]: event.target.value });
        };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 's') {
                handleAddApi();
            } else if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose, handleAddApi]);

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>API Record</DialogTitle>
            <DialogContent>
                <TextField
                    label="Address"
                    value={apiRecord.address}
                    onChange={handleInputChange('address')}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Name"
                    value={apiRecord.name}
                    onChange={handleInputChange('name')}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Key"
                    value={apiRecord.key}
                    onChange={handleInputChange('key')}
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleAddApi}
                    variant="contained"
                    color="primary"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditApi;
