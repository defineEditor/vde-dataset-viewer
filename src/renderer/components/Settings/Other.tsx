import React from 'react';
import {
    TextField,
    Stack,
    Typography,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { ISettings } from 'interfaces/common';
import { styles } from 'renderer/components/Settings/styles';

interface OtherProps {
    settings: ISettings;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
}

export const Other: React.FC<OtherProps> = ({ settings, onSettingChange }) => (
    <Stack spacing={2}>
        <Typography variant="h6">Miscellaneous Settings</Typography>
        <TextField
            label="Input encoding"
            helperText={
                settings.other.inEncoding === 'utf8'
                    ? 'Ecoding used when reading files'
                    : 'Be sure the correct encoding is specified, in most situations you should use UTF8'
            }
            name="other.inEncoding"
            color={settings.other.inEncoding !== 'utf8' ? 'warning' : 'primary'}
            value={settings.other.inEncoding}
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
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
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.other.checkForUpdates}
                        onChange={onSettingChange}
                        name="other.checkForUpdates"
                    />
                }
                label="Check for updates on startup"
            />
            <Typography variant="caption" sx={styles.helperText}>
                Check for new versions of the application on startup.
            </Typography>
        </Stack>
        <Typography variant="h6">Animations</Typography>
        <TextField
            label="Loading Animation"
            helperText="A loading animation to be displayed when data is being loaded"
            name="other.loadingAnimation"
            value={settings.other.loadingAnimation}
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
            }
            sx={styles.inputField}
        >
            <MenuItem value="santa">Santa</MenuItem>
            <MenuItem value="cat">Cat</MenuItem>
            <MenuItem value="dog">Dog</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="random">Random</MenuItem>
        </TextField>
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.other.dragoverAnimation}
                        onChange={onSettingChange}
                        name="other.dragoverAnimation"
                    />
                }
                label="File dragging animation"
            />
            <Typography variant="caption" sx={styles.helperText}>
                Show an animation when dragging files over the application
                window.
            </Typography>
        </Stack>
    </Stack>
);
