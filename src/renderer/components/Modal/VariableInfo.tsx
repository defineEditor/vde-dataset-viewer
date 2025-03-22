import React, { useEffect, useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { closeModal } from 'renderer/redux/slices/ui';
import { IUiModalVariableInfo } from 'interfaces/common';
import { List, ListItem, ListItemText, Paper, Typography } from '@mui/material';

const styles = {
    dialog: {
        minWidth: '60%',
        maxWidth: '80%',
    },
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 1,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        p: 2,
    },
    metadataItem: {
        secondary: { sx: { color: 'primary.main' } },
    },
    sectionTitle: {
        mt: 2,
        mb: 1,
        fontWeight: 'bold',
    },
    paper: {
        p: 2,
        mb: 2,
    },
};

const VariableInfo: React.FC<IUiModalVariableInfo> = ({
    type,
    data: { columnId },
}: IUiModalVariableInfo) => {
    const dispatch = useAppDispatch();
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const { apiService } = useContext(AppContext);
    const currentMetadata = apiService.getOpenedFileMetadata(currentFileId);

    // Find the specific variable information
    const variableInfo = currentMetadata.columns.find(
        (col) => col.name === columnId,
    );

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose]);

    if (!variableInfo) {
        return (
            <Dialog
                open
                onClose={handleClose}
                PaperProps={{ sx: { ...styles.dialog } }}
            >
                <DialogTitle sx={styles.title}>
                    Variable Information
                </DialogTitle>
                <DialogContent sx={styles.content}>
                    <Typography color="error">
                        Variable {columnId} not found in dataset.
                    </Typography>
                </DialogContent>
                <DialogActions sx={styles.actions}>
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // Define variable attributes to display
    const variableAttributes = [
        { key: 'name', label: 'Name', value: variableInfo.name },
        { key: 'label', label: 'Label', value: variableInfo.label },
        { key: 'length', label: 'Length', value: variableInfo.length },
        { key: 'dataType', label: 'Data Type', value: variableInfo.dataType },
        {
            key: 'targetDataType',
            label: 'Target Data Type',
            value: variableInfo.targetDataType,
        },
        {
            key: 'displayFormat',
            label: 'Display Format',
            value: variableInfo.displayFormat,
        },
        {
            key: 'keySequence',
            label: 'Key Sequence',
            value: variableInfo.keySequence,
        },
        { key: 'itemOID', label: 'Item OID', value: variableInfo.itemOID },
    ];

    // Extract codelist information if available
    const hasCodelist = false;
    const codelist = [];

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>
                Variable Information: {variableInfo.name}
            </DialogTitle>
            <DialogContent sx={styles.content}>
                <Typography variant="h6" sx={styles.sectionTitle}>
                    Variable Properties
                </Typography>
                <List>
                    {variableAttributes.map((attr) => (
                        <ListItem key={attr.key} dense>
                            <ListItemText
                                slotProps={styles.metadataItem}
                                primary={attr.label}
                                secondary={attr.value || ' '}
                            />
                        </ListItem>
                    ))}
                </List>

                {hasCodelist && (
                    <Paper sx={styles.paper} elevation={1}>
                        <Typography variant="h6" sx={styles.sectionTitle}>
                            Unique Values
                        </Typography>
                        <List>
                            {codelist?.map((item) => (
                                <ListItem key={item} dense>
                                    <ListItemText primary={item} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VariableInfo;
