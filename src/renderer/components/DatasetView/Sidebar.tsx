import React, { useState, useContext } from 'react';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openDataset } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import Drawer from '@mui/material/Drawer';
import {
    TextField,
    List,
    ListItem,
    Button,
    ListItemButton,
    ListItemText,
} from '@mui/material';

const styles = {
    drawer: {
        zIndex: 9001,
    },
    paper: {
        minWidth: '400px',
    },
    filter: {
        mx: 3,
        my: 2,
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

    const filteredFiles = openedFiles.filter((file) =>
        file.name?.toLowerCase().includes(filterText.toLowerCase()),
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && filteredFiles.length === 1) {
            onClose();
            setFilterText('');
            dispatch(openDataset({ fileId: filteredFiles[0].fileId }));
        }
    };

    const handleOpenDataset = (fileId: string) => {
        onClose();
        setFilterText('');
        dispatch(openDataset({ fileId }));
    };

    const handleOpenNewDataset = async () => {
        onClose();
        setFilterText('');
        // ...reuse or define open logic...
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
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filter by name"
                sx={styles.filter}
            />
            <List>
                {filteredFiles.map((file) => (
                    <ListItem key={file.fileId}>
                        <ListItemButton
                            onClick={() => handleOpenDataset(file.fileId)}
                        >
                            <ListItemText
                                primary={file.name}
                                secondary={file.type}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Button onClick={handleOpenNewDataset}>Open New Dataset</Button>
        </Drawer>
    );
};

export default DatasetSidebar;
