import React, { useState, useEffect } from 'react';
import {
    Paper,
    Tabs,
    Tab,
    Box,
    Button,
    Stack,
    TextField,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { ISettings } from 'interfaces/common';
import { resetSettings, setSettings } from 'renderer/redux/slices/settings';
import { openSnackbar } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import store from 'renderer/redux/store';

const styles = {
    main: {
        height: '100%',
    },
    tabPanel: {
        padding: 4,
        flex: '1 1 99%',
    },
    buttonContainer: {
        padding: 4,
        display: 'flex',
        justifyContent: 'flex-end',
    },
    paper: {
        height: '100%',
        backgroundColor: 'grey.50',
    },
    helperText: {
        paddingLeft: 2,
        margin: 0,
    },
    tab: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    inputField: {
        maxWidth: '600px',
    },
};

const Settings: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const initialSettings = useAppSelector((state) => state.settings);
    const dispatch = useAppDispatch();

    const [newSettings, setNewSettings] = useState<ISettings>(initialSettings);
    const [reloadSettings, setReloadSettings] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTabIndex(newValue);
    };

    const { apiService } = React.useContext(AppContext);

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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [newSettings, handleSave]);

    const settingsChanged =
        JSON.stringify(initialSettings) !== JSON.stringify(newSettings);

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
                    <Stack spacing={2}>
                        <Typography variant="h6">
                            Table Loading Settings
                        </Typography>
                        <TextField
                            label="Page Size"
                            name="viewer.pageSize"
                            value={newSettings.viewer.pageSize}
                            type="number"
                            helperText="Number of rows visible at once, large values may cause performance issues"
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            fullWidth
                            sx={styles.inputField}
                        >
                            <MenuItem value="1000">1000</MenuItem>
                            <MenuItem value="10000">10000</MenuItem>
                            <MenuItem value="20000">20000</MenuItem>
                            <MenuItem value="50000">50000</MenuItem>
                            <MenuItem value="100000">100000</MenuItem>
                        </TextField>
                        <TextField
                            label="Number of Rows Used for Width Estimation"
                            name="viewer.estimateWidthRows"
                            helperText="When table is loaded, this many rows are used to estimate column width"
                            type="number"
                            value={newSettings.viewer.estimateWidthRows}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                        <TextField
                            label="Max Column Width"
                            helperText="Maximum width of a column in characters"
                            name="viewer.maxColWidth"
                            type="number"
                            value={newSettings.viewer.maxColWidth}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                        <Typography variant="h6">
                            Value Representation Settings
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={
                                        newSettings.viewer.dynamicRowHeight
                                    }
                                    onChange={handleInputChange}
                                    name="viewer.dynamicRowHeight"
                                />
                            }
                            label="Wrap Values"
                        />
                        <Typography variant="caption" sx={styles.helperText}>
                            When selected, long cell values are wrapper
                        </Typography>
                        <TextField
                            label="Date Format"
                            name="viewer.dateFormat"
                            value={newSettings.viewer.dateFormat}
                            helperText="Format used to show date/datetime values"
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="ISO8601">
                                ISO8601 (1992-01-01)
                            </MenuItem>
                            <MenuItem value="DDMONYEAR">
                                DYMONYEAR (01JAN1992)
                            </MenuItem>
                        </TextField>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={newSettings.viewer.roundNumbers}
                                    onChange={handleInputChange}
                                    name="viewer.roundNumbers"
                                />
                            }
                            label="Round Numbers"
                        />
                        <Typography variant="caption" sx={styles.helperText}>
                            When selected, float, double and decimal numbers
                            will be rounded
                        </Typography>
                        <TextField
                            label="Max Precision"
                            helperText="Precision used when number rounding is enabled"
                            name="viewer.maxPrecision"
                            type="number"
                            disabled={!newSettings.viewer.roundNumbers}
                            value={newSettings.viewer.maxPrecision}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1, max: 32 } }}
                        />
                        <Typography variant="h6">Miscellaneous</Typography>
                        <TextField
                            label="Copied Values Format"
                            helperText="A format used when selected cells are copied into a buffer (Ctrl+C)"
                            name="viewer.copyFormat"
                            value={newSettings.viewer.copyFormat}
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="tab">Tab-delimited</MenuItem>
                            <MenuItem value="csv">CSV</MenuItem>
                            <MenuItem value="json">JSON</MenuItem>
                        </TextField>
                    </Stack>
                </Box>
                <Box hidden={tabIndex !== 1} sx={styles.tabPanel}>
                    <Stack spacing={2}>
                        <Typography variant="h6">Converter Settings</Typography>
                        <TextField
                            label="Threads"
                            name="converter.threads"
                            helperText="Number of processes used during the conversion"
                            type="number"
                            value={newSettings.converter.threads}
                            onChange={handleInputChange}
                            slotProps={{ htmlInput: { min: 1, max: 16 } }}
                            sx={styles.inputField}
                        />
                        <TextField
                            label="Default Output Format"
                            name="converter.defaultOutputFormat"
                            value={newSettings.converter.defaultOutputFormat}
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="json">JSON</MenuItem>
                            <MenuItem value="ndjson">NDJSON</MenuItem>
                        </TextField>
                    </Stack>
                </Box>
                <Box hidden={tabIndex !== 2} sx={styles.tabPanel}>
                    <Stack spacing={2}>
                        <Typography variant="h6">
                            Miscellaneous Settings
                        </Typography>
                        <TextField
                            label="Loading Animation"
                            helperText="A loading animation to be displayed when data is being loaded"
                            name="other.loadingAnimation"
                            value={newSettings.other.loadingAnimation}
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="santa">Santa</MenuItem>
                            <MenuItem value="cat">Cat</MenuItem>
                            <MenuItem value="dog">Dog</MenuItem>
                            <MenuItem value="normal">Normal</MenuItem>
                            <MenuItem value="random">Random</MenuItem>
                        </TextField>
                        <TextField
                            label="Input encoding"
                            helperText={
                                newSettings.other.inEncoding === 'utf8'
                                    ? 'Ecoding used when reading files'
                                    : 'Be sure the correct encoding is specified, in most situations you should use UTF8'
                            }
                            name="other.inEncoding"
                            color={
                                newSettings.other.inEncoding !== 'utf8'
                                    ? 'warning'
                                    : 'primary'
                            }
                            value={newSettings.other.inEncoding}
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="utf8">UTF8</MenuItem>
                            <MenuItem value="utf16le">UTF16LE</MenuItem>
                            <MenuItem value="base64">Base64</MenuItem>
                            <MenuItem value="ucs2">UCS2</MenuItem>
                            <MenuItem value="latin1">Latin1</MenuItem>
                            <MenuItem value="ascii">ASCII</MenuItem>
                        </TextField>
                    </Stack>
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
