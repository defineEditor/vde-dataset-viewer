import React, {
    useState,
    useEffect,
    useCallback,
    useContext,
    useRef,
} from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import AppContext from 'renderer/utils/AppContext';
import { IUiModal } from 'interfaces/common';
import MetadataInfo from 'renderer/components/Modal/DatasetInfo/MetadataInfo';
import ColumnsInfo from 'renderer/components/Modal/DatasetInfo/ColumnsInfo';
import {
    Tabs,
    Tab,
    Box,
    Stack,
    TextField,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { closeModal, setDatasetInfoTab } from 'renderer/redux/slices/ui';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '80%', xl: '80%' },
        height: '80%',
    },
    tabs: {
        flexGrow: 1,
    },
    tab: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    metadataPanel: {
        height: '100%',
        overflow: 'auto',
    },
    columnsPanel: {
        height: '100%',
        overflow: 'none',
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
    searchInput: {
        color: 'white',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    searchIcon: { color: 'white' },
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
    const currentFile = apiService.getOpenedFiles(currentFileId);
    const extraInfo = {
        path: currentFile[0]?.path || '',
    };
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

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
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    Dataset Information
                    {datasetInfoTab === 1 && (
                        <TextField
                            placeholder="Ctrl + F to search"
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
                                                sx={styles.searchIcon}
                                            />
                                        </InputAdornment>
                                    ),
                                    sx: styles.searchInput,
                                },
                            }}
                        />
                    )}
                </Stack>
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
                <Box hidden={datasetInfoTab !== 0} sx={styles.metadataPanel}>
                    <MetadataInfo
                        metadata={currentMetadata}
                        extraInfo={extraInfo}
                    />
                </Box>
                <Box hidden={datasetInfoTab !== 1} sx={styles.columnsPanel}>
                    {datasetInfoTab === 1 && (
                        <ColumnsInfo
                            metadata={currentMetadata}
                            onClose={handleClose}
                            searchTerm={searchTerm}
                        />
                    )}
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
