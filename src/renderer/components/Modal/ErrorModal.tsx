import React, { useCallback, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAppDispatch } from 'renderer/redux/hooks';
import {
    closeModal,
    setPathname,
    openSnackbar,
} from 'renderer/redux/slices/ui';
import { IUiModalMessage } from 'interfaces/store';
import { paths } from 'misc/constants';

const openLink = (event) => {
    event.preventDefault();
    window.open(event.target.href, '_blank');
};

const styles = {
    dialog: {
        minWidth: '30%',
        maxHeight: '80%',
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 2,
    },
    supportText: {
        marginTop: 2,
    },
};

const ErrorModal: React.FC<IUiModalMessage> = ({ type, data }) => {
    const dispatch = useAppDispatch();

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
        dispatch(setPathname({ pathname: paths.SELECT }));
    }, [dispatch, type]);

    const handleCopyError = useCallback(() => {
        window.electron.writeToClipboard(data.message);
        dispatch(
            openSnackbar({
                message: 'Error message copied to clipboard',
                type: 'success',
                props: { duration: 1000 },
            }),
        );
    }, [data.message, dispatch]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose]);

    return (
        <Dialog open onClose={handleClose} PaperProps={{ sx: styles.dialog }}>
            <DialogTitle sx={styles.title}>An Error Occurred</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Something went wrong in the application.
                    <br />
                    {data.message}
                </DialogContentText>
                <Box sx={styles.supportText}>
                    <DialogContentText>
                        For support, write to{' '}
                        <a
                            href="mailto:support@defineeditor.com"
                            onClick={openLink}
                        >
                            support@defineeditor.com
                        </a>
                        , join our{' '}
                        <a href="https://t.me/defineeditor" onClick={openLink}>
                            Telegram
                        </a>{' '}
                        or{' '}
                        <a
                            href="https://chat.whatsapp.com/HpBqZZboqCJ2fp7gOpxRZR"
                            onClick={openLink}
                        >
                            WhatsApp
                        </a>{' '}
                        group.
                    </DialogContentText>
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleCopyError} color="primary">
                    Copy Error
                </Button>
                <Button onClick={handleClose} color="primary">
                    Return to App
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ErrorModal;
