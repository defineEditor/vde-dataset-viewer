import React, { useEffect, useCallback, useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    Tabs,
    Tab,
    Box,
    Dialog,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';
import Configuration from 'renderer/components/Modal/Validator/Configuration';
import Results from 'renderer/components/Common/ValidationResults';
import AppContext from 'renderer/utils/AppContext';
import {
    InputFileExtension,
    IUiModal,
    IUiValidation,
    IUiViewer,
    ValidatorConfig,
} from 'interfaces/common';
import {
    closeModal,
    setValidatorTab,
    updateValidation,
} from 'renderer/redux/slices/ui';
import ValidationProgress from 'renderer/components/Modal/Validator/ValidationProgress';

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
    const validationId = `modal-${currentFileId}`;

    // Get validation state from Redux
    const validationStatus = useAppSelector<IUiValidation['status']>(
        (state) =>
            (validationId !== null &&
                state.ui.validation[validationId]?.status) ||
            'not started',
    );

    const validationDateCompleted = useAppSelector<number | null>(
        (state) =>
            (validationId !== null &&
                state.ui.validation[validationId]?.dateCompleted) ||
            null,
    );

    const { apiService } = useContext(AppContext);

    // Get last modified time for the current file
    const currentFile = apiService.getOpenedFiles(currentFileId)[0];
    const currentFilePath = currentFile?.path;
    const currentFileLastModified = currentFile?.lastModified;

    // When opening a modal, check if the validation completion date is before the last modified time of the file
    useEffect(() => {
        if (
            validationStatus === 'completed' &&
            typeof validationDateCompleted === 'number' &&
            currentFileLastModified &&
            validationDateCompleted < currentFileLastModified
        ) {
            // Reset validation state if the file has been modified since the last validation
            dispatch(
                updateValidation({
                    validationId,
                    validation: {
                        status: 'not started',
                        validationProgress: 0,
                        conversionProgress: null,
                    },
                }),
            );
        }
    }, [
        dispatch,
        validationStatus,
        validationDateCompleted,
        currentFileLastModified,
        validationId,
    ]);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: IUiViewer['validatorTab'],
    ) => {
        dispatch(setValidatorTab(newValue));
    };

    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    // Save configuration and trigger validation
    const handleValidate = useCallback(() => {
        const runTask = async () => {
            // Start validation with Redux state management
            // Get fileInfo
            const file = apiService.getOpenedFiles(currentFileId);
            if (file.length === 0) return;

            // Get extension
            const extension = file[0].path
                .split('.')
                .pop() as InputFileExtension;

            await apiService.startValidation({
                files: [
                    {
                        filePath: file[0].path,
                        fileName: `${file[0].name.toLowerCase()}.${extension}`,
                        extension,
                    },
                ],
                configuration: config,
                settings,
                validationId,
            });
        };

        runTask();
    }, [apiService, config, currentFileId, settings, validationId]);

    const handleReset = useCallback(() => {
        if (typeof validationId === 'string') {
            dispatch(
                updateValidation({
                    validationId,
                    validation: {
                        status: 'not started',
                        validationProgress: 0,
                        conversionProgress: null,
                        dateCompleted: null,
                    },
                }),
            );
        }
        // Switch to results tab
        dispatch(setValidatorTab('results'));
    }, [dispatch, validationId]);

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
                    <Tab
                        label="Configuration"
                        sx={styles.tab}
                        value="validation"
                    />
                    <Tab label="Results" sx={styles.tab} value="results" />
                </Tabs>
                <Box
                    hidden={validatorTab !== 'validation'}
                    sx={styles.tabPanel}
                >
                    {['completed', 'validating'].includes(validationStatus) ? (
                        <ValidationProgress
                            validationId={validationId}
                            validationStatus={validationStatus}
                        />
                    ) : (
                        <Configuration config={config} setConfig={setConfig} />
                    )}
                </Box>
                <Box hidden={validatorTab !== 'results'} sx={styles.tabPanel}>
                    <Results filePaths={[currentFilePath]} isModal />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                {validationStatus === 'not started' && (
                    <Button
                        onClick={handleValidate}
                        color="primary"
                        disabled={validatorTab !== 'validation'}
                    >
                        Validate
                    </Button>
                )}
                {(validationStatus === 'completed' ||
                    validationStatus === 'validating') && (
                    <Button
                        onClick={handleReset}
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
