import React, { useState, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import Drawer from '@mui/material/Drawer';
import {
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from '@mui/material';

const styles = {
    drawer: {
        zIndex: 9001,
    },
    paper: {
        minWidth: '150px',
    },
    filter: {
        m: 0,
    },
    item: {
        p: 0,
    },
    type: {
        display: 'inline-block',
        backgroundColor: 'primary.main',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: 'grey.300',
        borderRadius: 8,
        height: 20,
        pl: 1,
        pr: 1,
        mb: 1,
    },
    filterInput: {
        py: 1,
    },
};

const DatasetSidebar: React.FC<{
    open: boolean;
    onClose: () => void;
}> = ({ open, onClose }) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const [filterText, setFilterText] = useState('');

    const openedFiles = apiService
        .getOpenedFiles()
        .filter((file) => file.mode === 'local');

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const currentFileIndex = openedFiles.findIndex(
        (file) => file.fileId === currentFileId,
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredFiles = openedFiles.filter((file) =>
        file.name?.toLowerCase().includes(filterText.toLowerCase()),
    );

    // When sidebar is open, set the current file as selected
    useEffect(() => {
        if (open) {
            setSelectedIndex(currentFileIndex);
            setFilterText('');
        }
    }, [open, currentFileIndex]);

    // Reset selected index when filtered files change
    useEffect(() => {
        setSelectedIndex(filteredFiles.length > 0 ? 0 : -1);
    }, [filteredFiles.length]);

    const handleOpenDataset = (fileId: string) => {
        onClose();
        setFilterText('');
        dispatch(openDataset({ fileId }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredFiles.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredFiles.length - 1 ? prev + 1 : 0,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredFiles.length - 1,
                );
                break;
            case 'Enter':
                if (
                    selectedIndex >= 0 &&
                    selectedIndex < filteredFiles.length
                ) {
                    handleOpenDataset(filteredFiles[selectedIndex].fileId);
                }
                break;
            default:
                break;
        }
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            sx={styles.drawer}
            PaperProps={{ sx: styles.paper }}
            anchor="left"
        >
            <TextField
                autoFocus
                variant="filled"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filter by name"
                sx={styles.filter}
                slotProps={{ input: { sx: styles.filterInput } }}
            />
            <List>
                {filteredFiles.map((file, index) => (
                    <ListItem key={file.fileId} sx={styles.item}>
                        <ListItemButton
                            onClick={() => handleOpenDataset(file.fileId)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            selected={index === selectedIndex}
                        >
                            <ListItemText
                                primary={file.name}
                                secondary={file.type}
                                slotProps={{
                                    secondary: { sx: styles.type },
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default DatasetSidebar;
