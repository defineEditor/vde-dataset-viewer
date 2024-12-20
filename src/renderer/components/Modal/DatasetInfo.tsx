import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { closeModal, setGoTo } from 'renderer/redux/slices/ui';
import {
    DatasetJsonMetadata,
    IUiModal,
    ItemDescription,
} from 'interfaces/common';
import {
    Tabs,
    Tab,
    Box,
    List,
    ListItem,
    ListItemText,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    TableSortLabel,
} from '@mui/material';
import ShortcutIcon from '@mui/icons-material/Shortcut';

const styles = {
    dialog: {
        minWidth: '80%',
        height: '80%',
    },
    tabs: {
        flexGrow: 1,
    },
    tab: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    tabPanel: {
        height: 'calc(100% - 48px)', // Adjust height to account for tab header
        overflow: 'auto',
    },
    metadataColumn: {
        width: '50%',
    },
    metadataItem: {
        secondary: { sx: { color: 'primary.main' } },
    },
    headerRow: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
};

const MetadataTab: React.FC<{ metadata: DatasetJsonMetadata }> = ({
    metadata,
}) => {
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
            </List>
        </Stack>
    );
};

const ColumnsTab: React.FC<{
    metadata: DatasetJsonMetadata;
    onClose: () => void;
    active: boolean;
}> = ({ metadata, onClose, active }) => {
    const dispatch = useAppDispatch();
    const headers: {
        key: keyof ItemDescription;
        label: string;
    }[] = [
        { key: 'name', label: 'Name' },
        { key: 'label', label: 'Label' },
        { key: 'length', label: 'Length' },
        { key: 'dataType', label: 'Data Type' },
        { key: 'targetDataType', label: 'Target Data Type' },
        { key: 'displayFormat', label: 'Display Format' },
        { key: 'keySequence', label: 'Key Sequence' },
        { key: 'itemOID', label: 'Item OID' },
    ];

    const [sortedColumns, setSortedColumns] = useState(metadata.columns);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof ItemDescription;
        direction: 'asc' | 'desc';
    } | null>(null);

    const handleSort = (key: keyof ItemDescription) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setSortedColumns((prevColumns) => {
            return [...prevColumns].sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        });
    };

    const handleGoToClick = (column: string) => {
        dispatch(setGoTo({ column }));
        onClose();
    };

    useEffect(() => {
        setSortedColumns(metadata.columns);
        setSortConfig(null);
    }, [active, metadata.columns]);

    return (
        <TableContainer component={Paper} sx={{ maxHeight: '100%' }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow sx={styles.headerRow}>
                        {headers.map((header) => (
                            <TableCell
                                key={header.key}
                                sortDirection={
                                    sortConfig?.key === header.key
                                        ? sortConfig.direction
                                        : false
                                }
                            >
                                <TableSortLabel
                                    active={sortConfig?.key === header.key}
                                    direction={sortConfig?.direction || 'asc'}
                                    onClick={() => handleSort(header.key)}
                                >
                                    {header.label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                        <TableCell key="actions">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedColumns.map((column, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TableRow key={index}>
                            {headers.map((header) => (
                                <TableCell key={header.key}>
                                    {column[header.key]}
                                </TableCell>
                            ))}
                            <TableCell key="actions">
                                <IconButton
                                    onClick={() => handleGoToClick(column.name)}
                                    id="goto"
                                    size="medium"
                                >
                                    <ShortcutIcon
                                        sx={{
                                            color: 'primary.main',
                                            fontSize: '20px',
                                        }}
                                    />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const DatasetInfo: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const currentMetadata = useAppSelector(
        (state) => state.data.openedFileMetadata[state.ui.currentFileId],
    );

    const [tabIndex, setTabIndex] = useState(0);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTabIndex(newValue);
    };

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

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle>Dataset Information</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <Tab label="Metadata" sx={styles.tab} />
                    <Tab label="Columns" sx={styles.tab} />
                </Tabs>
                <Box hidden={tabIndex !== 0} sx={styles.tabPanel}>
                    <MetadataTab metadata={currentMetadata} />
                </Box>
                <Box hidden={tabIndex !== 1} sx={styles.tabPanel}>
                    <ColumnsTab
                        metadata={currentMetadata}
                        onClose={handleClose}
                        active={tabIndex !== 1}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatasetInfo;
