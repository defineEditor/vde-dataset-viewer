import React from 'react';
import {
    Stack,
    Button,
    Typography,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ValidatorConfig } from 'interfaces/main';
import PathSelector from 'renderer/components/FileSelector';

const styles = {
    dialogContent: {
        minWidth: 500,
    },
};

interface DictionaryConfigModalProps {
    open: boolean;
    onClose: () => void;
    config: ValidatorConfig;
    onPathSelection: (
        name:
            | 'defineXmlPath'
            | 'whodrugPath'
            | 'meddraPath'
            | 'loincPath'
            | 'medrtPath'
            | 'uniiPath',
        reset?: boolean,
    ) => void;
    setConfig: React.Dispatch<React.SetStateAction<ValidatorConfig>>;
}

const DictionaryConfigModal: React.FC<DictionaryConfigModalProps> = ({
    open,
    onClose,
    config,
    onPathSelection,
    setConfig,
}) => {
    // Handle text input changes
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setConfig((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Dictionary Configuration</DialogTitle>
            <DialogContent sx={styles.dialogContent}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <PathSelector
                        label="WHODRUG Path"
                        value={config.whodrugPath}
                        onSelectDestination={() => {
                            onPathSelection('whodrugPath');
                        }}
                        onClean={() => {
                            onPathSelection('whodrugPath', true);
                        }}
                    />

                    <PathSelector
                        label="MedDRA Path"
                        value={config.meddraPath}
                        onSelectDestination={() => {
                            onPathSelection('meddraPath');
                        }}
                        onClean={() => {
                            onPathSelection('meddraPath', true);
                        }}
                    />

                    <PathSelector
                        label="LOINC Path"
                        value={config.loincPath}
                        onSelectDestination={() => {
                            onPathSelection('loincPath');
                        }}
                        onClean={() => {
                            onPathSelection('loincPath', true);
                        }}
                    />

                    <PathSelector
                        label="MedRT Path"
                        value={config.medrtPath}
                        onSelectDestination={() => {
                            onPathSelection('medrtPath');
                        }}
                        onClean={() => {
                            onPathSelection('medrtPath', true);
                        }}
                    />

                    <PathSelector
                        label="UNII Path"
                        value={config.uniiPath}
                        onSelectDestination={() => {
                            onPathSelection('uniiPath');
                        }}
                        onClean={() => {
                            onPathSelection('uniiPath', true);
                        }}
                    />

                    <Typography variant="h6" sx={{ mt: 3 }}>
                        SNOMED Configuration
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            name="snomedVersion"
                            label="SNOMED Version"
                            value={config.snomedVersion}
                            onChange={handleChange}
                            fullWidth
                        />

                        <TextField
                            name="snomedUrl"
                            label="SNOMED URL"
                            value={config.snomedUrl}
                            onChange={handleChange}
                            fullWidth
                        />

                        <TextField
                            name="snomedEdition"
                            label="SNOMED Edition"
                            value={config.snomedEdition}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DictionaryConfigModal;
