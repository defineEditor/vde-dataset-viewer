import React from 'react';
import FileSelector from 'renderer/components/Common/SingleFileSelector';
import { styles } from 'renderer/components/Settings/styles';

const SettingsFileSelector: React.FC<{
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
    helperText = undefined,
}) => {
    const handleSelectDestination = () => {
        onSelectDestination(value, type, name, onChange);
    };

    const handleClean = () => {
        onSelectDestination(value, type, name, onChange, true);
    };

    return (
        <FileSelector
            label={label}
            value={value}
            onSelectDestination={handleSelectDestination}
            onClean={handleClean}
            helperText={helperText}
            sx={styles.inputFieldLong}
        />
    );
};

export default SettingsFileSelector;
