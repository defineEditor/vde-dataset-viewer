import React from 'react';
import { TextField, Stack, Button, MenuItem } from '@mui/material';
import { styles } from 'renderer/components/Settings/styles';
import { ValidatorData } from 'interfaces/store';

interface ValidatorInfoProps {
    disableRefresh: boolean;
    onRefresh: () => void;
    validatorInfo: ValidatorData['info'];
}

export const ValidatorInfo: React.FC<ValidatorInfoProps> = ({
    onRefresh,
    disableRefresh,
    validatorInfo,
}) => {
    const [refresh, setRefresh] = React.useState<boolean>(false);

    const handleRefresh = () => {
        if (!refresh) {
            setRefresh(true);
            onRefresh();
        }
    };

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
                onChange={() => {}}
            >
                {validatorInfo.standards.map((standard) => (
                    <MenuItem value={standard}>{standard}</MenuItem>
                ))}
            </TextField>
            <TextField
                label="Controlled Terminologies"
                disabled={validatorInfo.terminology.length === 0}
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
                    <MenuItem value={terminology}>{terminology}</MenuItem>
                ))}
            </TextField>
            <Button
                variant="contained"
                onClick={handleRefresh}
                disabled={disableRefresh}
            >
                Refresh
            </Button>
        </Stack>
    );
};
