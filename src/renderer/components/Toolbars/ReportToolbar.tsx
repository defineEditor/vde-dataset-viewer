import React, { useEffect, useCallback, useContext } from 'react';
import { Typography, Tooltip, IconButton, Stack } from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterAlt';
import DownloadIcon from '@mui/icons-material/Download';
import FilterOffIcon from '@mui/icons-material/FilterAltOff';
import { openModal, openSnackbar } from 'renderer/redux/slices/ui';
import {
    resetReportFilter,
    setReportLastSaveFolder,
} from 'renderer/redux/slices/data';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import { modals } from 'misc/constants';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
    reportName: {
        color: 'text.primary',
        fontWeight: 'bold',
        alignContent: 'center',
    },
};

const Header: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentReportTab = useAppSelector(
        (state) => state.ui.validationPage.currentReportTab,
    );

    const reportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const report = useAppSelector(
        (state) =>
            state.data.validator.reports?.[reportId || ''] || { files: [] },
    );

    const datasetNames = report.files
        ? report.files
              .slice(0, 5)
              .map((file) =>
                  file.file
                      .replace(/.*(?:\/|\\)(.*)\.\w+$/, '$1')
                      .toUpperCase(),
              )
              .join(', ')
        : '';

    const additionalCount =
        report.files && report.files.length > 5
            ? ` (+${report.files.length - 5} more)`
            : '';

    const reportTitle = `${datasetNames}${additionalCount || ''} `;

    const isFilterEnabled = useAppSelector(
        (state) =>
            state.data.validator.reportFilters?.[currentReportTab] &&
            state.data.validator.reportFilters?.[currentReportTab] !== null,
    );

    const isModalOpen = useAppSelector((state) => state.ui.modals?.length > 0);

    const handleFilterClick = useCallback(() => {
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'report', data: {} }),
        );
    }, [dispatch]);

    const handleResetFilter = useCallback(() => {
        dispatch(resetReportFilter());
    }, [dispatch]);

    const lastReportSaveFolder = useAppSelector(
        (state) => state.data.validator.lastReportSaveFolder,
    );

    const handleDownloadReport = useCallback(() => {
        const downloadReport = async () => {
            const result = await apiService.downloadValidationReport(
                report.output,
                lastReportSaveFolder,
            );
            if (result === false) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: 'Failed to download report.',
                    }),
                );
            } else if (result === '') {
                // User canceled the folder selection
                dispatch(
                    openSnackbar({
                        type: 'info',
                        message: 'Canceled.',
                    }),
                );
            } else if (typeof result === 'string') {
                dispatch(
                    openSnackbar({
                        type: 'success',
                        message: `Report saved to ${result}`,
                    }),
                );
                dispatch(
                    setReportLastSaveFolder(result), // Save last used folder
                );
            }
        };
        downloadReport();
    }, [dispatch, apiService, lastReportSaveFolder, report.output]);

    const handleFilterReset = useCallback(() => {
        dispatch(resetReportFilter());
    }, [dispatch]);

    // Add shortcuts for actions
    useEffect(() => {
        const handleViewerToolbarKeyDown = (event: KeyboardEvent) => {
            // Do use keywords if a Modal is open
            if (event.ctrlKey && !isModalOpen) {
                event.preventDefault();
                event.stopPropagation();
                switch (event.key) {
                    case 'f':
                        if (event.altKey) {
                            handleFilterReset();
                        } else {
                            handleFilterClick();
                        }
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
    }, [handleFilterClick, handleFilterReset, isModalOpen]);

    const tabHasFilter = ['details', 'summary', 'rules'].includes(
        currentReportTab,
    );

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            <Typography variant="h6" sx={styles.reportName}>
                {reportTitle}
            </Typography>
            {tabHasFilter && (
                <>
                    <Tooltip title="Filter Report" enterDelay={1000}>
                        <IconButton
                            onClick={handleFilterClick}
                            id="filterData"
                            size="small"
                            disabled={!tabHasFilter}
                        >
                            <FilterIcon
                                sx={{
                                    color: isFilterEnabled
                                        ? 'success.main'
                                        : tabHasFilter
                                          ? 'primary.main'
                                          : 'primary.disabled',
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Filter" enterDelay={1000}>
                        <IconButton
                            onClick={handleResetFilter}
                            id="resetFilter"
                            size="small"
                            disabled={!isFilterEnabled}
                        >
                            <FilterOffIcon
                                sx={{
                                    color: isFilterEnabled
                                        ? 'primary.main'
                                        : 'primary.disabled',
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                </>
            )}
            <Tooltip title="Download Report" enterDelay={1000}>
                <IconButton
                    onClick={handleDownloadReport}
                    id="downloadReport"
                    size="small"
                >
                    <DownloadIcon sx={{ color: 'primary.main' }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default Header;
