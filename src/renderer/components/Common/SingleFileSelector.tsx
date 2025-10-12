import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';

const SingleFileSelector: React.FC<{
    label: string;
    value: string;
    onSelectDestination: () => void;
    onClean: () => void;
    helperText?: string;
    sx?: object;
}> = ({
    label,
    value,
    onSelectDestination,
    onClean,
    helperText = false,
    sx = {},
}) => {
    return (
        <TextField
            fullWidth
            label={label}
            value={value}
            sx={sx}
            helperText={helperText}
            slotProps={{
                input: {
                    readOnly: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton
                                onClick={onSelectDestination}
                                edge="start"
                            >
                                <FolderOpenIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={onClean} edge="end">
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

export default SingleFileSelector;
