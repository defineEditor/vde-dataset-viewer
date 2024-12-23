import React, { useState } from 'react';
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
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { ISettings } from 'interfaces/common';
import { setSettings } from 'renderer/redux/slices/settings';

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
    },
    tab: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    inputField: {
        maxWidth: '400px',
    },
};

const Settings: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const initialSettings = useAppSelector((state) => state.settings);
    const dispatch = useAppDispatch();

    const [newSettings, setNewSettings] = useState<ISettings>(initialSettings);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTabIndex(newValue);
    };

    const handleSave = () => {
        dispatch(setSettings(newSettings));
        // Implement save functionality here
    };

    const handleCancel = () => {
        setSettings(initialSettings);
    };

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
                        <TextField
                            label="Page Size"
                            name="viewer.pageSize"
                            value={newSettings.viewer.pageSize}
                            type="number"
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
                            type="number"
                            value={newSettings.viewer.estimateWidthRows}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
                        <TextField
                            label="Max Column Width"
                            name="viewer.maxColWidth"
                            type="number"
                            value={newSettings.viewer.maxColWidth}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1 } }}
                        />
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
                            label="Multiline Rows"
                        />
                        <TextField
                            label="Date Format"
                            name="viewer.dateFormat"
                            value={newSettings.viewer.dateFormat}
                            select
                            onChange={(event) =>
                                handleInputChange(
                                    event as React.ChangeEvent<HTMLInputElement>,
                                )
                            }
                            sx={styles.inputField}
                        >
                            <MenuItem value="ISO8601">
                                ISO8601 (01-01-1992)
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
                        <TextField
                            label="Max Precision"
                            name="viewer.maxPrecision"
                            type="number"
                            disabled={!newSettings.viewer.roundNumbers}
                            value={newSettings.viewer.maxPrecision}
                            onChange={handleInputChange}
                            sx={styles.inputField}
                            slotProps={{ htmlInput: { min: 1, max: 32 } }}
                        />
                        <TextField
                            label="Format Copied Fields"
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
                        <TextField
                            label="Threads"
                            name="converter.threads"
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
                        <TextField
                            label="Loading Animation"
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
                    </Stack>
                </Box>
                <Stack direction="row" spacing={2} sx={styles.buttonContainer}>
                    <Button onClick={handleCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} color="primary">
                        Save
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
};

export default Settings;
