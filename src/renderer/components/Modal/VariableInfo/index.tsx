import React, { useEffect, useCallback, useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { closeModal } from 'renderer/redux/slices/ui';
import UniqueValues from 'renderer/components/Modal/VariableInfo/UniqueValues';
import { IUiModalVariableInfo, TableRowValue } from 'interfaces/common';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

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
        height: '50%',
    },
    metadataItem: {
        secondary: { sx: { color: 'primary.main' } },
    },
    sectionTitle: {
        '&&': {
            mt: 2,
            mb: 1,
            fontWeight: 'bold',
        },
    },
    properties: {
        minWidth: '300px',
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
    const [hasAllValues, setHasAllValues] = useState(
        apiService.isFullyLoaded(currentFileId),
    );
    const [values, setValues] = useState<{
        values: TableRowValue[];
        counts: { [value: string]: number };
    }>({ values: [], counts: {} });

    const totalRecords = currentMetadata.records;

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

    // On load use the values which are currently available
    useEffect(() => {
        const getValues = async () => {
            const initialValues = await apiService.getUniqueValues(
                currentFileId,
                [columnId],
                1000,
                true,
            );
            setValues(initialValues[columnId]);
        };

        getValues();
    }, [currentFileId, columnId, apiService]);

    if (!variableInfo) {
        return null;
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

    const handleGetValues = async () => {
        setHasAllValues(true);
        const newValues = await apiService.getUniqueValues(
            currentFileId,
            [columnId],
            1000,
            true,
            true,
        );
        setValues(newValues[columnId]);
    };

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
                <Stack direction="row" spacing={2}>
                    <Stack direction="column" sx={styles.properties}>
                        <Typography variant="h6" sx={styles.sectionTitle}>
                            Variable Properties
                        </Typography>
                        <List>
                            {variableAttributes
                                .filter((attr) => attr.value)
                                .map((attr) => (
                                    <ListItem key={attr.key} dense>
                                        <ListItemText
                                            slotProps={styles.metadataItem}
                                            primary={attr.label}
                                            secondary={attr.value || ' '}
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    </Stack>
                    <UniqueValues
                        counts={values.counts}
                        hasAllValues={hasAllValues}
                        onGetValues={handleGetValues}
                        totalRecords={totalRecords}
                    />
                </Stack>
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
