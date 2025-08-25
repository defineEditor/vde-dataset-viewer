import React, {
    useState,
    useContext,
    useEffect,
    useRef,
    useCallback,
} from 'react';
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
import { openSnackbar } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import { ITableData, ParsedValidationReport } from 'interfaces/common';
import convertToDataset from 'renderer/components/Validator/Report/convertToDataset';
import DatasetContainer from 'renderer/components/Validator/Report/ReportDatasetContainer';

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
    const [tab, setTab] = useState('1');
    const [dimensions, setDimensions] = useState({ height: 600, width: 800 });
    const tabContainerRef = useRef<HTMLDivElement>(null);

    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [report, setReport] = useState<ParsedValidationReport | null>(null);
    const [tables, setTables] = useState<{
        details: ITableData;
        summary: ITableData;
        rules: ITableData;
    } | null>(null);

    const reportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    // Function to measure TabPanel dimensions
    const measureTabPanel = useCallback(() => {
        if (tabContainerRef.current) {
            const rect = tabContainerRef.current.getBoundingClientRect();
            setDimensions({
                height: rect.height,
                width: rect.width,
            });
        }
    }, []);

    // Use ResizeObserver to track dimension changes
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            measureTabPanel();
        });

        if (tabContainerRef.current) {
            resizeObserver.observe(tabContainerRef.current);
        }

        // Initial measurement
        measureTabPanel();

        return () => {
            resizeObserver.disconnect();
        };
    }, [measureTabPanel, tab]); // Re-run when tab changes

    useEffect(() => {
        const getReport = async () => {
            if (reportId) {
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
                    setReport(newReport);
                    const details = convertToDataset(
                        newReport,
                        'Issue_Details',
                    );
                    const summary = convertToDataset(
                        newReport,
                        'Issue_Summary',
                    );
                    const rules = convertToDataset(newReport, 'Rules_Report');
                    setTables({
                        details,
                        summary,
                        rules,
                    });
                }
            }
        };
        getReport();
    }, [reportId, apiService, dispatch]);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: string,
    ) => {
        setTab(newValue);
    };

    if (!reportId) {
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
                <TabList onChange={handleTabChange} sx={styles.tabs}>
                    <StyledTab label="Issue Summary" value="1" />
                    <StyledTab label="Issue Details" value="2" />
                    <StyledTab label="Rules Report" value="3" />
                </TabList>
                <Box ref={tabContainerRef} style={styles.fullHeight}>
                    <TabPanel value="1" sx={styles.tabPanel}>
                        <DatasetContainer
                            data={tables?.summary}
                            dimentions={dimensions}
                        />
                    </TabPanel>
                    <TabPanel value="2" sx={styles.tabPanel}>
                        <DatasetContainer
                            data={tables?.details}
                            dimentions={dimensions}
                        />
                    </TabPanel>
                    <TabPanel value="3" sx={styles.tabPanel}>
                        <DatasetContainer
                            data={tables?.rules}
                            dimentions={dimensions}
                        />
                    </TabPanel>
                </Box>
            </TabContext>
        </Stack>
    );
};

export default ValidationReportPage;
