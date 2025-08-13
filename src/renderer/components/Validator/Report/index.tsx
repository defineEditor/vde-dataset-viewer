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
import { openSnackbar } from 'renderer/redux/slices/ui';
import { ParsedValidationReport } from 'interfaces/core.report';
import AppContext from 'renderer/utils/AppContext';
import IssueSummary from 'renderer/components/Validator/Report/IssueSummary';
import IssueDetails from 'renderer/components/Validator/Report/IssueDetails';
import RuleReports from 'renderer/components/Validator/Report/RuleReports';

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
};

const StyledTab = styled(Tab)({
    textTransform: 'none',
});

const Loading = () => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '1 1 auto',
        }}
    >
        <CircularProgress variant="indeterminate" size={55} />
    </Box>
);

const ValidationReportPage: React.FC = () => {
    const [tab, setTab] = useState('1');

    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [report, setReport] = useState<ParsedValidationReport | null>(null);

    const reportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

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
                    setReport(newReport);
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
        return <Loading />;
    }

    return (
        <Stack
            spacing={0}
            justifyContent="space-between"
            sx={{
                display: 'flex',
                flex: '1 1 auto',
                px: 2,
                backgroundColor: 'grey.300',
            }}
        >
            <Stack
                spacing={2}
                justifyContent="flex-start"
                sx={{ display: 'flex', flex: '1 1 auto', mb: 1 }}
            >
                <TabContext value={tab}>
                    <TabList onChange={handleTabChange}>
                        <StyledTab label="Issue Summary" value="1" />
                        <StyledTab label="Issue Details" value="2" />
                        <StyledTab label="Rules Report" value="3" />
                    </TabList>
                    <TabPanel value="1" sx={{ p: 0 }}>
                        <IssueSummary report={report} />
                    </TabPanel>
                    <TabPanel value="2" sx={{ p: 0 }}>
                        <IssueDetails report={report} />
                    </TabPanel>
                    <TabPanel value="3" sx={{ p: 0 }}>
                        <RuleReports report={report} />
                    </TabPanel>
                </TabContext>
            </Stack>
        </Stack>
    );
};

export default ValidationReportPage;
