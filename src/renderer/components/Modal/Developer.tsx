import React, { useCallback, useEffect, useContext, useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DatasetView from 'renderer/components/DatasetView';
import AppContext from 'renderer/utils/AppContext';
import {
    DatasetJsonMetadata,
    ITableData,
    IUiModal,
    ITableRow,
} from 'interfaces/common';
import { Stack, Typography } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { closeModal, openSnackbar } from 'renderer/redux/slices/ui';
import ApiService from 'renderer/services/ApiService';
import useWidth from 'renderer/components/hooks/useWidth';
import useScrollbarWidth from 'renderer/components/hooks/useScrollbarWidth';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '95%', md: '90%', lg: '80%', xl: '80%' },
        height: '80%',
    },
    tabs: {
        flexGrow: 1,
    },
    tab: (theme: Theme) => ({
        background: theme.vars?.palette.gradients.tabStrip,
    }),
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
    titleStack: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        py: 0.5,
    },
    actions: {
        backgroundColor: 'grey.200',
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

const getDeveloperInfo = async (
    apiService: ApiService,
    dispatch: ReturnType<typeof useAppDispatch>,
    containerWidth: number,
    scrollbarWidth: number,
): Promise<ITableData> => {
    const data: ITableRow[] = [];
    try {
        // Get main process heap info
        const developerInfo = await apiService.getDeveloperInfo();
        Object.keys(developerInfo).forEach((key) => {
            data.push({ name: key, value: developerInfo[key] });
        });
    } catch (error) {
        if (error instanceof Error) {
            dispatch(
                openSnackbar({
                    message: `Error fetching heap info: ${error.message}`,
                    type: 'error',
                }),
            );
        }
    }
    const metadata: DatasetJsonMetadata = {
        datasetJSONCreationDateTime: new Date().toISOString(),
        datasetJSONVersion: '1.1',
        records: data.length,
        name: `developer_info`,
        label: 'Developer Information',
        columns: [
            {
                itemOID: 'name',
                name: 'name',
                label: 'Name',
                dataType: 'string',
            },
            {
                itemOID: 'Value',
                name: 'value',
                label: 'Value',
                dataType: 'string',
            },
        ],
    };

    const header: ITableData['header'] = [
        {
            id: 'name',
            label: 'Name',
            size: 300,
        },
        {
            id: 'value',
            label: 'Value',
            size: Math.max(100, containerWidth - 300 - scrollbarWidth),
        },
    ];

    return { metadata, header, data, appliedFilter: null, fileId: '' };
};

const Developer: React.FC<IUiModal> = (props: IUiModal) => {
    const { type } = props;
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const [developerData, setDeveloperData] = React.useState<ITableData | null>(
        null,
    );

    // Form header with dynamic scrollbar width measurement
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = useWidth(containerRef);

    // Use the hook instead of inline measurement
    const scrollbarWidth = useScrollbarWidth();

    useEffect(() => {
        const fetchData = async () => {
            const data = await getDeveloperInfo(
                apiService,
                dispatch,
                containerWidth,
                scrollbarWidth,
            );
            setDeveloperData(data);
        };
        fetchData();
    }, [apiService, dispatch, containerWidth, scrollbarWidth]);

    const handleClose = useCallback(() => {
        dispatch(closeModal({ type }));
    }, [dispatch, type]);

    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        hideRowNumbers: true,
        showLabels: true,
    };

    return (
        <Dialog
            open
            onClose={handleClose}
            slotProps={{ paper: { sx: { ...styles.dialog } } }}
        >
            <DialogTitle sx={styles.title}>
                <Stack direction="row" sx={styles.titleStack}>
                    <Typography variant="h6" sx={styles.label}>
                        Developer Information
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={styles.content} ref={containerRef}>
                {developerData && (
                    <DatasetView
                        key="developer"
                        tableData={developerData}
                        settings={updatedSettings}
                        currentPage={1}
                        currentMask={null}
                    />
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

export default Developer;
