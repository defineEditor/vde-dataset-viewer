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

interface CompareProps {
    settings: ISettings;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
}

const checkRegex = (regexString: string) => {
    let validRegex = true;
    try {
        RegExp(regexString);
    } catch {
        validRegex = false;
    }
    return !validRegex;
};

export const Compare: React.FC<CompareProps> = ({
    settings,
    onSettingChange,
}) => (
    <Stack spacing={2}>
        <Typography variant="h6">Compare Processing Settings</Typography>
        <TextField
            label="Tolerance Size"
            name="compare.tolerance"
            value={settings.compare.tolerance}
            type="number"
            helperText="Numeric tolerance used when comparing float/double numbers"
            select
            onChange={(event) =>
                onSettingChange(event as React.ChangeEvent<HTMLInputElement>)
            }
            fullWidth
            sx={styles.inputField}
        >
            <MenuItem value="1e-15">1e-15</MenuItem>
            <MenuItem value="1e-14">1e-14</MenuItem>
            <MenuItem value="1e-13">1e-13</MenuItem>
            <MenuItem value="1e-12">1e-12</MenuItem>
            <MenuItem value="1e-11">1e-11</MenuItem>
            <MenuItem value="1e-10">1e-10</MenuItem>
            <MenuItem value="1e-9">1e-9</MenuItem>
            <MenuItem value="1e-8">1e-8</MenuItem>
            <MenuItem value="1e-7">1e-7</MenuItem>
            <MenuItem value="1e-6">1e-6</MenuItem>
            <MenuItem value="1e-5">1e-5</MenuItem>
            <MenuItem value="1e-4">1e-4</MenuItem>
            <MenuItem value="1e-3">1e-3</MenuItem>
            <MenuItem value="1e-2">1e-2</MenuItem>
            <MenuItem value="1e-1">1e-1</MenuItem>
            <MenuItem value="1">1</MenuItem>
        </TextField>
        <TextField
            label="Maximum Number of Differences"
            name="compare.maxDiffCount"
            helperText="Compare will stop after this many different rows are found (0 = unlimited)"
            type="number"
            value={settings.compare.maxDiffCount}
            onChange={onSettingChange}
            sx={styles.inputField}
            slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
            label="Maximum Number of Column Differences"
            helperText="Compare will stop for this column after this many different column values are found (0 = unlimited)"
            name="compare.maxColumnDiffCount"
            type="number"
            value={settings.compare.maxColumnDiffCount}
            onChange={onSettingChange}
            sx={styles.inputField}
            slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
            label="Column Ignore Pattern"
            helperText="Pattern for ignoring columns during comparison (RegExp syntax: ^abc.* to ignore all columns starting with 'abc')"
            name="compare.ignorePattern"
            type="text"
            error={checkRegex(settings.compare.ignorePattern)}
            value={settings.compare.ignorePattern}
            onChange={onSettingChange}
            sx={styles.inputFieldLong}
        />
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.compare.ignoreColumnCase}
                        onChange={onSettingChange}
                        name="compare.ignoreColumnCase"
                    />
                }
                label="Ignore Column Case"
            />
            <Typography variant="caption" sx={styles.helperText}>
                When enabled, column name case is ignored during comparison
            </Typography>
        </Stack>
        <Stack spacing={0}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={settings.compare.reorderCompareColumns}
                        onChange={onSettingChange}
                        name="compare.reorderCompareColumns"
                    />
                }
                label="Reorder Compare Columns"
            />
            <Typography variant="caption" sx={styles.helperText}>
                When enabled, in the data view tab, compare dataset columns will
                be reordered to match base dataset column order
            </Typography>
        </Stack>
    </Stack>
);
