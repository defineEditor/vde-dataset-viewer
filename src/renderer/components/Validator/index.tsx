import React, { useState, useContext } from 'react';
import { Box, Tabs, Tab, Paper, Button, Stack } from '@mui/material';
import Results from 'renderer/components/Common/ValidationResults';
import {
    FileInfo,
    InputFileExtension,
    IUiValidation,
    ValidatorConfig,
} from 'interfaces/common';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { updateValidation } from 'renderer/redux/slices/ui';
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
    const [tab, setTab] = useState(0);

    const { apiService } = useContext(AppContext);
    const validatorData = useAppSelector((state) => state.data.validator);
    const settings = useAppSelector((state) => state.settings);

    // Get validation state from Redux
    const validationState = useAppSelector<IUiValidation>(
        (state) =>
            state.ui.validation.globalvalidation || {
                status: 'not started',
                validationProgress: 0,
                conversionProgress: null,
                dateCompleted: null,
            },
    );
    const dispatch = useAppDispatch();

    const [config, setConfig] = useState<ValidatorConfig>({
        ...validatorData.configuration,
    });

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTab(newValue);
    };

    const handleValidate = async () => {
        if (selectedFiles.length === 0) return;

        // Start validation with Redux state management
        const files = selectedFiles.map((file) => ({
            filePath: file.fullPath,
            fileName: file.filename,
            extension: file.format as InputFileExtension,
        }));
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
                    <Tab label="Configuration" />
                    <Tab label="Results" />
                </Tabs>
            </Paper>
            <Box hidden={tab !== 0} sx={styles.tabPanel}>
                <Stack spacing={0} sx={styles.configuration}>
                    <Box sx={styles.mainBody}>
                        {['completed', 'validating'].includes(
                            validationState.status,
                        ) ? (
                            <ValidationProgress
                                conversionProgress={
                                    validationState.conversionProgress
                                }
                                validationProgress={
                                    validationState.validationProgress
                                }
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
                            validationState.status,
                        ) ? (
                            <Button
                                onClick={handleReset}
                                color="primary"
                                variant="contained"
                                disabled={
                                    validationState.status !== 'completed'
                                }
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
                                    validationState.status === 'validating'
                                }
                            >
                                Validate
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Box>
            <Box hidden={tab !== 1} sx={styles.tabPanel}>
                <Results />
            </Box>
        </Box>
    );
};

export default Validator;
