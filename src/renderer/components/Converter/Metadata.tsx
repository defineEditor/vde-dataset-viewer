import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Box,
    Alert,
} from '@mui/material';
import { DatasetMetadata, SourceSystem } from 'interfaces/common';

interface MetadataDialogProps {
    open: boolean;
    onClose: () => void;
    metadata: Partial<DatasetMetadata>;
    onMetadataChange: (metadata: Partial<DatasetMetadata>) => void;
}

const styles = {
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    content: {
        p: 2,
        m: 2,
    },
    fields: {
        m: 2,
    },
    field: {
        width: '100%',
    },
    row: {
        display: 'flex',
        gap: 2,
    },
    alert: {
        margin: 2,
    },
};

const Metadata: React.FC<MetadataDialogProps> = ({
    open,
    onClose,
    metadata,
    onMetadataChange,
}) => {
    const [localMetadata, setLocalMetadata] =
        useState<Partial<DatasetMetadata>>(metadata);

    React.useEffect(() => {
        setLocalMetadata(metadata);
    }, [metadata]);

    const handleChange =
        (field: keyof DatasetMetadata) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setLocalMetadata({
                ...localMetadata,
                [field]: event.target.value,
            });
        };

    const handleSourceSystemChange =
        (field: keyof SourceSystem) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setLocalMetadata({
                ...localMetadata,
                sourceSystem: {
                    name: localMetadata.sourceSystem?.name || '',
                    version: localMetadata.sourceSystem?.version || '',
                    [field]: event.target.value || '',
                },
            });
        };

    const handleSave = () => {
        onMetadataChange(localMetadata);
        onClose();
    };

    const handleClose = () => {
        setLocalMetadata(metadata); // Reset to original values
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={styles.title}>Dataset Metadata</DialogTitle>
            <DialogContent sx={styles.content}>
                <Stack spacing={2} sx={styles.fields}>
                    <Alert severity="info" sx={styles.alert}>
                        Fields which are not populated will not be updated
                        during the conversion
                    </Alert>
                    <Box sx={styles.row}>
                        <TextField
                            label="File OID Prefix"
                            value={localMetadata.fileOID || ''}
                            onChange={handleChange('fileOID')}
                            sx={styles.field}
                            helperText="Prefix used for unique file identifier"
                        />
                        <TextField
                            label="Item Group OID Prefix"
                            value={localMetadata.itemGroupOID || ''}
                            onChange={handleChange('itemGroupOID')}
                            sx={styles.field}
                            helperText="Prefix for ItemGroupDef OID, defaults to 'IG.'"
                        />
                    </Box>
                    <Box sx={styles.row}>
                        <TextField
                            label="Study OID"
                            value={localMetadata.studyOID || ''}
                            onChange={handleChange('studyOID')}
                            sx={styles.field}
                            helperText="Unique identifier for Study (ODM or Define/Study/@OID)"
                        />
                        <TextField
                            label="Originator"
                            value={localMetadata.originator || ''}
                            onChange={handleChange('originator')}
                            sx={styles.field}
                            helperText="The organization that generated the Dataset-JSON file"
                        />
                    </Box>
                    <Box sx={styles.row}>
                        <TextField
                            label="Metadata Version OID"
                            value={localMetadata.metaDataVersionOID || ''}
                            onChange={handleChange('metaDataVersionOID')}
                            sx={styles.field}
                            helperText="Metadata OID for the data contained in the file"
                        />
                        <TextField
                            label="Metadata Reference"
                            value={localMetadata.metaDataRef || ''}
                            onChange={handleChange('metaDataRef')}
                            sx={styles.field}
                            helperText="URL for a metadata file describing the data"
                        />
                    </Box>
                    <Box sx={styles.row}>
                        <TextField
                            label="Source System Name"
                            value={localMetadata.sourceSystem?.name || ''}
                            onChange={handleSourceSystemChange('name')}
                            sx={styles.field}
                            helperText="Name of the source system or database management system"
                        />
                        <TextField
                            label="Source System Version"
                            value={localMetadata.sourceSystem?.version || ''}
                            onChange={handleSourceSystemChange('version')}
                            sx={styles.field}
                            helperText="Version of the source system"
                        />
                    </Box>
                    <TextField
                        label="Database Last Modified Date"
                        type="datetime-local"
                        value={
                            localMetadata.dbLastModifiedDateTime
                                ? localMetadata.dbLastModifiedDateTime.split(
                                      '.',
                                  )[0]
                                : ''
                        }
                        onChange={(e) => {
                            const date = e.target.value;
                            setLocalMetadata({
                                ...localMetadata,
                                dbLastModifiedDateTime: date
                                    ? `${date}.000Z`
                                    : '',
                            });
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        helperText="The date/time source database was last modified"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Metadata;
