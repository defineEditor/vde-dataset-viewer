import React from 'react';
import {
    TextField,
    Stack,
    Typography,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Alert,
} from '@mui/material';
import { ISettings } from 'interfaces/common';
import { styles } from 'renderer/components/Settings/styles';

interface ViewerProps {
    settings: ISettings;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
}

export const Viewer: React.FC<ViewerProps> = ({
    settings,
    onSettingChange,
}) => (
    <Stack spacing={2}>
        <Typography variant="h6">Table Loading Settings</Typography>
        <TextField
            label="Page Size"
            name="viewer.pageSize"
            value={settings.viewer.pageSize}
            type="number"
            helperText="Number of rows visible at once, large values may cause performance issues"
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
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
            value={settings.viewer.estimateWidthRows}
            onChange={onSettingChange}
            sx={styles.inputField}
            slotProps={{ htmlInput: { min: 1 } }}
        />
        <TextField
            label="Max Column Width"
            helperText="Maximum width in characters used for column width estimation"
            name="viewer.maxColWidth"
            type="number"
            value={settings.viewer.maxColWidth}
            onChange={onSettingChange}
            sx={styles.inputField}
            slotProps={{ htmlInput: { min: 1 } }}
        />
        <Typography variant="h6">Value Representation Settings</Typography>
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.viewer.dynamicRowHeight}
                        onChange={onSettingChange}
                        name="viewer.dynamicRowHeight"
                    />
                }
                label="Wrap Values"
            />
            <Typography variant="caption" sx={styles.helperText}>
                When selected, long cell values are wrapper
            </Typography>
        </Stack>
        <Stack spacing={0}>
            {settings.viewer.dynamicRowHeight && (
                <Alert severity="warning" sx={styles.alert}>
                    Warning: Value wrapping functionality is currently unstable
                    and may cause errors when scrolling with scrollbar
                </Alert>
            )}
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.viewer.applyDateFormat}
                        onChange={onSettingChange}
                        name="viewer.applyDateFormat"
                    />
                }
                label="Apply Date Format"
            />
            <Typography variant="caption" sx={styles.helperText}>
                For XPT/SAS7BDAT files, apply datetime/date/time format if
                assigned to a column. The list of formats is taken from Settings
                -&gt; Converter.
            </Typography>
        </Stack>
        <TextField
            label="Date Format"
            name="viewer.dateFormat"
            value={settings.viewer.dateFormat}
            helperText="Format used to show date/datetime values"
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
            }
            sx={styles.inputField}
        >
            <MenuItem value="ISO8601">ISO8601 (1992-01-01)</MenuItem>
            <MenuItem value="DDMONYEAR">DYMONYEAR (01JAN1992)</MenuItem>
        </TextField>
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.viewer.roundNumbers}
                        onChange={onSettingChange}
                        name="viewer.roundNumbers"
                    />
                }
                label="Round Numbers"
            />
            <Typography variant="caption" sx={styles.helperText}>
                When selected, float, double and decimal numbers will be rounded
            </Typography>
        </Stack>
        <TextField
            label="Max Precision"
            helperText="Precision used when number rounding is enabled"
            name="viewer.maxPrecision"
            type="number"
            disabled={!settings.viewer.roundNumbers}
            value={settings.viewer.maxPrecision}
            onChange={onSettingChange}
            sx={styles.inputField}
            slotProps={{ htmlInput: { min: 1, max: 32 } }}
        />
        <Typography variant="h6">Miscellaneous</Typography>
        <TextField
            label="Copied Values Format"
            helperText="A format used when selected cells are copied into a buffer (Ctrl+C)"
            name="viewer.copyFormat"
            value={settings.viewer.copyFormat}
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
            }
            sx={styles.inputField}
        >
            <MenuItem value="tab">Tab-delimited</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="json">JSON</MenuItem>
        </TextField>
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.viewer.showTypeIcons}
                        onChange={onSettingChange}
                        name="viewer.showTypeIcons"
                    />
                }
                label="Show Type Icons"
            />
            <Typography variant="caption" sx={styles.helperText}>
                When enabled, type icons are shown in the header of the table
            </Typography>
        </Stack>
    </Stack>
);
