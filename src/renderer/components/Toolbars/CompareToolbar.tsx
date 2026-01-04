import React from 'react';
import { IconButton, Stack, Tooltip, Box } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import FilterIcon from '@mui/icons-material/FilterAlt';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openModal,
    closeCompare,
    setCompareView,
    initialCompare,
    setShowAllDifferences,
} from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';

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
    const resultTab = useAppSelector((state) => state.ui.compare.resultTab);
    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );
    const currentView = useAppSelector((state) => state.ui.compare.view);
    const isFilterEnabled = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentCompareId] !== undefined,
    );

    const handleCompare = () => {
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    };

    const handleToggleView = () => {
        dispatch(
            setCompareView(
                currentView === 'horizontal' ? 'vertical' : 'horizontal',
            ),
        );
    };

    const fileBase = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileBase,
    );
    const fileComp = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileComp,
    );
    const handleRefreshCompare = () => {
        if (!fileBase || !fileComp) {
            return;
        }
        dispatch(initialCompare({ fileBase, fileComp }));
    };

    const handleClose = () => {
        dispatch(closeCompare({ compareId: currentCompareId }));
    };

    const handleFilterClick = () => {
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'compare', data: {} }),
        );
    };

    const handleListAllClick = () => {
        dispatch(setShowAllDifferences(true));
    };

    return (
        <Stack direction="row" spacing={1} sx={styles.main}>
            <Tooltip title="Select files to compare" enterDelay={1000}>
                <IconButton onClick={handleCompare} size="small">
                    <CompareArrowsIcon sx={{ color: 'grey.600' }} />
                </IconButton>
            </Tooltip>
            <Tooltip title="Toggle horizontal/vertical view" enterDelay={1000}>
                <IconButton onClick={handleToggleView} size="small">
                    <FlipCameraAndroidIcon sx={{ color: 'grey.600' }} />
                </IconButton>
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
                        disabled={resultTab !== 'data'}
                    >
                        <ListAltIcon
                            sx={{
                                color:
                                    resultTab === 'data'
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
                        disabled={resultTab !== 'data'}
                    >
                        <FilterIcon
                            sx={{
                                color:
                                    resultTab === 'data'
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
                <IconButton onClick={handleRefreshCompare} size="small">
                    <RefreshIcon sx={{ color: 'grey.600' }} />
                </IconButton>
            </Tooltip>
            <Tooltip title="Close comparison" enterDelay={1000}>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon sx={{ color: 'grey.600' }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default CompareToolbar;
