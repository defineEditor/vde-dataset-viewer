import React, { useContext, useEffect, useCallback } from 'react';
import { Typography, Tooltip, IconButton, Stack, Divider } from '@mui/material';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import TerminalIcon from '@mui/icons-material/Terminal';
import InfoIcon from '@mui/icons-material/Info';
import FilterIcon from '@mui/icons-material/FilterAlt';
import NextPlanOutlinedIcon from '@mui/icons-material/NextPlan';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import SortIcon from '@mui/icons-material/Sort';
import {
    openDataset,
    closeDataset,
    openModal,
    setPage,
    openSnackbar,
    toggleSidebar,
    setCompareFiles,
} from 'renderer/redux/slices/ui';
import { resetFilter, addRecent } from 'renderer/redux/slices/data';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';
import { modals, paths } from 'misc/constants';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 2,
        justifyContent: 'flex-start',
    },
    dataset: {
        color: 'grey.800',
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

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const isFilterEnabled = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentFileId] !== undefined,
    );
    const isMaskEnabled = useAppSelector(
        (state) => state.data.maskData.currentMask !== null,
    );

    const isIdColumnsEnabled = useAppSelector(
        (state) => (state.ui.control[currentFileId]?.idCols?.length ?? 0) > 0,
    );

    const isSortingEnabled = useAppSelector(
        (state) => (state.ui.control[currentFileId]?.sorting?.length ?? 0) > 0,
    );

    const isModalOpen = useAppSelector((state) => state.ui.modals?.length > 0);

    const openFiles = apiService.getOpenedFiles(currentFileId);

    const dataset = openFiles.length === 1 ? openFiles[0] : null;

    const currentFileMode = dataset?.mode;

    const dsName = dataset?.name || '';

    const showIssues = useAppSelector((state) => {
        if (currentFileId && state.ui.dataSettings[currentFileId]) {
            return state.ui.dataSettings[currentFileId].showIssues;
        }
        return false;
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
        dispatch(setPage({ fileId: newDataInfo.fileId, page: 0 }));
    }, [apiService, dispatch]);
    const handleGoToClick = useCallback(() => {
        dispatch(openModal({ type: modals.GOTO, data: {} }));
    }, [dispatch]);

    const handleCommandLineClick = useCallback(() => {
        dispatch(openModal({ type: modals.COMMANDLINE, data: {} }));
    }, [dispatch]);

    const handleFilterClick = useCallback(() => {
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'dataset', data: {} }),
        );
    }, [dispatch]);

    const handleFilterReset = useCallback(() => {
        dispatch(resetFilter({ fileId: currentFileId }));
    }, [dispatch, currentFileId]);

    const handleDataSetInfoClick = useCallback(() => {
        dispatch(openModal({ type: modals.DATASETINFO, data: {} }));
    }, [dispatch]);

    const handleMaskClick = useCallback(() => {
        dispatch(openModal({ type: modals.MASK, data: {} }));
    }, [dispatch]);

    const handleSortingClick = useCallback(() => {
        dispatch(openModal({ type: modals.SORTING, data: {} }));
    }, [dispatch]);

    const handleIdColumnsClick = useCallback(() => {
        dispatch(openModal({ type: modals.IDCOLUMNS, data: {} }));
    }, [dispatch]);

    const handleCompareClick = useCallback(() => {
        const allOpenFiles = apiService.getOpenedFiles();
        // Check if there is a file to the left of the current dataset
        let currentFilePath: string | undefined;
        let previousFilePath: string | undefined;
        allOpenFiles.some((file) => {
            if (file.fileId === currentFileId) {
                currentFilePath = file.path;
                return true;
            }
            previousFilePath = file.path;
            return false;
        });
        dispatch(
            setCompareFiles({
                fileBase: currentFilePath,
                fileComp: previousFilePath,
            }),
        );
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    }, [dispatch, apiService, currentFileId]);

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
        dispatch(setPage({ fileId: newDataInfo.fileId, page: 0 }));
    }, [apiService, dispatch, currentFileId, handleCloseDataset]);

    // Add shortcuts for actions
    useEffect(() => {
        const handleViewerToolbarKeyDown = (event: KeyboardEvent) => {
            // Do use shortcuts if a Modal is open
            if (event.ctrlKey && !isModalOpen) {
                event.preventDefault();
                event.stopPropagation();
                switch (event.key) {
                    case 'g':
                        handleGoToClick();
                        break;
                    case 'l':
                        handleCommandLineClick();
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
                    case 'p':
                        handleIdColumnsClick();
                        break;
                    case 'r':
                        handleReloadClick();
                        break;
                    case 'e':
                        handleMaskClick();
                        break;
                    case 's':
                        handleCompareClick();
                        break;
                    case 't':
                        handleSortingClick();
                        break;
                    case 'v':
                        handleValidateClick();
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
        handleCommandLineClick,
        handleOpenClick,
        handleFilterClick,
        handleDataSetInfoClick,
        handleFilterReset,
        handleToggleSidebar,
        handleMaskClick,
        handleReloadClick,
        handleCompareClick,
        handleIdColumnsClick,
        handleValidateClick,
        handleSortingClick,
        isModalOpen,
    ]);

    return (
        <Stack sx={styles.main} direction="row" spacing={1}>
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
                                    : 'grey.600',
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
                            color: 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Reload" enterDelay={1000}>
                <IconButton
                    onClick={handleReloadClick}
                    id="reload"
                    size="small"
                    disabled={currentFileMode === 'remote'}
                >
                    <RefreshIcon
                        sx={{
                            color:
                                currentFileMode === 'remote'
                                    ? 'grey.500'
                                    : 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Go to Line or Column" enterDelay={1000}>
                <IconButton
                    onClick={handleGoToClick}
                    id="goto"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <ShortcutIcon
                        sx={{
                            color: 'grey.600',
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
                                ? 'primary.main'
                                : 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="ID Columns" enterDelay={1000}>
                <IconButton
                    onClick={handleIdColumnsClick}
                    id="idColumns"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <PushPinOutlinedIcon
                        sx={{
                            color: isIdColumnsEnabled
                                ? 'primary.main'
                                : 'grey.600',
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
                            color: isMaskEnabled ? 'primary.main' : 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Sort" enterDelay={1000}>
                <IconButton
                    onClick={handleSortingClick}
                    id="sort"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <SortIcon
                        sx={{
                            color: isSortingEnabled
                                ? 'primary.main'
                                : 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Compare" enterDelay={1000}>
                <IconButton
                    onClick={handleCompareClick}
                    id="compare"
                    size="small"
                >
                    <CompareArrowsIcon
                        sx={{
                            color: 'grey.600',
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
                                ? showIssues
                                    ? 'primary.main'
                                    : 'grey.600'
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
                            color: 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Command Line" enterDelay={1000}>
                <IconButton
                    onClick={handleCommandLineClick}
                    id="commandLine"
                    size="small"
                    disabled={pathname !== paths.VIEWFILE}
                >
                    <TerminalIcon
                        sx={{
                            color: 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default Header;
