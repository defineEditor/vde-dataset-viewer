import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Checkbox,
    FormControlLabel,
    Typography,
    Alert,
    MenuItem,
} from '@mui/material';
import { ConversionOptions } from 'interfaces/common';

interface OptionsDialogProps {
    open: boolean;
    onClose: () => void;
    options: ConversionOptions;
    onOptionsChange: (options: ConversionOptions) => void;
}

const styles = {
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    content: {
        p: 2,
        m: 2,
    },
    fields: {
        m: 2,
    },
    noSelect: {
        userSelect: 'none',
    },
    helperText: {
        paddingLeft: 2,
        m: 0,
    },
    alert: {
        m: 2,
    },
    actions: {
        m: 2,
    },
};

const Options: React.FC<OptionsDialogProps> = ({
    open,
    onClose,
    options,
    onOptionsChange,
}) => {
    const [localOptions, setLocalOptions] =
        useState<ConversionOptions>(options);

    useEffect(() => {
        setLocalOptions(options);
    }, [options]);

    const handleChange = (
        field: keyof ConversionOptions,
        value: boolean | string,
    ) => {
        setLocalOptions({
            ...localOptions,
            [field]: value,
        });
    };

    const handleSave = () => {
        onOptionsChange(localOptions);
        onClose();
    };

    const handleClose = () => {
        setLocalOptions(options);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={styles.title}>Conversion Options</DialogTitle>
            <DialogContent sx={styles.content}>
                <Stack spacing={2} sx={styles.fields}>
                    <FormControlLabel
                        sx={styles.noSelect}
                        control={
                            <Checkbox
                                checked={localOptions.prettyPrint}
                                onChange={(e) =>
                                    handleChange(
                                        'prettyPrint',
                                        e.target.checked,
                                    )
                                }
                            />
                        }
                        label="Pretty Print"
                    />
                    <Typography variant="caption" sx={styles.helperText}>
                        Output JSON file in a human-readable format
                    </Typography>
                    {localOptions.prettyPrint && (
                        <Alert severity="warning" sx={styles.alert}>
                            It is recommended to disable pretty print option for
                            final datasets, due to significant increase in file
                            size
                        </Alert>
                    )}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            select
                            label="Input Encoding"
                            value={localOptions.inEncoding}
                            onChange={(e) =>
                                handleChange('inEncoding', e.target.value)
                            }
                        >
                            <MenuItem value="default">Default</MenuItem>
                            <MenuItem value="utf8">UTF-8</MenuItem>
                            <MenuItem value="utf16le">UTF-16 LE</MenuItem>
                            <MenuItem value="base64">Base64</MenuItem>
                            <MenuItem value="ucs2">UCS-2</MenuItem>
                            <MenuItem value="latin1">Latin-1</MenuItem>
                            <MenuItem value="ascii">ASCII</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            select
                            label="Output Encoding"
                            value={localOptions.outEncoding}
                            onChange={(e) =>
                                handleChange('outEncoding', e.target.value)
                            }
                        >
                            <MenuItem value="default">Default</MenuItem>
                            <MenuItem value="utf8">UTF-8</MenuItem>
                            <MenuItem value="utf16le">UTF-16 LE</MenuItem>
                            <MenuItem value="base64">Base64</MenuItem>
                            <MenuItem value="ucs2">UCS-2</MenuItem>
                            <MenuItem value="latin1">Latin-1</MenuItem>
                            <MenuItem value="ascii">ASCII</MenuItem>
                        </TextField>
                    </Stack>
                    <FormControlLabel
                        sx={styles.noSelect}
                        control={
                            <Checkbox
                                checked={localOptions.renameFiles}
                                onChange={(e) =>
                                    handleChange(
                                        'renameFiles',
                                        e.target.checked,
                                    )
                                }
                            />
                        }
                        label="Rename Output Files"
                    />
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label="Pattern (regex)"
                            value={localOptions.renamePattern}
                            onChange={(e) =>
                                handleChange('renamePattern', e.target.value)
                            }
                            placeholder="e.g. ^(.+)$"
                            disabled={!localOptions.renameFiles}
                        />
                        <TextField
                            fullWidth
                            label="Replacement"
                            value={localOptions.renameReplacement}
                            onChange={(e) =>
                                handleChange(
                                    'renameReplacement',
                                    e.target.value,
                                )
                            }
                            placeholder="e.g. prefix_$1"
                            disabled={!localOptions.renameFiles}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Options;
