import React, { useContext, useEffect, useCallback } from 'react';
import { Typography, Tooltip, IconButton, Stack } from '@mui/material';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import InfoIcon from '@mui/icons-material/Info';
import FilterIcon from '@mui/icons-material/FilterAlt';
import {
    openDataset,
    openModal,
    setPage,
    openSnackbar,
} from 'renderer/redux/slices/ui';
import { resetFilter } from 'renderer/redux/slices/data';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';
import { modals, paths } from 'misc/constants';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
    dataset: {
        color: 'primary.main',
        fontWeight: 'bold',
        alignContent: 'center',
    },
};

const Header: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const pathname = useAppSelector((state) => state.ui.pathname);
    const isFilterEnabled = useAppSelector(
        (state) => state.data.filterData.currentFilter !== null,
    );

    const dsName = useAppSelector((state) => {
        const { currentFileId } = state.ui;
        if (state.data.openedFileIds[currentFileId]) {
            return state.data.openedFileIds[currentFileId].name;
        }
        return '';
    });

    const handleOpenClick = useCallback(async () => {
        const newDataInfo = await openNewDataset(apiService, 'local');
        if (newDataInfo.errorMessage) {
            if (newDataInfo.errorMessage !== 'cancelled') {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: newDataInfo.errorMessage,
                    }),
                );
            }
            return;
        }
        dispatch(
            openDataset({
                fileId: newDataInfo.fileId,
                type: newDataInfo.type,
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
            }),
        );
        // Reset page for the new dataset
        dispatch(setPage(0));
        // Reset filter for the new dataset
        dispatch(resetFilter());
    }, [apiService, dispatch]);

    const handleGoToClick = useCallback(() => {
        dispatch(openModal({ type: modals.GOTO, data: {} }));
    }, [dispatch]);

    const handleFilterClick = useCallback(() => {
        dispatch(openModal({ type: modals.FILTER, data: {} }));
    }, [dispatch]);

    const handleFilterReset = useCallback(() => {
        dispatch(resetFilter());
    }, [dispatch]);

    const handleDataSetInfoClick = useCallback(() => {
        dispatch(openModal({ type: modals.DATASETINFO, data: {} }));
    }, [dispatch]);

    // Add shortcuts for actions
    useEffect(() => {
        const handleViewerToolbarKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                switch (event.key) {
                    case 'g':
                        handleGoToClick();
                        break;
                    case 'o':
                        handleOpenClick();
                        break;
                    case 'f':
                        handleFilterClick();
                        break;
                    case 'i':
                        handleDataSetInfoClick();
                        break;
                    case 'r':
                        handleFilterReset();
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleViewerToolbarKeyDown);

        return () => {
            window.removeEventListener('keydown', handleViewerToolbarKeyDown);
        };
    }, [
        handleGoToClick,
        handleOpenClick,
        handleFilterClick,
        handleDataSetInfoClick,
        handleFilterReset,
    ]);

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            <Typography variant="h6" sx={styles.dataset}>
                {dsName}
            </Typography>
            <Tooltip title="Open New Dataset" enterDelay={1000}>
                <IconButton onClick={handleOpenClick} id="open" size="small">
                    <FileOpenOutlinedIcon
                        sx={{
                            color: 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Go to Line or Column" enterDelay={1000}>
                <IconButton
                    onClick={handleGoToClick}
                    id="goto"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <ShortcutIcon
                        sx={{
                            color: 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Filter Records" enterDelay={1000}>
                <IconButton
                    onClick={handleFilterClick}
                    id="filterData"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <FilterIcon
                        sx={{
                            color: isFilterEnabled
                                ? 'success.main'
                                : 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Dataset Information" enterDelay={1000}>
                <IconButton
                    onClick={handleDataSetInfoClick}
                    id="datasetInfo"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <InfoIcon
                        sx={{
                            color: 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default Header;
