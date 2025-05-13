import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
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
    TextField,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import {
    closeModal,
    setDatasetInfoTab,
    setGoTo,
    openModal,
} from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';

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
        p: 0,
    },
    actionIcon: {
        color: 'primary.main',
        fontSize: '24px',
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
    searchTerm: string;
}> = ({ metadata, onClose, active, searchTerm }) => {
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

    const handleShowInfo = (id: string) => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: id },
            }),
        );
    };

    useEffect(() => {
        setSortedColumns(metadata.columns);
        setSortConfig(null);
    }, [active, metadata.columns]);

    const filteredColumns = sortedColumns.filter((column) => {
        if (!searchTerm) return true;

        const searchTermLower = searchTerm.toLowerCase();
        // Search across all column properties
        return headers.some((header) => {
            const value = column[header.key];
            return (
                value !== null &&
                value !== undefined &&
                String(value).toLowerCase().includes(searchTermLower)
            );
        });
    });

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
                    {filteredColumns.map((column, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TableRow key={index}>
                            {headers.map((header) => (
                                <TableCell key={header.key}>
                                    {column[header.key]}
                                </TableCell>
                            ))}
                            <TableCell key="actions">
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Go to column">
                                        <IconButton
                                            onClick={() =>
                                                handleGoToClick(column.name)
                                            }
                                            id="goto"
                                            size="small"
                                        >
                                            <ShortcutIcon
                                                sx={styles.actionIcon}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Show column info">
                                        <IconButton
                                            onClick={() =>
                                                handleShowInfo(column.name)
                                            }
                                            id="goto"
                                            size="small"
                                        >
                                            <InfoIcon sx={styles.actionIcon} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
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
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const datasetInfoTab = useAppSelector(
        (state) => state.ui.viewer.datasetInfoTab,
    );
    const { apiService } = useContext(AppContext);
    const currentMetadata = apiService.getOpenedFileMetadata(currentFileId);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: 0 | 1) => {
        dispatch(setDatasetInfoTab(newValue));
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
            // Focus search input when Ctrl+F is pressed and Columns tab is active
            if (event.ctrlKey && event.key === 'f' && datasetInfoTab === 1) {
                event.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose, datasetInfoTab]);

    return (
        <Dialog
            open
            onClose={handleClose}
            PaperProps={{ sx: { ...styles.dialog } }}
        >
            <DialogTitle sx={styles.title}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>Dataset Information</div>
                    {datasetInfoTab === 1 && (
                        <TextField
                            placeholder="Search columns"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            variant="outlined"
                            inputRef={searchInputRef}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon
                                                sx={{ color: 'white' }}
                                            />
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor:
                                                'rgba(255, 255, 255, 0.5)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline':
                                            {
                                                borderColor: 'white',
                                            },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                            {
                                                borderColor: 'white',
                                            },
                                        '&::placeholder': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                        },
                                    },
                                },
                            }}
                        />
                    )}
                </Box>
            </DialogTitle>
            <DialogContent sx={styles.content}>
                <Tabs
                    value={datasetInfoTab}
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <Tab label="Metadata" sx={styles.tab} />
                    <Tab label="Columns" sx={styles.tab} />
                </Tabs>
                <Box hidden={datasetInfoTab !== 0} sx={styles.tabPanel}>
                    <MetadataTab metadata={currentMetadata} />
                </Box>
                <Box hidden={datasetInfoTab !== 1} sx={styles.tabPanel}>
                    <ColumnsTab
                        metadata={currentMetadata}
                        onClose={handleClose}
                        active={datasetInfoTab === 1}
                        searchTerm={searchTerm}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DatasetInfo;
