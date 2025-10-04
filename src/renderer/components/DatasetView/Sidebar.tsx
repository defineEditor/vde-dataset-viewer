import React, { useState, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset, closeDataset } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import {
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    Drawer,
    Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
    actionIcon: {
        fontSize: '24px',
    },
};

const DatasetSidebar: React.FC<{
    open: boolean;
    onClose: () => void;
}> = ({ open, onClose }) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const [filterText, setFilterText] = useState('');

    const [openedFiles, setOpenedFiles] = useState(
        apiService.getOpenedFiles().filter((file) => file.mode === 'local'),
    );
    const loadedRecords = useAppSelector((state) => state.data.loadedRecords);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const currentFileIndex = openedFiles.findIndex(
        (file) => file.fileId === currentFileId,
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        // If the number of opened files changes, update the state
        const newOpenedFiles = apiService
            .getOpenedFiles()
            .filter((file) => file.mode === 'local');

        // Show only files with loaded records
        const openedFilesWithRecords = newOpenedFiles.filter((file) =>
            Object.prototype.hasOwnProperty.call(loadedRecords, file.fileId),
        );

        setOpenedFiles(openedFilesWithRecords);
    }, [apiService, currentFileId, loadedRecords]);

    const filteredFiles = openedFiles
        .filter((file) =>
            file.name?.toLowerCase().includes(filterText.toLowerCase()),
        )
        .map((file) => {
            // Get the last folder name from the file path
            const separator = window.electron.isWindows ? '\\' : '/';
            const folderName = file.path.split(separator).at(-2);

            return {
                ...file,
                folderName,
            };
        });

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
        dispatch(openDataset({ fileId, currentFileId }));
    };

    const handleCloseDataset = (
        event: React.MouseEvent<HTMLElement>,
        fileId: string,
    ) => {
        event.stopPropagation();
        dispatch(
            closeDataset({
                fileId,
            }),
        );
        apiService.close(fileId);
        setOpenedFiles(
            apiService.getOpenedFiles().filter((file) => file.mode === 'local'),
        );
        const newFileIndex = apiService
            .getOpenedFiles()
            .findIndex((file) => file.fileId === currentFileId);
        setSelectedIndex(newFileIndex);
    };

    const handleOpenInNewWindow = (
        event: React.MouseEvent<HTMLElement>,
        fileId: string,
        filePath: string,
    ) => {
        event.stopPropagation();
        // Close the dataset in the current window
        handleCloseDataset(event, fileId);
        // Open the dataset in a new window
        // If Ctrl key is pressed, resize the current window to the top half of the screen and the new window to the bottom half
        if (event.shiftKey) {
            apiService.openInNewWindow(filePath, 'right');
            apiService.resizeWindow('left');
        } else if (event.ctrlKey) {
            apiService.openInNewWindow(filePath, 'bottom');
            apiService.resizeWindow('top');
        } else {
            apiService.openInNewWindow(filePath);
        }
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
                    <ListItem
                        key={file.fileId}
                        sx={styles.item}
                        secondaryAction={
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    onClick={(event) =>
                                        handleOpenInNewWindow(
                                            event,
                                            file.fileId,
                                            file.path,
                                        )
                                    }
                                >
                                    <OpenInNewIcon
                                        fontSize="small"
                                        sx={styles.actionIcon}
                                    />
                                </IconButton>
                                <IconButton
                                    onClick={(event) =>
                                        handleCloseDataset(event, file.fileId)
                                    }
                                >
                                    <CloseIcon
                                        fontSize="small"
                                        sx={styles.actionIcon}
                                    />
                                </IconButton>
                            </Stack>
                        }
                    >
                        <ListItemButton
                            onClick={() => handleOpenDataset(file.fileId)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            selected={index === selectedIndex}
                        >
                            <ListItemText
                                primary={file.name}
                                secondary={file.folderName}
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
