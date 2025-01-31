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
} from '@mui/material';

interface ConversionOptions {
    prettyPrint: boolean;
    renameFiles: boolean;
    renamePattern: string;
    renameReplacement: string;
}

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
        margin: 0,
        mt: 0,
    },
    alert: {
        margin: 2,
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
                        label="Rename Files"
                    />
                    <>
                        <TextField
                            label="Pattern (regex)"
                            value={localOptions.renamePattern}
                            onChange={(e) =>
                                handleChange('renamePattern', e.target.value)
                            }
                            placeholder="e.g. ^(.+)$"
                            disabled={!localOptions.renameFiles}
                        />
                        <TextField
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
                    </>
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
