import React from 'react';
import { useAppDispatch } from 'renderer/redux/hooks';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
    closeModal,
} from 'renderer/redux/slices/ui';
import { IUiModal } from 'interfaces/common';

const styles = {
    dialog: {
        minWidth: '400px',
    },
};

const ModalGoTo: React.FC<IUiModal> = (props: IUiModal) => {
    const dispatch = useAppDispatch();

    const handleClose = () => {
        dispatch(closeModal({ type: props.type }));
    }

    return (
        <Dialog open={true} onClose={handleClose} PaperProps={{sx: {...styles.dialog}}}>
            <DialogTitle>Go To</DialogTitle>
            <DialogContent>
                <TextField
                    label="Enter row number or column name"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button variant="contained" color="primary">
                    Go To
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalGoTo;
