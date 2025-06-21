import React, { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Configuration from 'renderer/components/Modal/Validator/Configuration';
import { IUiModal, ValidatorConfig } from 'interfaces/common';
import { Tabs, Tab, Box } from '@mui/material';
import { closeModal, setValidatorTab } from 'renderer/redux/slices/ui';
import { setValidatorData } from 'renderer/redux/slices/data';

const styles = {
    dialog: {
        maxWidth: '95%',
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '80%', xl: '80%' },
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

    const validatorData = useAppSelector((state) => state.data.validator);
    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    // Save configuration and trigger validation
    const handleValidate = () => {
        // Save the configuration
        dispatch(
            setValidatorData({
                configuration: config,
            }),
        );

        // Start validation
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
                    <Configuration config={config} setConfig={setConfig} />
                </Box>
                <Box hidden={validatorTab !== 1} sx={styles.tabPanel}>
                    <Results />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button
                    onClick={handleValidate}
                    color="primary"
                    disabled={validatorTab !== 0}
                >
                    Validate
                </Button>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatasetInfo;
