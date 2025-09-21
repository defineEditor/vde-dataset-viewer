import React, { useState, useContext, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setShowIssues,
    setValidationReportTab,
} from 'renderer/redux/slices/ui';
import { setReport, setReportFilter } from 'renderer/redux/slices/data';
import AppContext from 'renderer/utils/AppContext';
import {
    ITableData,
    IUiValidationPage,
    NewWindowProps,
    BasicFilter,
} from 'interfaces/common';
import convertToDataset from 'renderer/components/Validator/Report/convertToDataset';
import DatasetContainer from 'renderer/components/Validator/Report/ReportDatasetContainer';
import Configuration from 'renderer/components/Validator/Report/Configuration';
import IssueOverview from 'renderer/components/Validator/Report/IssueOverview';
import transformReport from 'renderer/components/Validator/Report/transformReport';
import handleOpenDataset from 'renderer/utils/handleOpenDataset';

const styles = {
    container: {
        p: 2,
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    emptyState: {
        textAlign: 'center',
        mt: 8,
        color: 'text.secondary',
    },
    tabs: {
        width: '100%',
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
        textTransform: 'none',
    },
    root: {
        display: 'flex',
        flex: '1 1 auto',
        px: 0,
        backgroundColor: 'grey.300',
        height: '100%',
    },
    fullHeight: {
        height: '100%',
        width: '100%',
    },
    tabPanel: {
        height: '100%',
        p: 0,
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '1 1 auto',
    },
    mainStack: {
        display: 'flex',
        flex: '1 1 auto',
        mb: 1,
    },
};

const StyledTab = styled(Tab)({
    textTransform: 'none',
});

const ValidationReportPage: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();
    const tab = useAppSelector(
        (state) => state.ui.validationPage.currentReportTab,
    );

    const reportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const validationReportInfo = useAppSelector(
        (state) => state.data.validator.reports[reportId || ''],
    );

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const handleOpenFile = React.useCallback(
        (
            event: React.MouseEvent<HTMLButtonElement>,
            id: string,
            row?: number,
            column?: string,
        ) => {
            // Find filename by ID
            const filePath = validationReportInfo?.files.find(
                (file) =>
                    file.file
                        .replace(/.*?([^\\/]+)\.[^/.]+$/, '$1')
                        .toUpperCase() === id,
            )?.file;
            if (filePath) {
                // Form properties
                const props: NewWindowProps = {};
                if (row || column) {
                    props.goTo = { row, column };
                }
                // If Ctrl or Cmd key is pressed, open in new window
                if (event.ctrlKey || event.metaKey) {
                    apiService.openInNewWindow(filePath, undefined, props);
                } else {
                    // Show issues in the viewer
                    dispatch(setShowIssues(true));
                    // Open in the same window
                    handleOpenDataset(
                        filePath,
                        currentFileId,
                        dispatch,
                        apiService,
                        props,
                    );
                }
            }
        },
        [validationReportInfo, apiService, currentFileId, dispatch],
    );

    const handleFilterIssues = React.useCallback(
        (
            filter: BasicFilter,
            reportTab: IUiValidationPage['currentReportTab'],
        ) => {
            if (filter) {
                dispatch(setReportFilter({ filter, reportTab }));
                // Switch to details tab
                dispatch(setValidationReportTab(reportTab));
            }
        },
        [dispatch],
    );

    const report = useAppSelector(
        (state) => state.data.validator.reportData[reportId || ''] || null,
    );

    useEffect(() => {
        const getReport = async () => {
            if (reportId) {
                // Check if report is already loaded;
                if (report) {
                    return;
                }
                const newReport =
                    await apiService.getValidationReport(reportId);
                if (newReport === null) {
                    dispatch(
                        openSnackbar({
                            message: 'Validation report could not be loaded',
                            type: 'error',
                        }),
                    );
                } else {
                    // Convert everything to dataset-json format
                    const transformedReport = transformReport(newReport);
                    dispatch(
                        setReport({ reportId, report: transformedReport }),
                    );
                }
            }
        };
        getReport();
    }, [reportId, report, apiService, dispatch]);

    const [tables, setTables] = useState<{
        details: ITableData;
        summary: ITableData;
        rules: ITableData;
    } | null>(null);

    const reportFilters = useAppSelector(
        (state) => state.data.validator.reportFilters,
    );

    useEffect(() => {
        if (report) {
            const details = convertToDataset(
                report,
                'details',
                {
                    onOpenFile: handleOpenFile,
                    onFilterIssues: handleFilterIssues,
                },
                reportFilters?.details || null,
            );
            const summary = convertToDataset(
                report,
                'summary',
                {
                    onOpenFile: handleOpenFile,
                    onFilterIssues: handleFilterIssues,
                },
                reportFilters?.summary || null,
            );
            const rules = convertToDataset(
                report,
                'rules',
                {
                    onOpenFile: handleOpenFile,
                    onFilterIssues: handleFilterIssues,
                },
                reportFilters?.rules || null,
            );
            setTables({
                details,
                summary,
                rules,
            });
        }
    }, [report, reportFilters, handleOpenFile, handleFilterIssues]);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: IUiValidationPage['currentReportTab'],
    ) => {
        dispatch(setValidationReportTab(newValue));
    };

    if (!reportId || tables === null) {
        return (
            <Box sx={styles.container}>
                <Box sx={styles.emptyState}>
                    <Typography variant="body1">
                        No validation reports selected
                    </Typography>
                    <Typography variant="body2">
                        Select a report from Results
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (!report) {
        return (
            <Box sx={styles.loading}>
                <CircularProgress variant="indeterminate" size={55} />
            </Box>
        );
    }

    return (
        <Stack spacing={0} justifyContent="flex-start" sx={styles.root}>
            <TabContext value={tab}>
                <TabList
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <StyledTab label="Overview" value="overview" />
                    <StyledTab label="Issue Summary" value="summary" />
                    <StyledTab label="Issue Details" value="details" />
                    <StyledTab label="Rules Report" value="rules" />
                    <StyledTab label="Configuration" value="configuration" />
                </TabList>
                <Box style={styles.fullHeight}>
                    <TabPanel value="overview" sx={styles.tabPanel}>
                        <IssueOverview parsedReport={report} />
                    </TabPanel>
                    <TabPanel value="summary" sx={styles.tabPanel}>
                        <DatasetContainer
                            data={tables?.summary}
                            type="summary"
                        />
                    </TabPanel>
                    <TabPanel value="details" sx={styles.tabPanel}>
                        <DatasetContainer
                            data={tables?.details}
                            type="details"
                        />
                    </TabPanel>
                    <TabPanel value="rules" sx={styles.tabPanel}>
                        <DatasetContainer data={tables?.rules} type="rules" />
                    </TabPanel>
                    <TabPanel value="configuration" sx={styles.tabPanel}>
                        <Configuration report={report} />
                    </TabPanel>
                </Box>
            </TabContext>
        </Stack>
    );
};

export default ValidationReportPage;
