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
import AppContext from 'renderer/utils/AppContext';
import store from 'renderer/redux/store';
import { ISettings } from 'interfaces/common';
import { styles } from 'renderer/components/Settings/styles';
import { Viewer } from 'renderer/components/Settings/Viewer';
import { Converter } from 'renderer/components/Settings/Converter';
import { Other } from 'renderer/components/Settings/Other';

const Settings: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const initialSettings = useAppSelector((state) => state.settings);
    const dispatch = useAppDispatch();
    const [newSettings, setNewSettings] = useState<ISettings>(initialSettings);
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
        dispatch(
            openSnackbar({
                message: 'Settings saved',
                type: 'success',
                props: { duration: 1000 },
            }),
        );
        const state = store.getState();
        apiService.saveLocalStore({ reduxStore: state });
    }, [dispatch, newSettings, apiService]);

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
        JSON.stringify(initialSettings) !== JSON.stringify(newSettings);

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
            <Stack sx={styles.main} spacing={2} justifyContent="space-between">
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                >
                    <Tab label="Viewer" sx={styles.tab} />
                    <Tab label="Converter" sx={styles.tab} />
                    <Tab label="Other" sx={styles.tab} />
                </Tabs>
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
                    <Other
                        settings={newSettings}
                        onSettingChange={handleInputChange}
                    />
                </Box>
                <Stack direction="row" spacing={2} sx={styles.buttonContainer}>
                    <Button onClick={handleReset} color="primary">
                        Reset to default
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={!settingsChanged}
                        color="primary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!settingsChanged}
                        color="primary"
                    >
                        Save
                    </Button>
                </Stack>
            </Stack>
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
