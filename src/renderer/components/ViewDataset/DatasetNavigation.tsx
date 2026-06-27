import React, { useState, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset, closeDataset } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import {
    Tabs,
    Tab,
    Box,
    Stack,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

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
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    dialog: {
        minWidth: '30%',
        maxHeight: '80%',
    },
    title: {
        marginBottom: 2,
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 2,
    },
};

const DatasetNavigation: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const [openedFiles, setOpenedFiles] = useState(
        apiService
            .getOpenedFiles()
            .filter((file) => file.mode === 'local' && !file.compareId),
    );
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const loadedRecords = useAppSelector((state) => state.data.loadedRecords);

    const currentFileOpened = openedFiles.some(
        (file) => file.fileId === currentFileId,
    );

    useEffect(() => {
        // If the number of opened files changes, update the state
        const newOpenedFiles = apiService
            .getOpenedFiles()
            .filter((file) => file.mode === 'local' && !file.compareId);

        // Show only files with loaded records
        const openedFilesWithRecords = newOpenedFiles.filter((file) =>
            Object.prototype.hasOwnProperty.call(loadedRecords, file.fileId),
        );

        setOpenedFiles(openedFilesWithRecords);
    }, [apiService, currentFileId, loadedRecords]);

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
        event: React.MouseEvent<HTMLElement>,
        fileId: string,
        filePath: string,
    ) => {
        event.stopPropagation();
        // Open the dataset in a new window if Shift or Ctrl key is pressed
        if (event.shiftKey && event.ctrlKey) {
            handleCloseDataset(event, fileId);
            apiService.openInNewWindow(filePath);
        } else if (event.shiftKey) {
            handleCloseDataset(event, fileId);
            apiService.openInNewWindow(filePath, 'right');
            apiService.resizeWindow('left');
        } else if (event.ctrlKey) {
            handleCloseDataset(event, fileId);
            apiService.openInNewWindow(filePath, 'bottom');
            apiService.resizeWindow('top');
        } else {
            dispatch(openDataset({ fileId, currentFileId }));
        }
    };

    const handleCloseAllDatasets = () => {
        setShowConfirmDialog(true);
    };

    const handleConfirmCloseAll = () => {
        setShowConfirmDialog(false);
        openedFiles.forEach((file) => {
            dispatch(
                closeDataset({
                    fileId: file.fileId,
                }),
            );
            apiService.close(file.fileId);
        });
        setOpenedFiles([]);
    };

    const handleCancelCloseAll = () => {
        setShowConfirmDialog(false);
    };

    return (
        <Stack direction="row" spacing={1} sx={styles.container}>
            <Tabs
                value={
                    currentFileOpened
                        ? currentFileId
                        : openedFiles[0]?.fileId || false
                }
                variant="scrollable"
                scrollButtons="auto"
                sx={styles.tabs}
            >
                {openedFiles.map((file) => (
                    <Tab
                        key={file.fileId}
                        onClick={(e) =>
                            handleDatasetChange(e, file.fileId, file.path)
                        }
                        label={
                            <Stack
                                direction="row"
                                spacing={0}
                                sx={styles.container}
                            >
                                <Box sx={styles.label}>{file.name}</Box>
                                <IconButton
                                    component="span"
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
            {openedFiles.length > 1 && (
                <Tooltip title="Close All Datasets">
                    <IconButton
                        size="large"
                        onClick={handleCloseAllDatasets}
                        sx={styles.iconButton}
                    >
                        <HighlightOffIcon />
                    </IconButton>
                </Tooltip>
            )}
            <Dialog
                open={showConfirmDialog}
                onClose={handleCancelCloseAll}
                slotProps={{ paper: { sx: styles.dialog } }}
            >
                <DialogTitle sx={styles.title}>Confirm Close All</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to close {openedFiles.length}{' '}
                        datasets?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={styles.actions}>
                    <Button onClick={handleCancelCloseAll} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmCloseAll} color="primary">
                        Close All
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default DatasetNavigation;
