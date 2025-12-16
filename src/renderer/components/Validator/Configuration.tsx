import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
    Stack,
    Button,
    Typography,
    MenuItem,
    TextField,
    Box,
    AutocompleteChangeReason,
    Autocomplete,
} from '@mui/material';
import {
    FileInfo,
    ConvertedFileInfo,
    ValidatorConfig,
} from 'interfaces/common';
import { useAppSelector } from 'renderer/redux/hooks';
import FileSelector from 'renderer/components/Common/FileSelector';
import DictionaryConfigModal from 'renderer/components/Validator/DictionaryConfigModal';
import OptionsModal from 'renderer/components/Validator/OptionsModal';
import PathSelector from 'renderer/components/Common/SingleFileSelector';
import AppContext from 'renderer/utils/AppContext';

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
    defineXmlPath: { width: '200px' },
};

interface ValidatorConfigurationProps {
    selectedFiles: FileInfo[];
    setSelectedFiles: (files: FileInfo[]) => void;
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
    const { apiService } = useContext(AppContext);

    const validatorData = useAppSelector((state) => state.data.validator);
    const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);
    const [optionsModalOpen, setOptionsModalOpen] = useState(false);

    // Derive version and standard options from the validator info
    const validatorStandards = useMemo(() => {
        const standards: {
            [key: string]: { name: string; versions: string[] };
        } = {};
        validatorData.info.standards.forEach((rawStandard) => {
            const parsedStandard = rawStandard.split(',');
            const [name, version, substandard] = parsedStandard;
            const versionWithSubstandard = substandard
                ? `${version},${substandard}`
                : version;
            if (!standards[name]) {
                standards[name] = {
                    name,
                    versions: [versionWithSubstandard],
                };
            } else {
                standards[name].versions.push(versionWithSubstandard);
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
            setConfig((prev) => {
                const prevVersion = prev.version;
                // If the previous version is not valid for the new standard, set to the first available version
                if (
                    !validatorStandards[selectedStandard].versions.includes(
                        prevVersion,
                    )
                ) {
                    return {
                        ...prev,
                        version:
                            validatorStandards[selectedStandard].versions[0],
                    };
                }
                return prev;
            });
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

    // Handle path selection for define-xml path
    const handlePathSelection = async (
        name:
            | 'defineXmlPath'
            | 'whodrugPath'
            | 'meddraPath'
            | 'loincPath'
            | 'medrtPath'
            | 'uniiPath',
        reset: boolean = false,
    ) => {
        if (reset) {
            setConfig((prev) => ({
                ...prev,
                [name]: '',
            }));
            return;
        }

        let result: string | null = null;
        if (name === 'defineXmlPath') {
            const fileInfo = await apiService.openFileDialog({
                initialFolder: '',
            });
            if (fileInfo && fileInfo.length > 0) {
                result = fileInfo[0].fullPath;
            }
        } else {
            result = await apiService.openDirectoryDialog(config[name]);
        }
        if (result === null || result === '') {
            return;
        }

        setConfig((prev) => ({
            ...prev,
            [name]: result,
        }));
    };

    // Convert FileInfo to ConvertedFileInfo for the FileSelector
    const files: ConvertedFileInfo[] = selectedFiles.map((file) => ({
        ...file,
        id: `${file.folder}/${file.filename}`,
        outputName: ['xpt', 'json'].includes(getExtension(file.filename))
            ? file.filename
            : file.filename.replace(/\.[^.]+$/, '.json'), // Convert to JSON if not xpt or json
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
                    <PathSelector
                        sx={styles.defineXmlPath}
                        label="Define-XML"
                        value={config.defineXmlPath}
                        onSelectDestination={() => {
                            handlePathSelection('defineXmlPath');
                        }}
                        onClean={() => {
                            handlePathSelection('defineXmlPath', true);
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={() => setDictionaryModalOpen(true)}
                        sx={styles.button}
                    >
                        Dictionaries
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setOptionsModalOpen(true)}
                        sx={styles.button}
                    >
                        Options
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
                onPathSelection={handlePathSelection}
            />

            {/* Validator Options Modal */}
            <OptionsModal
                open={optionsModalOpen}
                onClose={() => setOptionsModalOpen(false)}
                config={config}
                setConfig={setConfig}
            />
        </Stack>
    );
};

export default ValidatorConfiguration;
