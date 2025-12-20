import React from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import {
    openModal,
    setCompareIsComparing,
    setCompareView,
    openSnackbar,
    setPathname,
} from 'renderer/redux/slices/ui';
import { paths, modals } from 'misc/constants';
import { setCompareData } from 'renderer/redux/slices/data';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
};

const CompareToolbar: React.FC = () => {
    const { apiService } = React.useContext(AppContext);
    const dispatch = useAppDispatch();

    const filePathBase = useAppSelector((state) => state.data.compare.fileBase);
    const filePathComp = useAppSelector((state) => state.data.compare.fileComp);

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

    const handleRefreshCompare = () => {
        const compare = async () => {
            if (!filePathBase || !filePathComp) {
                return;
            }
            // Reset compare diff
            dispatch(
                setCompareData({
                    fileBase: filePathBase,
                    fileComp: filePathComp,
                    datasetDiff: null,
                }),
            );
            const result = await apiService.compareDatasets(
                filePathBase,
                filePathComp,
                {},
                { encoding: 'default', bufferSize: 10000 },
            );
            if ('error' in result) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: result.error,
                    }),
                );
            } else {
                dispatch(
                    setCompareData({
                        fileBase: filePathBase,
                        fileComp: filePathComp,
                        datasetDiff: result,
                    }),
                );
                dispatch(setPathname({ pathname: paths.COMPARE }));
            }
        };
        compare();
    };

    const handleClose = () => {
        dispatch(
            setCompareData({
                fileBase: null,
                fileComp: null,
                datasetDiff: null,
            }),
        );
        dispatch(setCompareIsComparing(false));
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
