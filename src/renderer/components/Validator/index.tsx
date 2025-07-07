import React, { useState, useContext } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import Results from 'renderer/components/Common/ValidationResults';
import {
    FileInfo,
    InputFileExtension,
    ValidatorConfig,
} from 'interfaces/common';
import { useAppSelector } from 'renderer/redux/hooks';
import Configuration from 'renderer/components/Validator/Configuration';
import AppContext from 'renderer/utils/AppContext';

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
        height: 'calc(100% - 48px)',
        overflow: 'auto',
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
};

const Validator: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
    const [tab, setTab] = useState(0);

    const { apiService } = useContext(AppContext);
    const validatorData = useAppSelector((state) => state.data.validator);
    const settings = useAppSelector((state) => state.settings);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    // Get validation state from Redux
    const validationState = useAppSelector(
        (state) =>
            state.ui.validation.globalvalidation || {
                validationStatus: 'not started',
                validationProgress: 0,
                conversionProgress: null,
            },
    );

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
        if (selectedFiles.length === 0 && !currentFileId) return;

        // Use currentFileId if available, otherwise use the first selected file
        const fileId = currentFileId || selectedFiles[0]?.fullPath;
        if (!fileId) return;

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
                <Configuration
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    validating={validationState.status === 'validating'}
                    onValidate={handleValidate}
                    config={config}
                    setConfig={setConfig}
                />
            </Box>
            <Box hidden={tab !== 1} sx={styles.tabPanel}>
                <Results />
            </Box>
        </Box>
    );
};

export default Validator;
