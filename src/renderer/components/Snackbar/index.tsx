import React from 'react';
import { Snackbar, Box, SnackbarContent } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { closeSnackbar } from 'renderer/redux/slices/ui';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';

const styles = {
    message: {
        display: 'flex',
        alignItems: 'center',
    },
    snackbar: {
        marginBottom: 2,
    },
    success: {
        backgroundColor: 'success.light',
    },
    error: {
        backgroundColor: 'error.light',
    },
    info: {
        backgroundColor: 'primary.light',
    },
    warning: {
        backgroundColor: 'warning.light',
    },
    icon: {
        fontSize: 20,
        marginRight: 1,
    },
};

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

const SnackbarRoot: React.FC = () => {

    const snackbar = useAppSelector((state) => state.ui.snackbar);
    const dispatch = useAppDispatch();

    const handleClose = () => {
        dispatch(closeSnackbar());
    }

    if (snackbar.type === null) {
        return null;
    } else {
        const duration = snackbar?.props?.duration || 3000;
        const Icon = variantIcon[snackbar.type];
        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                open
                autoHideDuration={duration}
                onClose={handleClose}
                sx={styles.snackbar}
            >
                <SnackbarContent
                    message={
                        <Box aria-label = "snackbarroot" sx = {styles.message} >
                            <Icon sx={styles.icon} />
                            {snackbar.message}
                        </Box>
                    }
                    sx={styles[snackbar.type]}
                />
            </Snackbar>
        );
    }
};

export default SnackbarRoot;
