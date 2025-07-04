import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
    Stack,
    Button,
    Typography,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { FileInfo, ConvertedFileInfo } from 'interfaces/common';
import { ValidatorConfig } from 'interfaces/main';
import { useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import FileSelector from 'renderer/components/Common/FileSelector';
import PathSelector from 'renderer/components/FileSelector';

const styles = {
    container: {
        p: 2,
        height: '100%',
        backgroundColor: 'grey.100',
    },
    validateActions: {
        p: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
    },
    fileSelector: {
        p: 2,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 1,
        flex: '1 1 auto',
    },
    configSection: {
        p: 2,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 1,
        mb: 2,
    },
    configRow: {
        direction: 'row',
        spacing: 2,
        alignItems: 'center',
    },
    selectInput: {
        minWidth: 200,
    },
    dialogContent: {
        minWidth: 500,
    },
};

interface ValidatorConfigurationProps {
    selectedFiles: FileInfo[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    validating: boolean;
    onValidate: () => void;
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
    validating,
    onValidate,
    config,
    setConfig,
}) => {
    const { apiService } = useContext(AppContext);
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

    // Helper function to handle path selection
    const handlePathSelection = async (
        name: 'whodrugPath' | 'meddraPath' | 'loincPath' | 'medrtPath' | 'uniiPath',
        reset: boolean = false,
    ) => {
        if (reset) {
            setConfig((prev) => ({
                ...prev,
                [name]: '',
            }));
            return;
        }

        const result = await apiService.openDirectoryDialog(config[name]);
        if (result === null || result === '') {
            return;
        }

        setConfig((prev) => ({
            ...prev,
            [name]: result,
        }));
    };

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
            <Paper sx={styles.configSection}>
                <Typography variant="h6" gutterBottom>
                    Standard Options
                </Typography>
                <Stack sx={styles.configRow}>
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
                </Stack>
            </Paper>

            {/* File Selection */}
            <Paper sx={styles.fileSelector}>
                <FileSelector
                    files={files}
                    onFilesChange={handleFilesChange}
                    title="Select Files to Validate"
                    showOutputName={false}
                />
            </Paper>

            {/* Actions */}
            <Stack sx={styles.validateActions}>
                <Button
                    variant="outlined"
                    onClick={() => setDictionaryModalOpen(true)}
                >
                    Configure Dictionaries
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedFiles.length === 0 || validating}
                    onClick={onValidate}
                >
                    Validate
                </Button>
            </Stack>

            {/* Dictionary Configuration Modal */}
            <Dialog
                open={dictionaryModalOpen}
                onClose={() => setDictionaryModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Dictionary Configuration</DialogTitle>
                <DialogContent sx={styles.dialogContent}>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <PathSelector
                            label="WHODRUG Path"
                            value={config.whodrugPath}
                            onSelectDestination={() => {
                                handlePathSelection('whodrugPath');
                            }}
                            onClean={() => {
                                handlePathSelection('whodrugPath', true);
                            }}
                        />

                        <PathSelector
                            label="MedDRA Path"
                            value={config.meddraPath}
                            onSelectDestination={() => {
                                handlePathSelection('meddraPath');
                            }}
                            onClean={() => {
                                handlePathSelection('meddraPath', true);
                            }}
                        />

                        <PathSelector
                            label="LOINC Path"
                            value={config.loincPath}
                            onSelectDestination={() => {
                                handlePathSelection('loincPath');
                            }}
                            onClean={() => {
                                handlePathSelection('loincPath', true);
                            }}
                        />

                        <PathSelector
                            label="MedRT Path"
                            value={config.medrtPath}
                            onSelectDestination={() => {
                                handlePathSelection('medrtPath');
                            }}
                            onClean={() => {
                                handlePathSelection('medrtPath', true);
                            }}
                        />

                        <PathSelector
                            label="UNII Path"
                            value={config.uniiPath}
                            onSelectDestination={() => {
                                handlePathSelection('uniiPath');
                            }}
                            onClean={() => {
                                handlePathSelection('uniiPath', true);
                            }}
                        />

                        <Typography variant="h6" sx={{ mt: 3 }}>
                            SNOMED Configuration
                        </Typography>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                name="snomedVersion"
                                label="SNOMED Version"
                                value={config.snomedVersion}
                                onChange={handleChange}
                                fullWidth
                            />

                            <TextField
                                name="snomedUrl"
                                label="SNOMED URL"
                                value={config.snomedUrl}
                                onChange={handleChange}
                                fullWidth
                            />

                            <TextField
                                name="snomedEdition"
                                label="SNOMED Edition"
                                value={config.snomedEdition}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDictionaryModalOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default ValidatorConfiguration;
