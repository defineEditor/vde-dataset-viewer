import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import Results from 'renderer/components/Common/ValidationResults';
import { FileInfo } from 'interfaces/common';
import { ValidatorConfig } from 'interfaces/main';
import { useAppSelector } from 'renderer/redux/hooks';
import Configuration from 'renderer/components/Validator/Configuration';

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
    const [validating, setValidating] = useState(false);
    const [tab, setTab] = useState(0);

    const validatorData = useAppSelector((state) => state.data.validator);
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
        setValidating(true);
        // TODO: Dispatch validation action for all files
        // await dispatch(validateFiles(selectedFiles) as any);
        setTimeout(() => setValidating(false), 1000); // Simulate
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
                    validating={validating}
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
