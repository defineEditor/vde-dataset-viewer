import React from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openModal,
    setCompareView,
    setNewCompare,
} from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import { setCompareData } from 'renderer/redux/slices/data';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 2,
    },
};

const CompareToolbar: React.FC = () => {
    const dispatch = useAppDispatch();

    const handleCompare = () => {
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    };

    const currentView = useAppSelector((state) => state.ui.compare.view);
    const handleToggleView = () => {
        dispatch(
            setCompareView(
                currentView === 'horizontal' ? 'vertical' : 'horizontal',
            ),
        );
    };

    const fileBase = useAppSelector((state) => state.data.compare.fileBase);
    const fileComp = useAppSelector((state) => state.data.compare.fileComp);
    const handleRefreshCompare = () => {
        if (!fileBase || !fileComp) {
            return;
        }
        dispatch(setNewCompare({ fileBase, fileComp }));
    };

    const handleClose = () => {
        dispatch(
            setCompareData({
                fileBase: null,
                fileComp: null,
                datasetDiff: null,
            }),
        );
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
