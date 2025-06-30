import React, { useEffect, useCallback, useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Configuration from 'renderer/components/Modal/Validator/Configuration';
import Results from 'renderer/components/Modal/Validator/Results';
import AppContext from 'renderer/utils/AppContext';
import { mainTaskTypes } from 'misc/constants';
import { IUiModal, ValidatorConfig, TaskProgress } from 'interfaces/common';
import { Tabs, Tab, Box } from '@mui/material';
import {
    closeModal,
    setValidatorTab,
    openSnackbar,
} from 'renderer/redux/slices/ui';
import {
    addValidationReport,
    setValidatorData,
} from 'renderer/redux/slices/data';
import ValidationProgress from './ValidationProgress';

const styles = {
    dialog: {
        maxWidth: '95%',
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '80%', xl: '80%' },
        height: { xs: '95%', sm: '95%', md: '90%', lg: '85%', xl: '85%' },
        maxHeight: '95%',
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

const Validator: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const validatorTab = useAppSelector(
        (state) => state.ui.viewer.validatorTab,
    );
    const validatorData = useAppSelector((state) => state.data.validator);
    const settings = useAppSelector((state) => state.settings);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const { apiService } = useContext(AppContext);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: 0 | 1) => {
        dispatch(setValidatorTab(newValue));
    };

    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    const [validationStatus, setValidationStatus] = useState<
        'not started' | 'validating' | 'completed'
    >('not started');
    const [conversionProgress, setConversionProgress] = useState<number | null>(
        null,
    );
    const [validationProgress, setValidationProgress] = useState<number>(0);

    // Save configuration and trigger validation
    const handleValidate = useCallback(() => {
        apiService.cleanTaskProgressListeners();

        setConversionProgress(null);
        setValidationProgress(0);

        apiService.subscribeToTaskProgress((info: TaskProgress) => {
            if (info.type !== mainTaskTypes.VALIDATE) {
                return;
            }
            if (info.id.startsWith(`${mainTaskTypes.VALIDATE}-convert`)) {
                setConversionProgress(info.progress);
            } else if (
                info.id.startsWith(`${mainTaskTypes.VALIDATE}-validator`)
            ) {
                setValidationProgress(info.progress);
                if (info.progress === 100) {
                    if (info.error) {
                        dispatch(
                            openSnackbar({
                                message: info.error,
                                type: 'error',
                            }),
                        );
                    } else if (info.result) {
                        // Only dispatch if result is a ValidationReport (has required properties)
                        if (
                            info.result &&
                            typeof info.result === 'object' &&
                            'date' in info.result
                        ) {
                            dispatch(addValidationReport(info.result));
                        }
                    }
                }
            }
        });

        const runTask = async () => {
            setValidationStatus('validating');
            // Save the configuration
            dispatch(
                setValidatorData({
                    configuration: config,
                }),
            );
            // Start validation
            await apiService.startValidation({
                fileId: currentFileId,
                configuration: config,
                settings,
            });

            setValidationStatus('completed');
        };

        runTask();

        return () => {
            apiService.cleanTaskProgressListeners();
        };
    }, [apiService, dispatch, config, currentFileId, settings]);

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
                    {['completed', 'validating'].includes(validationStatus) ? (
                        <ValidationProgress
                            conversionProgress={conversionProgress}
                            validationProgress={validationProgress}
                        />
                    ) : (
                        <Configuration config={config} setConfig={setConfig} />
                    )}
                </Box>
                <Box hidden={validatorTab !== 1} sx={styles.tabPanel}>
                    <Results />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                {validationStatus === 'not started' && (
                    <Button
                        onClick={handleValidate}
                        color="primary"
                        disabled={validatorTab !== 0}
                    >
                        Validate
                    </Button>
                )}
                {(validationStatus === 'completed' ||
                    validationStatus === 'validating') && (
                    <Button
                        onClick={() => setValidationStatus('not started')}
                        color="primary"
                        disabled={validationStatus !== 'completed'}
                    >
                        Done
                    </Button>
                )}
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Validator;
