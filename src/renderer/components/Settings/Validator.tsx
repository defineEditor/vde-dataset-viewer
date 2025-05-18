import React, { useContext, useEffect } from 'react';
import {
    TextField,
    IconButton,
    InputAdornment,
    Stack,
    Typography,
} from '@mui/material';
import { ISettings } from 'interfaces/common';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { styles } from 'renderer/components/Settings/styles';

interface ValidatorProps {
    settings: ISettings;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
}

const DirectorySelector: React.FC<{
    name: string;
    label: string;
    value: string;
    type: 'folder' | 'file';
    onSelectDestination: (
        folder: string,
        type: 'folder' | 'file',
        name: string,
        onChange: (
            event: React.ChangeEvent<
                HTMLInputElement | { name?: string; value: unknown }
            >,
        ) => void,
    ) => void;
    onChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
    helperText?: string;
}> = ({
    name,
    label,
    value,
    type,
    onSelectDestination,
    onChange,
    helperText = false,
}) => {
    return (
        <TextField
            fullWidth
            name={name}
            label={label}
            value={value}
            sx={styles.inputFieldLong}
            helperText={helperText}
            slotProps={{
                input: {
                    readOnly: true,
                    startAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() =>
                                    onSelectDestination(
                                        value,
                                        type,
                                        name,
                                        onChange,
                                    )
                                }
                                edge="start"
                            >
                                <FolderOpenIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

export const Validator: React.FC<ValidatorProps> = ({
    settings,
    onSettingChange,
}) => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    // If the validator path is changed, get information about the validator and controlled terminologies/standards
    useEffect(() => {
        const getValidatorInfo = async () => {
            try {
                // Get the version;
                const version = await apiService.startTask({
                    type: 'validate',
                    task: 'getVersion',
                    options: settings.validator,
                });
                const standards = await apiService.startTask({
                    type: 'validate',
                    task: 'getStandards',
                    options: settings.validator,
                });
                const terminology = await apiService.startTask({
                    type: 'validate',
                    task: 'getTerminology',
                    options: settings.validator,
                });
                return { version, standards, terminology };
            } catch (error) {
                dispatch(
                    openSnackbar({
                        message: 'Error while getting validator information',
                        type: 'error',
                    }),
                );
            }
            return null;
        };

        if (settings.validator.validatorPath) {
            getValidatorInfo();
        }
    });

    const handleSelectDestination = (
        destinationDir: string,
        type: 'folder' | 'file',
        name: string,
        onChange: (
            event: React.ChangeEvent<
                HTMLInputElement | { name?: string; value: unknown }
            >,
        ) => void,
    ) => {
        const selectDestination = async () => {
            let result = '';
            if (type === 'folder') {
                result = await apiService.openDirectoryDialog(destinationDir);
            } else {
                const fileInfo = await apiService.openFileDialog({
                    initialFolder: destinationDir,
                });

                if (fileInfo) {
                    result = fileInfo[0].fullPath;
                }
            }
            if (result === null) {
                dispatch(
                    openSnackbar({
                        message: 'Error while selecting the destination folder',
                        type: 'error',
                    }),
                );
            } else {
                onChange({
                    target: {
                        name,
                        value: result,
                    },
                } as unknown as React.ChangeEvent<HTMLInputElement>);
            }
        };
        selectDestination();
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h6">CDISC Core Settings</Typography>
            <DirectorySelector
                name="validator.validatorPath"
                label="Path to CDISC Core Executable"
                value={settings.validator.validatorPath}
                type="file"
                onSelectDestination={handleSelectDestination}
                onChange={onSettingChange}
                helperText="Compiled CDISC Core executable"
            />
            <TextField
                label="Threads"
                name="converter.threads"
                helperText="Number of processes used during the validation"
                type="number"
                value={settings.validator.poolSize}
                onChange={onSettingChange}
                slotProps={{ htmlInput: { min: 1, max: 16 } }}
                sx={styles.inputField}
            />
            <DirectorySelector
                name="validator.localRulesPath"
                label="Path to CDISC Core Local Rules"
                type="folder"
                helperText="Path to directory containing local rules for CDISC Core"
                value={settings.validator.validatorPath}
                onSelectDestination={handleSelectDestination}
                onChange={onSettingChange}
            />
            <DirectorySelector
                name="validator.cachePath"
                label="Path to CDISC Core Cache"
                helperText="Path to cache files containing preloaded metadata and rules"
                type="folder"
                value={settings.validator.cachePath}
                onSelectDestination={handleSelectDestination}
                onChange={onSettingChange}
            />
        </Stack>
    );
};
