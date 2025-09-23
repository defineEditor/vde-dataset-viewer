import React from 'react';
import {
    Stack,
    Button,
    Dialog,
    FormControlLabel,
    Switch,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useAppSelector } from 'renderer/redux/hooks';
import { ValidatorConfig } from 'interfaces/common';

const styles = {
    dialogContent: {
        minWidth: 500,
    },
};

interface OptionsModalProps {
    open: boolean;
    onClose: () => void;
    config: ValidatorConfig;
    setConfig: React.Dispatch<React.SetStateAction<ValidatorConfig>>;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
    open,
    onClose,
    config,
    setConfig,
}) => {
    const validatorSettings = useAppSelector(
        (state) => state.settings.validator,
    );

    // Handle switch changes
    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setConfig((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Validator Options</DialogTitle>
            <DialogContent sx={styles.dialogContent}>
                <Stack spacing={3} sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.customStandard}
                                onChange={handleSwitchChange}
                                name="customStandard"
                                disabled={
                                    validatorSettings.localRulesPath === ''
                                }
                            />
                        }
                        label="Use Custom Standard"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.validateXml}
                                onChange={handleSwitchChange}
                                name="validateXml"
                                disabled={config.defineXmlPath === ''}
                            />
                        }
                        label="Validate XML"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OptionsModal;
