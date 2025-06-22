import React from 'react';
import { TextField, Stack, Button, MenuItem } from '@mui/material';
import { styles } from 'renderer/components/Settings/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { ValidatorData } from 'interfaces/store';

interface ValidatorInfoProps {
    disableRefresh: boolean;
    onRefresh: () => void;
    updating: boolean;
    validatorInfo: ValidatorData['info'];
}

export const ValidatorInfo: React.FC<ValidatorInfoProps> = ({
    onRefresh,
    disableRefresh,
    updating,
    validatorInfo,
}) => {
    return (
        <Stack direction="row" spacing={2}>
            <TextField
                label="Version"
                value={validatorInfo.version}
                sx={styles.inputField}
                disabled
            />
            <TextField
                label="Standards"
                disabled={validatorInfo.standards.length === 0}
                slotProps={{
                    select: {
                        displayEmpty: true,
                        renderValue: () => {
                            return <>See standards</>;
                        },
                    },
                    inputLabel: {
                        shrink: true,
                    },
                }}
                select
                value=""
                onChange={() => {}}
            >
                {validatorInfo.standards.map((standard) => (
                    <MenuItem value={standard} key={standard}>
                        {standard}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label="Controlled Terminologies"
                disabled={validatorInfo.terminology.length === 0}
                value=""
                slotProps={{
                    select: {
                        displayEmpty: true,
                        renderValue: () => {
                            return <>See Controlled Terminologies</>;
                        },
                    },
                    inputLabel: {
                        shrink: true,
                    },
                }}
                select
                onChange={() => {}}
            >
                {validatorInfo.terminology.map((terminology) => (
                    <MenuItem value={terminology} key={terminology}>
                        {terminology}
                    </MenuItem>
                ))}
            </TextField>
            <Button
                variant="contained"
                onClick={onRefresh}
                disabled={disableRefresh}
                sx={styles.refreshButton}
            >
                {updating ? (
                    <CircularProgress size={24} sx={styles.circularProgress} />
                ) : (
                    <span>Refresh</span>
                )}
            </Button>
        </Stack>
    );
};
