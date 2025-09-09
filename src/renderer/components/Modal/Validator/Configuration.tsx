import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import {
    Stack,
    Typography,
    MenuItem,
    TextField,
    FormControlLabel,
    Switch,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    AutocompleteChangeReason,
    Autocomplete,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileSelector from 'renderer/components/FileSelector';
import AppContext from 'renderer/utils/AppContext';
import { ValidatorConfig } from 'interfaces/main';

const styles = {
    container: {
        overflow: 'auto',
    },
    sectionTitle: {
        mt: 2,
        mb: 1,
        fontWeight: 'bold',
    },
    selectInput: {
        my: 1,
        maxWidth: 400,
    },
    formControl: {
        my: 1,
        minWidth: 200,
    },
    pathSelector: {
        my: 1,
    },
    validateButton: {
        mt: 3,
        px: 4,
        py: 1,
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        mt: 2,
    },
    paper: {
        p: 2,
        height: '100%',
    },
    ctInput: {
        width: 300,
    },
};

const Configuration: React.FC<{
    config: ValidatorConfig;
    setConfig: React.Dispatch<React.SetStateAction<ValidatorConfig>>;
}> = ({ config, setConfig }) => {
    const { apiService } = useContext(AppContext);
    const validatorData = useAppSelector((state) => state.data.validator);
    const validatorSettings = useAppSelector(
        (state) => state.settings.validator,
    );

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
            // This is not expected, but handle it gracefully
            setAvailableVersions([]);
        }
    }, [config.standard, validatorStandards, setConfig]);

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

    // Helper function to handle path selection
    const handlePathSelection = async (
        name:
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

    // Handle switch changes
    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setConfig((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    return (
        <Stack spacing={2} sx={styles.container}>
            <Paper sx={styles.paper}>
                <Typography variant="h6" sx={styles.sectionTitle}>
                    Standard Options
                </Typography>

                <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="space-between"
                >
                    <TextField
                        select
                        name="standard"
                        label="Standard"
                        value={config.standard}
                        onChange={handleChange}
                        sx={styles.selectInput}
                        disabled={config.customStandard}
                        fullWidth
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
                        fullWidth
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
                </Stack>
                <Typography variant="h6" sx={styles.sectionTitle}>
                    Additional Options
                </Typography>

                <Accordion defaultExpanded={false}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="dictionary-paths-content"
                        id="dictionary-paths-header"
                    >
                        <Typography>Dictionaries</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack direction="column" spacing={2}>
                            <FileSelector
                                label="WHODRUG Path"
                                value={config.whodrugPath}
                                onSelectDestination={() => {
                                    handlePathSelection('whodrugPath');
                                }}
                                onClean={() => {
                                    handlePathSelection('whodrugPath', true);
                                }}
                            />

                            <FileSelector
                                label="MedDRA Path"
                                value={config.meddraPath}
                                onSelectDestination={() => {
                                    handlePathSelection('meddraPath');
                                }}
                                onClean={() => {
                                    handlePathSelection('meddraPath', true);
                                }}
                            />

                            <FileSelector
                                label="LOINC Path"
                                value={config.loincPath}
                                onSelectDestination={() => {
                                    handlePathSelection('loincPath');
                                }}
                                onClean={() => {
                                    handlePathSelection('loincPath', true);
                                }}
                            />

                            <FileSelector
                                label="MedRT Path"
                                value={config.medrtPath}
                                onSelectDestination={() => {
                                    handlePathSelection('medrtPath');
                                }}
                                onClean={() => {
                                    handlePathSelection('medrtPath', true);
                                }}
                            />

                            <FileSelector
                                label="UNII Path"
                                value={config.uniiPath}
                                onSelectDestination={() => {
                                    handlePathSelection('uniiPath');
                                }}
                                onClean={() => {
                                    handlePathSelection('uniiPath', true);
                                }}
                            />
                        </Stack>

                        <Typography variant="h6" sx={styles.sectionTitle}>
                            SNOMED Configuration
                        </Typography>

                        <Stack direction="row" spacing={2}>
                            <TextField
                                name="snomedVersion"
                                label="SNOMED Version"
                                value={config.snomedVersion}
                                onChange={handleChange}
                                sx={styles.formControl}
                                fullWidth
                            />

                            <TextField
                                name="snomedUrl"
                                label="SNOMED URL"
                                value={config.snomedUrl}
                                onChange={handleChange}
                                sx={styles.formControl}
                                fullWidth
                            />

                            <TextField
                                name="snomedEdition"
                                label="SNOMED Edition"
                                value={config.snomedEdition}
                                onChange={handleChange}
                                sx={styles.formControl}
                                fullWidth
                            />
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Paper>
        </Stack>
    );
};

export default Configuration;
