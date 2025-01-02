import React, { useEffect, useCallback, useContext } from 'react';
import { useAppDispatch } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { closeModal } from 'renderer/redux/slices/ui';
import { sanitize } from 'dompurify';
import { ICheckUpdateResult } from 'interfaces/common';
import { Typography } from '@mui/material';

const styles = {
    dialog: {
        minWidth: '80%',
        height: '80%',
    },
};

const AppUpdate: React.FC<{ type: string; data: ICheckUpdateResult }> = ({
    type,
    data,
}) => {
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
        apiService.downloadUpdate();
    }, [apiService]);

    if (!updateInfo) {
        return null;
    }

    let releaseNotes = sanitize(updateInfo.releaseNotes as string);
    releaseNotes = releaseNotes.replace(/<a.*?>/g, '');
    releaseNotes = releaseNotes.replace(/<\/a.*?>/g, '');

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle>Application Update</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom>
                    New Version Available: {updateInfo.version}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Release notes:
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Release notes:
                </Typography>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: releaseNotes }} />
            </DialogContent>
            <DialogActions>
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
