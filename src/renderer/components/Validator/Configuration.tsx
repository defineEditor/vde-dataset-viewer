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
    AutocompleteChangeReason,
    Autocomplete,
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
    ctInput: {
        width: 270,
        '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
            minWidth: 20,
        },
        '& .MuiAutocomplete-inputRoot .MuiAutocomplete-inputFocused': {
            minWidth: 20,
        },
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

    // Handle CT update
    const handleCtChange = (
        _event: React.ChangeEvent<{}>,
        value: { label: string; id: string }[] | null,
        reason: AutocompleteChangeReason,
    ) => {
        let newCtPackages: string[] = [];
        if (reason === 'clear') {
            newCtPackages = [];
        } else if (Array.isArray(value)) {
            newCtPackages = value.map((item) => item.id);
        } else {
            newCtPackages = [];
        }
        setConfig((prev) => ({
            ...prev,
            ctPackages: newCtPackages,
        }));
    };

    // Controlled Terminology packages
    const availableCtPackages = useMemo(() => {
        const result: { [key: string]: string }[] = [];
        validatorData.info.terminology.forEach((entry) => {
            const name = entry
                .replace(/(.*)(\d{4}-\d{2}-\d{2})/, '$1')
                .trim()
                .replace(/ct-$/, '')
                .toUpperCase()
                .replace('PROTOCOL', 'Protocol')
                .replace('ADAM', 'ADaM')
                .replace('DEFINE-XML', 'Define-XML')
                .replace('GLOSSARY', 'Glossary');
            const date = entry.replace(/(.*)(\d{4}-\d{2}-\d{2}).*/, '$2');
            result[entry] = { name, date, label: `${name} ${date}` };
        });
        return result;
    }, [validatorData.info.terminology]);

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

                    <Autocomplete
                        multiple
                        sx={styles.ctInput}
                        options={Object.keys(availableCtPackages)
                            .map((ct) => {
                                return {
                                    label: availableCtPackages[ct].label,
                                    name: availableCtPackages[ct].name,
                                    date: availableCtPackages[ct].date,
                                    id: ct,
                                };
                            })
                            .sort((a, b) => {
                                // Show CTs of the current standard first
                                const updatedStdName = config.standard.replace(
                                    /^(\w+)IG.*$/,
                                    '$1',
                                );
                                const isCurrentA =
                                    a.name.toUpperCase() === updatedStdName;
                                const isCurrentB =
                                    b.name.toUpperCase() === updatedStdName;
                                if (isCurrentA && !isCurrentB) return -1;
                                if (!isCurrentA && isCurrentB) return 1;
                                // First compare by standard name
                                if (a.name < b.name) return -1;
                                if (a.name > b.name) return 1;
                                // If names are the same, compare by date (newest first)
                                if (a.date > b.date) return -1;
                                if (a.date < b.date) return 1;
                                return 0;
                            })}
                        value={config.ctPackages.map((ct) => {
                            return {
                                label: availableCtPackages[ct].label,
                                id: ct,
                            };
                        })}
                        onChange={handleCtChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                name="ctPackages"
                                label="CT Packages"
                                fullWidth
                            />
                        )}
                    />

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
