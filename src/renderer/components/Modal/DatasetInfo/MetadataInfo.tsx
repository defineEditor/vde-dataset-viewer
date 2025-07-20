import React from 'react';
import { List, ListItem, ListItemText, Stack } from '@mui/material';
import { DatasetJsonMetadata } from 'interfaces/common';

const styles = {
    metadataColumn: {
        width: '50%',
    },
    metadataItem: {
        secondary: { sx: { color: 'primary.main' } },
    },
};

const MetadataInfo: React.FC<{
    metadata: DatasetJsonMetadata;
    extraInfo: { path: string };
}> = ({ metadata, extraInfo }) => {
    const metadataAttrs = [
        { key: 'name', label: 'Dataset Name', value: metadata.name },
        { key: 'label', label: 'Dataset Label', value: metadata.label },
        { key: 'records', label: 'Number of Records', value: metadata.records },
        {
            key: 'columnsNum',
            label: 'Number of Columns',
            value: metadata.columns.length,
        },
        {
            key: 'datasetJSONCreationDateTime',
            label: 'Creation Date',
            value: metadata.datasetJSONCreationDateTime,
        },
        { key: 'originator', label: 'Originator', value: metadata.originator },
        {
            key: 'metaDataRef',
            label: 'Metadata Reference',
            value: metadata.metaDataRef,
        },
        {
            key: 'datasetJSONVersion',
            label: 'Dataset-JSON Version',
            value: metadata.datasetJSONVersion,
        },
        {
            key: 'sourceSystem',
            label: 'Source System',
            value: metadata.sourceSystem?.name,
        },
        {
            key: 'sourceSystemVersion',
            label: 'Source System Version',
            value: metadata.sourceSystem?.version,
        },
        {
            key: 'dbLastModifiedDateTime',
            label: 'DB Last Modified Date',
            value: metadata.dbLastModifiedDateTime,
        },
        { key: 'fileOID', label: 'File OID', value: metadata.fileOID },
        { key: 'studyOID', label: 'Study OID', value: metadata.studyOID },
        {
            key: 'metaDataVersionOID',
            label: 'Metadata Version OID',
            value: metadata.metaDataVersionOID,
        },
        {
            key: 'itemGroupOID',
            label: 'Item Group OID',
            value: metadata.itemGroupOID,
        },
    ];

    const half = Math.ceil(metadataAttrs.length / 2);
    const firstHalf = metadataAttrs.slice(0, half);
    const secondHalf = metadataAttrs.slice(half);

    return (
        <Stack spacing={2} direction="row" justifyContent="flex-start">
            <List sx={styles.metadataColumn}>
                {firstHalf.map((attr) => (
                    <ListItem key={attr.key}>
                        <ListItemText
                            slotProps={styles.metadataItem}
                            primary={attr.label}
                            secondary={attr.value}
                        />
                    </ListItem>
                ))}
            </List>
            <List sx={styles.metadataColumn}>
                {secondHalf.map((attr) => (
                    <ListItem key={attr.key}>
                        <ListItemText
                            slotProps={styles.metadataItem}
                            primary={attr.label}
                            secondary={attr.value}
                        />
                    </ListItem>
                ))}
                <ListItem key="path">
                    <ListItemText
                        slotProps={styles.metadataItem}
                        primary="File path"
                        secondary={extraInfo.path}
                    />
                </ListItem>
            </List>
        </Stack>
    );
};

export default MetadataInfo;
