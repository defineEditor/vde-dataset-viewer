import React, { useState, useEffect, useMemo } from 'react';
import {
    Stack,
    Button,
    Typography,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Box,
} from '@mui/material';
import { FileInfo, ConvertedFileInfo } from 'interfaces/common';
import { ValidatorConfig } from 'interfaces/main';
import { useAppSelector } from 'renderer/redux/hooks';
import FileSelector from 'renderer/components/Common/FileSelector';
import DictionaryConfigModal from 'renderer/components/Validator/DictionaryConfigModal';

const styles = {
    container: {
        p: 2,
        height: '100%',
        flex: '1 1 auto',
        backgroundColor: 'grey.100',
    },
    validateActions: {
        m: 2,
    },
    configSection: {
        mb: 2,
        border: 0,
        backgroundColor: 'grey.100',
    },
    configRow: {
        direction: 'row',
        spacing: 2,
        alignItems: 'center',
    },
    selectInput: {
        minWidth: 200,
    },
    button: {
        p: 1,
    },
};

interface ValidatorConfigurationProps {
    selectedFiles: FileInfo[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    config: ValidatorConfig;
    setConfig: React.Dispatch<React.SetStateAction<ValidatorConfig>>;
}

const getExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

const ValidatorConfiguration: React.FC<ValidatorConfigurationProps> = ({
    selectedFiles,
    setSelectedFiles,
    config,
    setConfig,
}) => {
    const validatorData = useAppSelector((state) => state.data.validator);
    const validatorSettings = useAppSelector(
        (state) => state.settings.validator,
    );

    const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);

    // Derive version and standard options from the validator info
    const validatorStandards = useMemo(() => {
        const standards: {
            [key: string]: { name: string; versions: string[] };
        } = {};
        validatorData.info.standards.forEach((rawStandard) => {
            const parsedStandard = rawStandard.split(',');
            const [name, version] = parsedStandard;
            if (!standards[name]) {
                standards[name] = { name, versions: [version] };
            } else {
                standards[name].versions.push(version);
            }
        });
        return standards;
    }, [validatorData.info.standards]);

    const availableStandards = useMemo(
        () => Object.keys(validatorStandards),
        [validatorStandards],
    );

    const [availableVersions, setAvailableVersions] = useState<string[]>([]);

    // Update available versions when the standard changes
    useEffect(() => {
        const selectedStandard = config.standard;
        if (validatorStandards[selectedStandard]) {
            setConfig((prev) => ({
                ...prev,
                version: validatorStandards[selectedStandard].versions[0],
            }));
            setAvailableVersions(validatorStandards[selectedStandard].versions);
        } else {
            setAvailableVersions([]);
        }
    }, [config.standard, validatorStandards, setConfig]);

    // Handle text input changes
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setConfig((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle switch changes
    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setConfig((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };
    // Convert FileInfo to ConvertedFileInfo for the FileSelector
    const files: ConvertedFileInfo[] = selectedFiles.map((file) => ({
        ...file,
        id: `${file.folder}/${file.filename}`,
        outputName: ['xpt', 'json'].includes(getExtension(file.filename))
            ? file.filename
            : file.filename.replace(/\.[^.]+$/, 'json'), // Convert to JSON if not xpt or json
    }));

    const handleFilesChange = (newFiles: ConvertedFileInfo[]) => {
        // Convert back to FileInfo
        const fileInfos: FileInfo[] = newFiles.map((file) => ({
            fullPath: file.fullPath,
            folder: file.folder,
            filename: file.filename,
            format: file.format,
            size: file.size,
            lastModified: file.lastModified,
            datasetJsonVersion: file.datasetJsonVersion,
        }));
        setSelectedFiles(fileInfos);
    };

    return (
        <Stack spacing={2} sx={styles.container}>
            {/* Standard Configuration Section */}
            <Box sx={styles.configSection}>
                <Typography variant="h6" gutterBottom>
                    Standard Options
                </Typography>
                <Stack
                    sx={styles.configRow}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >
                    <TextField
                        select
                        name="standard"
                        label="Standard"
                        value={config.standard}
                        onChange={handleChange}
                        sx={styles.selectInput}
                        disabled={config.customStandard}
                    >
                        {availableStandards.map((std) => (
                            <MenuItem key={std} value={std}>
                                {std}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select={availableVersions.length > 0}
                        name="version"
                        label="Version"
                        disabled={config.customStandard}
                        value={config.version}
                        onChange={handleChange}
                        sx={styles.selectInput}
                    >
                        {availableVersions.map((ver) => (
                            <MenuItem key={ver} value={ver}>
                                {ver.replace(/-/g, '.')}
                            </MenuItem>
                        ))}
                    </TextField>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.customStandard}
                                onChange={handleSwitchChange}
                                name="customStandard"
                                disabled={
                                    validatorSettings.localRulesPath === ''
                                }
                            />
                        }
                        label="Use Custom Standard"
                    />
                    <Button
                        variant="contained"
                        onClick={() => setDictionaryModalOpen(true)}
                        sx={styles.button}
                    >
                        Dictionaries
                    </Button>
                </Stack>
            </Box>

            {/* File Selection */}
            <FileSelector
                files={files}
                onFilesChange={handleFilesChange}
                title="Select Files to Validate"
                showOutputName={false}
            />

            {/* Dictionary Configuration Modal */}
            <DictionaryConfigModal
                open={dictionaryModalOpen}
                onClose={() => setDictionaryModalOpen(false)}
                config={config}
                setConfig={setConfig}
            />
        </Stack>
    );
};

export default ValidatorConfiguration;
