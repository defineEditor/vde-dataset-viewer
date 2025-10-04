import React, {
    useEffect,
    useCallback,
    useState,
    useContext,
    useMemo,
} from 'react';
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
    Stack,
} from '@mui/material';
import Configuration from 'renderer/components/Modal/Validator/Configuration';
import Issues from 'renderer/components/Modal/Validator/Issues';
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
    setValidationModalTab,
    updateValidation,
    setShowIssues,
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
        backgroundColor: 'grey.200',
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

    const validationError = useAppSelector<string | null>(
        (state) =>
            (validationId !== null &&
                state.ui.validation[validationId]?.error) ||
            null,
    );

    const validationLogFileName = useAppSelector<string | null>(
        (state) =>
            (validationId !== null &&
                state.ui.validation[validationId]?.logFileName) ||
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
                        error: null,
                        dateCompleted: null,
                        logFileName: null,
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
        dispatch(setValidationModalTab(newValue));
    };

    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    // Check if current file is in the report
    const currentReportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const validationReport = useAppSelector(
        (state) => state.data.validator.reports[currentReportId || ''] || null,
    );

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
                        error: null,
                    },
                }),
            );
        }
        // Switch to results tab if there are no errors
        if (!validationError) {
            dispatch(setValidationModalTab('results'));
        }
    }, [dispatch, validationId, validationError]);

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

    const isCurrentFileInReport = useMemo(() => {
        // If issues are not enabled, no need to check further
        if (validationReport === null) {
            return false;
        }
        // Get path to the current file
        const path = currentFilePath;

        if (
            validationReport &&
            path &&
            validationReport.files.map((item) => item.file).includes(path)
        ) {
            return true;
        }
        return false;
    }, [validationReport, currentFilePath]);

    // Filtered issues
    const defaultFilteredIssues = useAppSelector(
        (state) => state.ui.dataSettings[currentFileId]?.filteredIssues,
    );
    const [filteredIssues, setFilteredIssues] = React.useState<string[]>(
        defaultFilteredIssues || [],
    );

    const handleShowIssues = () => {
        dispatch(
            setShowIssues({
                id: currentFileId,
                show: true,
                filteredIssues,
            }),
        );
        dispatch(closeModal({ type }));
    };

    const handleResetIssues = () => {
        dispatch(
            setShowIssues({
                id: currentFileId,
                show: false,
                filteredIssues: [],
            }),
        );
        dispatch(closeModal({ type }));
    };

    const handleShowLog = () => {
        if (!validationLogFileName) {
            return;
        }
        apiService.showValidationLog(validationLogFileName);
    };

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
                        label="Validation"
                        sx={styles.tab}
                        value="validation"
                    />
                    <Tab label="Results" sx={styles.tab} value="results" />
                    <Tab
                        label="Issues"
                        sx={styles.tab}
                        value="issues"
                        disabled={!isCurrentFileInReport}
                    />
                </Tabs>
                <Box
                    hidden={validatorTab !== 'validation'}
                    sx={styles.tabPanel}
                >
                    {['completed', 'validating'].includes(validationStatus) ? (
                        <ValidationProgress
                            validationId={validationId}
                            onShowLog={handleShowLog}
                            validationStatus={validationStatus}
                        />
                    ) : (
                        <Configuration config={config} setConfig={setConfig} />
                    )}
                </Box>
                <Box hidden={validatorTab !== 'results'} sx={styles.tabPanel}>
                    {validatorTab === 'results' && (
                        <Results filePaths={[currentFilePath]} isModal />
                    )}
                </Box>
                <Box hidden={validatorTab !== 'issues'} sx={styles.tabPanel}>
                    {validatorTab === 'issues' && currentReportId && (
                        <Issues
                            filteredIssues={filteredIssues}
                            setFilteredIssues={setFilteredIssues}
                            datasetName={currentFile?.name || ''}
                            onClose={handleClose}
                            fileId={currentFileId}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                {validatorTab === 'issues' && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={handleShowIssues}
                            color="primary"
                            disabled={filteredIssues.length === 0}
                        >
                            Show issues
                        </Button>
                        <Button onClick={handleResetIssues} color="primary">
                            Reset
                        </Button>
                    </Stack>
                )}
                {validationStatus === 'not started' &&
                    validatorTab === 'validation' && (
                        <Button
                            onClick={handleValidate}
                            color="primary"
                            disabled={validatorTab !== 'validation'}
                        >
                            Validate
                        </Button>
                    )}
                {validatorTab === 'validation' &&
                    (validationStatus === 'completed' ||
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
