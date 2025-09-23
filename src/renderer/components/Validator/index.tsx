import React, { useState, useContext } from 'react';
import { Box, Tabs, Tab, Paper, Button, Stack } from '@mui/material';
import Results from 'renderer/components/Common/ValidationResults';
import Report from 'renderer/components/Validator/Report';
import {
    FileInfo,
    InputFileExtension,
    IUiValidation,
    IUiValidationPage,
    ValidatorConfig,
} from 'interfaces/common';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { updateValidation, setValidationTab } from 'renderer/redux/slices/ui';
import { setValidatorData } from 'renderer/redux/slices/data';
import Configuration from 'renderer/components/Validator/Configuration';
import AppContext from 'renderer/utils/AppContext';
import ValidationProgress from 'renderer/components/Modal/Validator/ValidationProgress';

const styles = {
    container: {
        p: 0,
        width: '100%',
        height: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'grey.100',
    },
    tabPanel: {
        overflow: 'auto',
        flex: '1 1 auto',
    },
    mainBody: {
        flex: '1 1 99%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
    },
    configuration: {
        display: 'flex',
        height: '100%',
    },
    paper: {
        mb: 0,
    },
    tabs: {
        width: '100%',
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
        textTransform: 'none',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 2,
        p: 2,
        backgroundColor: 'grey.100',
        borderTop: '1px solid #e0e0e0',
    },
};

const Validator: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);

    const { apiService } = useContext(AppContext);
    const validatorData = useAppSelector((state) => state.data.validator);
    const settings = useAppSelector((state) => state.settings);
    const tab = useAppSelector((state) => state.ui.validationPage.currentTab);

    const validationId = 'globalvalidation';
    const validationStatus = useAppSelector<IUiValidation['status']>(
        (state) =>
            (validationId !== null &&
                state.ui.validation[validationId]?.status) ||
            'not started',
    );
    const dispatch = useAppDispatch();

    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: IUiValidationPage['currentTab'],
    ) => {
        dispatch(setValidationTab(newValue));
    };

    const handleValidate = async () => {
        if (selectedFiles.length === 0) return;

        // Start validation with Redux state management
        const files = selectedFiles.map((file) => ({
            filePath: file.fullPath,
            fileName: file.filename,
            extension: file.format as InputFileExtension,
        }));
        // Save configuration to Redux
        dispatch(
            setValidatorData({
                configuration: config,
            }),
        );
        await apiService.startValidation({
            files,
            configuration: config,
            settings,
            validationId: 'globalvalidation',
        });
    };

    const handleReset = () => {
        dispatch(
            updateValidation({
                validationId: 'globalvalidation',
                validation: {
                    status: 'not started',
                    validationProgress: 0,
                    conversionProgress: null,
                    dateCompleted: null,
                },
            }),
        );
    };

    return (
        <Box sx={styles.container}>
            <Paper sx={styles.paper}>
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={styles.tabs}
                >
                    <Tab label="Validation" value="validation" />
                    <Tab label="Results" value="results" />
                    <Tab label="Report" value="report" />
                </Tabs>
            </Paper>
            {tab === 'validation' && (
                <Box sx={styles.tabPanel}>
                    <Stack spacing={0} sx={styles.configuration}>
                        <Box sx={styles.mainBody}>
                            {['completed', 'validating'].includes(
                                validationStatus,
                            ) ? (
                                <ValidationProgress
                                    validationId={validationId}
                                    validationStatus={validationStatus}
                                />
                            ) : (
                                <Configuration
                                    selectedFiles={selectedFiles}
                                    setSelectedFiles={setSelectedFiles}
                                    config={config}
                                    setConfig={setConfig}
                                />
                            )}
                        </Box>
                        <Box sx={styles.actions}>
                            {['completed', 'validating'].includes(
                                validationStatus,
                            ) ? (
                                <Button
                                    onClick={handleReset}
                                    color="primary"
                                    variant="contained"
                                    disabled={validationStatus !== 'completed'}
                                >
                                    Done
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleValidate}
                                    color="primary"
                                    variant="contained"
                                    disabled={
                                        selectedFiles.length === 0 ||
                                        validationStatus === 'validating'
                                    }
                                >
                                    Validate
                                </Button>
                            )}
                        </Box>
                    </Stack>
                </Box>
            )}
            {tab === 'results' && (
                <Box hidden={tab !== 'results'} sx={styles.tabPanel}>
                    <Results />
                </Box>
            )}
            {tab === 'report' && (
                <Box hidden={tab !== 'report'} sx={styles.tabPanel}>
                    <Report />
                </Box>
            )}
        </Box>
    );
};

export default Validator;
