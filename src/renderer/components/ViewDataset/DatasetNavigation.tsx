import React, { useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset, closeDataset } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import { Tabs, Tab, Box, Stack, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const styles = {
    tabs: {
        maxWidth: '100%',
    },
    item: {
        px: 1,
    },
    label: {
        flex: '1',
    },
    iconButton: {
        ml: 0,
        height: 24,
        width: 24,
        transform: 'translateY(-1px)',
    },
    container: {
        width: '100%',
    },
};

const DatasetNavigation: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const [openedFiles, setOpenedFiles] = useState(
        apiService.getOpenedFiles().filter((file) => file.mode === 'local'),
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const handleCloseDataset = (
        event: React.SyntheticEvent,
        fileId: string,
    ) => {
        event.stopPropagation();
        dispatch(
            closeDataset({
                fileId,
            }),
        );
        apiService.close(fileId);
        const newOpenedFiles = apiService
            .getOpenedFiles()
            .filter((file) => file.mode === 'local');
        // Open another dataset if the current one is closed
        if (newOpenedFiles.length > 0 && fileId === currentFileId) {
            dispatch(openDataset({ fileId: newOpenedFiles[0].fileId }));
        }
        setOpenedFiles(newOpenedFiles);
    };

    const handleDatasetChange = (
        _event: React.SyntheticEvent,
        newValue: string,
    ) => {
        dispatch(openDataset({ fileId: newValue, currentFileId }));
    };

    return (
        <Tabs
            value={currentFileId}
            onChange={handleDatasetChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={styles.tabs}
        >
            {openedFiles.map((file) => (
                <Tab
                    key={file.fileId}
                    label={
                        <Stack
                            direction="row"
                            spacing={0}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={styles.container}
                        >
                            <Box sx={styles.label}>{file.name}</Box>
                            <IconButton
                                onClick={(event) =>
                                    handleCloseDataset(event, file.fileId)
                                }
                                sx={styles.iconButton}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    }
                    sx={styles.item}
                    value={file.fileId}
                />
            ))}
        </Tabs>
    );
};

export default DatasetNavigation;
