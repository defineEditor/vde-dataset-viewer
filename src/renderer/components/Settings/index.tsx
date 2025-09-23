import React, { useState, useEffect } from 'react';
import {
    Paper,
    Tabs,
    Tab,
    Box,
    Button,
    Stack,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { resetSettings, setSettings } from 'renderer/redux/slices/settings';
import { openSnackbar } from 'renderer/redux/slices/ui';
import {
    resetValidatorInfo,
    setValidatorData,
} from 'renderer/redux/slices/data';
import AppContext from 'renderer/utils/AppContext';
import store from 'renderer/redux/store';
import { dehydrateState } from 'renderer/redux/stateUtils';
import { styles } from 'renderer/components/Settings/styles';
import { ISettings } from 'interfaces/common';
import { Viewer } from 'renderer/components/Settings/Viewer';
import { Converter } from 'renderer/components/Settings/Converter';
import { Validator } from 'renderer/components/Settings/Validator';
import { Other } from 'renderer/components/Settings/Other';

const Settings: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const initialSettings = useAppSelector((state) => state.settings);
    const initialValidatorInfo = useAppSelector(
        (state) => state.data.validator.info,
    );
    const dispatch = useAppDispatch();
    const [newSettings, setNewSettings] = useState<ISettings>(initialSettings);
    const [newValidatorInfo, setNewValidatorInfo] =
        useState(initialValidatorInfo);
    const [reloadSettings, setReloadSettings] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);

    const { apiService } = React.useContext(AppContext);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTabIndex(newValue);
    };

    const handleSave = React.useCallback(() => {
        dispatch(setSettings(newSettings));
        // If validator path was removed, reset the validator info
        if (
            newSettings.validator.validatorPath === '' &&
            initialSettings.validator.validatorPath !== ''
        ) {
            dispatch(resetValidatorInfo());
        } else if (
            JSON.stringify(initialValidatorInfo) !==
            JSON.stringify(newValidatorInfo)
        ) {
            // Save validator info if it was changed
            dispatch(setValidatorData({ info: newValidatorInfo }));
        }
        dispatch(
            openSnackbar({
                message: 'Settings saved',
                type: 'success',
                props: { duration: 1000 },
            }),
        );
        const state = dehydrateState(store.getState());
        apiService.saveLocalStore({ reduxStore: state });
    }, [
        dispatch,
        newSettings,
        newValidatorInfo,
        apiService,
        initialSettings.validator.validatorPath,
        initialValidatorInfo,
    ]);

    const handleCancel = () => {
        setSettings(initialSettings);
    };

    const handleReset = () => {
        setOpenResetDialog(true);
    };

    const handleConfirmReset = () => {
        dispatch(resetSettings());
        setReloadSettings(true);
        setOpenResetDialog(false);
    };

    const handleCloseResetDialog = () => {
        setOpenResetDialog(false);
    };

    useEffect(() => {
        if (reloadSettings) {
            setNewSettings(initialSettings);
            setReloadSettings(false);
        }
    }, [initialSettings, reloadSettings]);

    const handleInputChange = (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => {
        const { name, value, type, checked } = event.target as HTMLInputElement;
        const section = name?.split('.')[0] as keyof ISettings;
        const setting = name?.split('.')[1] as keyof ISettings[keyof ISettings];
        let newValue: unknown = value;
        if (
            [
                'pageSize',
                'estimateWidthRows',
                'maxColWidth',
                'maxPrecision',
                'threads',
            ].includes(setting)
        ) {
            newValue = parseInt(value as string, 10);
        }
        setNewSettings({
            ...newSettings,
            [section]: {
                ...newSettings[section],
                [setting]: type === 'checkbox' ? checked : newValue,
            },
        });
    };

    const settingsChanged =
        JSON.stringify(initialSettings) !== JSON.stringify(newSettings) ||
        JSON.stringify(initialValidatorInfo) !==
            JSON.stringify(newValidatorInfo);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 's' && settingsChanged) {
                event.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [newSettings, handleSave, settingsChanged]);

    return (
        <Paper sx={styles.paper}>
            <Box sx={styles.contentContainer}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={styles.tabs}
                >
                    <Tab label="VIEWER" />
                    <Tab label="CONVERTER" />
                    <Tab label="VALIDATION" />
                    <Tab label="OTHER" />
                </Tabs>
                <Box sx={styles.scrollableContent}>
                    <Box hidden={tabIndex !== 0} sx={styles.tabPanel}>
                        <Viewer
                            settings={newSettings}
                            onSettingChange={handleInputChange}
                        />
                    </Box>
                    <Box hidden={tabIndex !== 1} sx={styles.tabPanel}>
                        <Converter
                            settings={newSettings}
                            onSettingChange={handleInputChange}
                        />
                    </Box>
                    <Box hidden={tabIndex !== 2} sx={styles.tabPanel}>
                        <Validator
                            settings={newSettings}
                            onSettingChange={handleInputChange}
                            validatorInfo={newValidatorInfo}
                            onChangeValidatorInfo={setNewValidatorInfo}
                            initialValidatorPath={
                                initialSettings.validator.validatorPath
                            }
                        />
                    </Box>
                    <Box hidden={tabIndex !== 3} sx={styles.tabPanel}>
                        <Other
                            settings={newSettings}
                            onSettingChange={handleInputChange}
                        />
                    </Box>
                </Box>
            </Box>
            <Box sx={styles.fixedButtonBar}>
                <Stack direction="row" spacing={2} sx={styles.buttonContainer}>
                    <Button
                        onClick={handleReset}
                        color="primary"
                        variant="contained"
                    >
                        Reset to default
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={!settingsChanged}
                        color="primary"
                        variant="contained"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!settingsChanged}
                        color="primary"
                        variant="contained"
                    >
                        Save
                    </Button>
                </Stack>
            </Box>
            <Dialog open={openResetDialog} onClose={handleCloseResetDialog}>
                <DialogTitle>Confirm Reset</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to reset settings to default
                        values?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseResetDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmReset} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default Settings;
