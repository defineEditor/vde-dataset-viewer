import React, { useEffect, useCallback } from 'react';
import { Typography, Tooltip, IconButton, Stack } from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterAlt';
import { openModal } from 'renderer/redux/slices/ui';
import { resetReportFilter } from 'renderer/redux/slices/data';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
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
            state.data.validator.reportFilters?.[currentReportTab] !== null,
    );

    const isModalOpen = useAppSelector((state) => state.ui.modals?.length > 0);

    const handleFilterClick = useCallback(() => {
        dispatch(
            openModal({ type: modals.FILTER, filterType: 'report', data: {} }),
        );
    }, [dispatch]);

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
            <Tooltip title="Filter Report" enterDelay={1000}>
                <IconButton
                    onClick={handleFilterClick}
                    id="filterData"
                    size="small"
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
        </Stack>
    );
};

export default Header;
