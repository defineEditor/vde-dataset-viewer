import React, { useContext, useEffect, useCallback } from 'react';
import { Typography, Tooltip, IconButton, Stack } from '@mui/material';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import InfoIcon from '@mui/icons-material/Info';
import FilterIcon from '@mui/icons-material/FilterAlt';
import NextPlanOutlinedIcon from '@mui/icons-material/NextPlan';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CachedIcon from '@mui/icons-material/Cached';
import {
    openDataset,
    closeDataset,
    openModal,
    setPage,
    openSnackbar,
    toggleSidebar,
} from 'renderer/redux/slices/ui';
import { resetFilter, addRecent } from 'renderer/redux/slices/data';
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
    const validatorVersion = useAppSelector(
        (state) => state.data.validator.info.version,
    );
    const isFilterEnabled = useAppSelector(
        (state) => state.data.filterData.currentFilter !== null,
    );
    const isMaskEnabled = useAppSelector(
        (state) => state.data.maskData.currentMask !== null,
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const isModalOpen = useAppSelector((state) => state.ui.modals?.length > 0);

    const openFiles = apiService.getOpenedFiles(currentFileId);

    const dataset = openFiles.length === 1 ? openFiles[0] : null;

    const currentFileMode = dataset?.mode;

    const dsName = dataset?.name || '';

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
            addRecent({
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                path: newDataInfo.path,
            }),
        );
        dispatch(
            openDataset({
                fileId: newDataInfo.fileId,
                type: newDataInfo.type,
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                mode: 'local',
                totalRecords: newDataInfo.metadata.records,
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
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'dataset', data: {} }),
        );
    }, [dispatch]);

    const handleFilterReset = useCallback(() => {
        dispatch(resetFilter());
    }, [dispatch]);

    const handleDataSetInfoClick = useCallback(() => {
        dispatch(openModal({ type: modals.DATASETINFO, data: {} }));
    }, [dispatch]);

    const handleMaskClick = useCallback(() => {
        dispatch(openModal({ type: modals.MASK, data: {} }));
    }, [dispatch]);

    const handleToggleSidebar = useCallback(() => {
        dispatch(toggleSidebar());
    }, [dispatch]);

    const handleSwitchClick = useCallback(() => {
        dispatch(toggleSidebar());
    }, [dispatch]);

    const handleValidateClick = useCallback(() => {
        dispatch(openModal({ type: modals.VALIDATOR, data: {} }));
    }, [dispatch]);

    const handleCloseDataset = useCallback(
        async (fileId: string) => {
            dispatch(
                closeDataset({
                    fileId,
                }),
            );
            await apiService.close(fileId);
        },
        [dispatch, apiService],
    );

    const handleReloadClick = useCallback(async () => {
        // Get filepath of the current file;
        const currentFile = apiService.getOpenedFiles(currentFileId)[0];
        if (!currentFile) {
            dispatch(
                openSnackbar({
                    type: 'error',
                    message: 'No dataset is currently opened.',
                }),
            );
            return;
        }
        const { path, mode } = currentFile;
        // Close the current dataset
        await handleCloseDataset(currentFileId);
        const newDataInfo = await openNewDataset(apiService, mode, path);
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
                mode,
                totalRecords: newDataInfo.metadata.records,
            }),
        );
        // Reset page for the new dataset
        dispatch(setPage(0));
        // Reset filter for the new dataset
        dispatch(resetFilter());
    }, [apiService, dispatch, currentFileId, handleCloseDataset]);

    // Add shortcuts for actions
    useEffect(() => {
        const handleViewerToolbarKeyDown = (event: KeyboardEvent) => {
            // Do use keywords if a Modal is open
            if (event.ctrlKey && !isModalOpen) {
                event.preventDefault();
                event.stopPropagation();
                switch (event.key) {
                    case 'g':
                        handleGoToClick();
                        break;
                    case 'o':
                        handleOpenClick();
                        break;
                    case 'f':
                        if (event.altKey) {
                            handleFilterReset();
                        } else {
                            handleFilterClick();
                        }
                        break;
                    case 'i':
                        handleDataSetInfoClick();
                        break;
                    case 'r':
                        handleReloadClick();
                        break;
                    case 'e':
                        handleMaskClick();
                        break;
                    case '`':
                        handleToggleSidebar();
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
        handleToggleSidebar,
        handleMaskClick,
        handleReloadClick,
        isModalOpen,
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
                <IconButton
                    onClick={handleOpenClick}
                    id="open"
                    size="small"
                    disabled={currentFileMode === 'remote'}
                >
                    <FileOpenOutlinedIcon
                        sx={{
                            color:
                                currentFileMode === 'remote'
                                    ? 'grey.500'
                                    : 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Switch Dataset" enterDelay={1000}>
                <IconButton
                    onClick={handleSwitchClick}
                    id="filterData"
                    size="small"
                >
                    <NextPlanOutlinedIcon
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
            <Tooltip title="Column Visibility" enterDelay={1000}>
                <IconButton
                    onClick={handleMaskClick}
                    id="maskColumns"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <VisibilityIcon
                        sx={{
                            color: isMaskEnabled
                                ? 'success.main'
                                : 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Data Validation" enterDelay={1000}>
                <IconButton
                    onClick={handleValidateClick}
                    id="validateData"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE || !validatorVersion}
                >
                    <FactCheckIcon
                        sx={{
                            color: validatorVersion
                                ? 'primary.main'
                                : 'grey.500',
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
            <Tooltip title="Reload" enterDelay={1000}>
                <IconButton
                    onClick={handleReloadClick}
                    id="open"
                    size="small"
                    disabled={currentFileMode === 'remote'}
                >
                    <CachedIcon
                        sx={{
                            color:
                                currentFileMode === 'remote'
                                    ? 'grey.500'
                                    : 'primary.main',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default Header;
