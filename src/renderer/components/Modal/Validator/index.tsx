import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { IUiModal } from 'interfaces/common';
import { Tabs, Tab, Box } from '@mui/material';
import { closeModal, setValidatorTab } from 'renderer/redux/slices/ui';

const styles = {
    dialog: {
        minWidth: '80%',
        height: '80%',
    },
    tabs: {
        flexGrow: 1,
    },
    tab: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    tabPanel: {
        height: 'calc(100% - 48px)', // Adjust height to account for tab header
        overflow: 'auto',
    },
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 1,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        p: 0,
    },
};

const Configuration: React.FC = () => {
    return null;
};

const Results: React.FC = () => {
    return null;
};

const DatasetInfo: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const validatorTab = useAppSelector(
        (state) => state.ui.viewer.validatorTab,
    );

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: 0 | 1) => {
        dispatch(setValidatorTab(newValue));
    };

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
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>Data Validation</div>
                </Box>
            </DialogTitle>
            <DialogContent sx={styles.content}>
                <Tabs
                    value={validatorTab}
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <Tab label="Configuration" sx={styles.tab} />
                    <Tab label="Results" sx={styles.tab} />
                </Tabs>
                <Box hidden={validatorTab !== 0} sx={styles.tabPanel}>
                    <Configuration />
                </Box>
                <Box hidden={validatorTab !== 1} sx={styles.tabPanel}>
                    <Results />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatasetInfo;
