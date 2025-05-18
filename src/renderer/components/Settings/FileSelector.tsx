import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import { styles } from 'renderer/components/Settings/styles';

export const FileSelector: React.FC<{
    name: string;
    label: string;
    value: string;
    type: 'folder' | 'file';
    onSelectDestination: (
        folder: string,
        type: 'folder' | 'file',
        name: string,
        onChange: (
            event: React.ChangeEvent<
                HTMLInputElement | { name?: string; value: unknown }
            >,
        ) => void,
        reset?: boolean,
    ) => void;
    onChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
    helperText?: string;
}> = ({
    name,
    label,
    value,
    type,
    onSelectDestination,
    onChange,
    helperText = false,
}) => {
    return (
        <TextField
            fullWidth
            name={name}
            label={label}
            value={value}
            sx={styles.inputFieldLong}
            helperText={helperText}
            slotProps={{
                input: {
                    readOnly: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton
                                onClick={() =>
                                    onSelectDestination(
                                        value,
                                        type,
                                        name,
                                        onChange,
                                    )
                                }
                                edge="start"
                            >
                                <FolderOpenIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() =>
                                    onSelectDestination(
                                        value,
                                        type,
                                        name,
                                        onChange,
                                        true,
                                    )
                                }
                                edge="end"
                            >
                                <CloseIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};
