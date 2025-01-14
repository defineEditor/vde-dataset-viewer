import React, { useEffect, useCallback, useContext } from 'react';
import { useAppDispatch } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { closeModal, openSnackbar } from 'renderer/redux/slices/ui';
import DOMPurify from 'dompurify';
import { ICheckUpdateResult, IUiModalAppUpdate } from 'interfaces/common';
import { Typography } from '@mui/material';

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
};

const AppUpdate: React.FC<IUiModalAppUpdate> = ({ type, data }) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const updateInfo: ICheckUpdateResult['update'] =
        data.update as ICheckUpdateResult['update'];

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

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

    const handleUpdate = useCallback(() => {
        const downloadUpdate = async () => {
            dispatch(
                openSnackbar({
                    type: 'info',
                    message: 'Downloading update...',
                }),
            );
            const result = await apiService.downloadUpdate();
            if (result === true) {
                dispatch(
                    openSnackbar({
                        type: 'success',
                        message:
                            'Update downloaded successfully and will be installed after the restart',
                    }),
                );
            } else if (result === false) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: 'Error downloading update',
                    }),
                );
            }
        };

        downloadUpdate();
        handleClose();
    }, [apiService, dispatch, handleClose]);

    if (!updateInfo) {
        return null;
    }

    let releaseNotes = DOMPurify.sanitize(updateInfo.releaseNotes as string);
    releaseNotes = releaseNotes.replace(/<a.*?>/g, '');
    releaseNotes = releaseNotes.replace(/<\/a.*?>/g, '');

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>Application Update</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body1" gutterBottom>
                    New Version Available: {`${updateInfo.version}`}
                </Typography>
                <br />
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: releaseNotes }} />
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
                <Button
                    onClick={handleUpdate}
                    color="primary"
                    variant="contained"
                >
                    Update
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AppUpdate;
