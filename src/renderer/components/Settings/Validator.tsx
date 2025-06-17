import React, { useContext, useEffect, useCallback } from 'react';
import { TextField, Stack, Typography } from '@mui/material';
import { ISettings, ProgressInfo, ValidatorData } from 'interfaces/common';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { styles } from 'renderer/components/Settings/styles';
import { mainTaskTypes } from 'misc/constants';
import { ValidatorInfo } from 'renderer/components/Settings/ValidatorInfo';
import SettingsFileSelector from 'renderer/components/Settings/SettingsFileSelector';
import { validator as initialValidator } from 'renderer/redux/initialState';

interface ValidatorProps {
    settings: ISettings;
    validatorInfo: ValidatorData['info'];
    initialValidatorPath: string;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
    onChangeValidatorInfo: (info: ValidatorData['info']) => void;
}

export const Validator: React.FC<ValidatorProps> = ({
    settings,
    validatorInfo,
    initialValidatorPath,
    onSettingChange,
    onChangeValidatorInfo,
}) => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [updating, setUpdating] = React.useState<boolean>(false);

    const handleUpdateData = useCallback(
        (validatorPath: string) => {
            apiService.cleanTaskProgressListeners();

            apiService.subscriteToTaskProgress((info: ProgressInfo) => {
                if (
                    info.id === `${mainTaskTypes.VALIDATE}-validator-getInfo` &&
                    info.progress === 100
                ) {
                    if (info.result) {
                        onChangeValidatorInfo(info.result);
                    }
                    setUpdating(false);
                }
            });

            const runTask = async () => {
                // Use dummy options, as only the validatorPath is needed
                setUpdating(true);
                const result = await apiService.startTask({
                    type: 'validate',
                    task: 'getInfo',
                    options: {
                        validatorPath,
                        cachePath: '',
                        localRulesPath: '',
                        poolSize: 1,
                    },
                    idPrefix: 'validator',
                });
                if (typeof result === 'object' && 'error' in result) {
                    dispatch(
                        openSnackbar({
                            message: result.error,
                            type: 'error',
                        }),
                    );
                } else if (result === false) {
                    dispatch(
                        openSnackbar({
                            message: 'Error while executing the task',
                            type: 'error',
                        }),
                    );
                }
            };

            runTask();

            return () => {
                apiService.cleanTaskProgressListeners();
            };
        },
        [apiService, dispatch, onChangeValidatorInfo],
    );

    const handleRefresh = () => {
        if (settings.validator.validatorPath) {
            onChangeValidatorInfo(initialValidator.info);
            handleUpdateData(settings.validator.validatorPath);
        }
    };

    // If the validator path is changed, get information about the validator and controlled terminologies/standards
    useEffect(() => {
        if (
            initialValidatorPath !== settings.validator.validatorPath &&
            settings.validator.validatorPath
        ) {
            handleUpdateData(settings.validator.validatorPath);
        }
    }, [
        settings.validator.validatorPath,
        handleUpdateData,
        initialValidatorPath,
    ]);

    const handleSelectDestination = (
        destinationDir: string,
        type: 'folder' | 'file',
        name: string,
        onChange: (
            event: React.ChangeEvent<
                HTMLInputElement | { name?: string; value: unknown }
            >,
        ) => void,
        reset?: boolean,
    ) => {
        // Reset value
        if (reset) {
            onChange({
                target: {
                    name,
                    value: '',
                },
            } as unknown as React.ChangeEvent<HTMLInputElement>);
            return;
        }

        // Otherwise, open the file dialog
        const selectDestination = async () => {
            let result = '';
            if (type === 'folder') {
                result = await apiService.openDirectoryDialog(destinationDir);
            } else {
                const fileInfo = await apiService.openFileDialog({
                    initialFolder: destinationDir,
                });

                if (fileInfo && fileInfo.length > 0) {
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
            } else if (result) {
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
            <SettingsFileSelector
                name="validator.validatorPath"
                label="Path to CDISC Core Executable"
                value={settings.validator.validatorPath}
                type="file"
                onSelectDestination={handleSelectDestination}
                onChange={onSettingChange}
                helperText="Compiled CDISC Core executable"
            />
            <ValidatorInfo
                onRefresh={handleRefresh}
                disableRefresh={
                    settings.validator.validatorPath === '' || updating
                }
                validatorInfo={validatorInfo}
            />
            <TextField
                label="Threads"
                name="validator.poolSize"
                helperText="Number of processes used during the validation"
                type="number"
                value={settings.validator.poolSize}
                onChange={onSettingChange}
                slotProps={{ htmlInput: { min: 1, max: 16 } }}
                sx={styles.inputField}
            />
            <SettingsFileSelector
                name="validator.localRulesPath"
                label="Path to CDISC Core Local Rules"
                type="folder"
                helperText="Path to directory containing local rules for CDISC Core"
                value={settings.validator.localRulesPath}
                onSelectDestination={handleSelectDestination}
                onChange={onSettingChange}
            />
            <SettingsFileSelector
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
