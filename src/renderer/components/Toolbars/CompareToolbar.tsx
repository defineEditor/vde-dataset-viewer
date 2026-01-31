import React, { useEffect, useCallback } from 'react';
import { IconButton, Stack, Tooltip, Box } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openModal,
    closeCompare,
    setCompareView,
    setShowAllDifferences,
    restartCompare,
} from 'renderer/redux/slices/ui';
import { clearLoadedRecords } from 'renderer/redux/slices/data';
import { modals } from 'misc/constants';
import store from 'renderer/redux/store';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 2,
    },
    box: {
        display: 'flex',
        alignItems: 'center',
    },
};

const CompareToolbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = React.useContext(AppContext);
    const resultTab = useAppSelector((state) => state.ui.compare.resultTab);
    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const currentView = useAppSelector((state) => state.ui.compare.view);
    const isFilterEnabled = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentCompareId] !== undefined,
    );
    const isModalOpen = useAppSelector((state) => state.ui.modals?.length > 0);

    const handleCompare = useCallback(() => {
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    }, [dispatch]);

    const handleToggleView = useCallback(() => {
        dispatch(
            setCompareView(
                currentView === 'horizontal' ? 'vertical' : 'horizontal',
            ),
        );
    }, [dispatch, currentView]);

    const handleRefreshCompare = useCallback(() => {
        if (!currentCompareId) {
            return;
        }
        // Close loaded records for the files which are open
        // Using store.getState() to avoid an issue I could not resolve when use useAppSelector
        const state = store.getState();
        const fileBaseId = state.ui.compare.info[currentCompareId]?.fileBaseId;
        const fileCompId = state.ui.compare.info[currentCompareId]?.fileCompId;
        if (fileBaseId && fileCompId) {
            const fileIds = [fileBaseId, fileCompId];
            dispatch(clearLoadedRecords({ fileIds }));
        }
        dispatch(restartCompare({ compareId: currentCompareId }));
    }, [dispatch, currentCompareId]);

    const handleClose = () => {
        if (!currentCompareId) {
            return;
        }
        // Close loaded records for the files which are open
        // Using store.getState() to avoid an issue I could not resolve when use useAppSelector
        const state = store.getState();
        const fileBaseId = state.ui.compare.info[currentCompareId]?.fileBaseId;
        const fileCompId = state.ui.compare.info[currentCompareId]?.fileCompId;
        const isComparing =
            state.ui.compare.info[currentCompareId]?.isComparing;
        if (fileBaseId && fileCompId) {
            const fileIds = [fileBaseId, fileCompId];
            dispatch(clearLoadedRecords({ fileIds }));
        }
        if (isComparing) {
            apiService.stopTask(currentCompareId);
        }
        dispatch(closeCompare({ compareId: currentCompareId }));
    };

    const handleFilterClick = useCallback(() => {
        if (!currentCompareId) {
            return;
        }
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'compare', data: {} }),
        );
    }, [dispatch, currentCompareId]);

    const handleListAllClick = useCallback(() => {
        if (!currentCompareId) {
            return;
        }
        dispatch(setShowAllDifferences(true));
    }, [dispatch, currentCompareId]);

    // Add shortcuts for actions
    useEffect(() => {
        const handleViewerToolbarKeyDown = (event: KeyboardEvent) => {
            // Do use shortcuts if a Modal is open
            if (event.ctrlKey && !isModalOpen) {
                event.preventDefault();
                event.stopPropagation();
                switch (event.key) {
                    case 's':
                        handleCompare();
                        break;
                    case 't':
                        if (resultTab === 'data') {
                            handleToggleView();
                        }
                        break;
                    case 'f':
                        if (resultTab === 'data') {
                            handleFilterClick();
                        }
                        break;
                    case 'i':
                        if (resultTab === 'data') {
                            handleListAllClick();
                        }
                        break;
                    case 'r':
                        handleRefreshCompare();
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
        handleCompare,
        handleToggleView,
        handleFilterClick,
        handleListAllClick,
        handleRefreshCompare,
        isModalOpen,
        resultTab,
    ]);

    return (
        <Stack direction="row" spacing={1} sx={styles.main}>
            <Tooltip title="Select files to compare" enterDelay={1000}>
                <IconButton onClick={handleCompare} size="small">
                    <CompareArrowsIcon sx={{ color: 'grey.600' }} />
                </IconButton>
            </Tooltip>
            <Tooltip title="Toggle horizontal/vertical view" enterDelay={1000}>
                <Box sx={styles.box}>
                    <IconButton
                        onClick={handleToggleView}
                        size="small"
                        disabled={resultTab !== 'data' || !currentCompareId}
                    >
                        <FlipCameraAndroidIcon
                            sx={{
                                color:
                                    resultTab === 'data' && currentCompareId
                                        ? 'grey.600'
                                        : 'grey.400',
                            }}
                        />
                    </IconButton>
                </Box>
            </Tooltip>
            <Tooltip
                title="List All Differences (active in Data tab)"
                enterDelay={1000}
            >
                <Box sx={styles.box}>
                    <IconButton
                        onClick={handleListAllClick}
                        id="listAllDifferences"
                        size="small"
                        disabled={resultTab !== 'data' || !currentCompareId}
                    >
                        <ListAltIcon
                            sx={{
                                color:
                                    resultTab === 'data' && currentCompareId
                                        ? 'grey.600'
                                        : 'grey.400',
                            }}
                        />
                    </IconButton>
                </Box>
            </Tooltip>
            <Tooltip
                title="Filter Compare (active in Data tab)"
                enterDelay={1000}
            >
                <Box sx={styles.box}>
                    <IconButton
                        onClick={handleFilterClick}
                        id="filterData"
                        size="small"
                        disabled={resultTab !== 'data' || !currentCompareId}
                    >
                        <FilterIcon
                            sx={{
                                color:
                                    resultTab === 'data' && currentCompareId
                                        ? isFilterEnabled
                                            ? 'primary.main'
                                            : 'grey.600'
                                        : 'grey.400',
                            }}
                        />
                    </IconButton>
                </Box>
            </Tooltip>
            <Tooltip title="Refresh Compare" enterDelay={1000}>
                <Box sx={styles.box}>
                    <IconButton
                        onClick={handleRefreshCompare}
                        size="small"
                        disabled={!currentCompareId}
                    >
                        <RefreshIcon
                            sx={{
                                color: currentCompareId
                                    ? 'grey.600'
                                    : 'grey.400',
                            }}
                        />
                    </IconButton>
                </Box>
            </Tooltip>
            <Tooltip title="Close comparison" enterDelay={1000}>
                <Box sx={styles.box}>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        disabled={!currentCompareId}
                    >
                        <CloseIcon
                            sx={{
                                color: currentCompareId
                                    ? 'grey.600'
                                    : 'grey.400',
                            }}
                        />
                    </IconButton>
                </Box>
            </Tooltip>
        </Stack>
    );
};

export default CompareToolbar;
