import React from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Stack,
    Checkbox,
    IconButton,
    Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    toggleShowOnlyDatasetsWithIssues,
    setReportSummaryType,
    setValidationReportTab,
} from 'renderer/redux/slices/ui';
import DatasetCards from 'renderer/components/Validator/Report/IssueOverview/DatasetCards';
import IssueCards from 'renderer/components/Validator/Report/IssueOverview/IssueCards';
import { BasicFilter } from 'js-array-filter';
import { setReportFilter } from 'renderer/redux/slices/data';
import { IUiValidationPage, ParsedValidationReport } from 'interfaces/common';

const RotatingIcon = styled(
    (props: { rotate: boolean } & React.ComponentProps<typeof IconButton>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { rotate, ...other } = props;
        return <IconButton {...other} />;
    },
)(({ theme, rotate }) => ({
    transform: !rotate ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.standard,
    }),
}));

const styles = {
    container: {
        p: 3,
        backgroundColor: 'grey.300',
        overflow: 'hidden',
    },
    controls: {
        pb: 2,
        overflow: 'auto',
    },
    reportType: {
        width: 80,
    },
};

interface IssueOverviewProps {
    parsedReport: ParsedValidationReport;
}

const IssueOverview: React.FC<IssueOverviewProps> = ({ parsedReport }) => {
    const dispatch = useAppDispatch();

    const reportSummaryType = useAppSelector(
        (state) => state.ui.validationPage.reportSummaryType,
    );

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        dispatch(
            setReportSummaryType(
                reportSummaryType === 'datasets' ? 'issues' : 'datasets',
            ),
        );
    };

    const handleShowOnlyDatasetsWithIssuesChange = (
        _event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        dispatch(toggleShowOnlyDatasetsWithIssues());
    };

    const showOnlyDatasetsWithIssues = useAppSelector(
        (state) => state.ui.validationPage.showOnlyDatasetsWithIssues,
    );

    const handleUpdateFilter = (
        values: string[],
        variables: string[],
        reportTab: IUiValidationPage['currentReportTab'],
    ) => {
        if (values.length > 0) {
            // Set filter to show only issues for this dataset
            const newFilter: BasicFilter = {
                conditions: variables.map((variable, index) => ({
                    variable,
                    operator: 'eq',
                    value: values[index],
                })),
                connectors: new Array(values.length - 1).fill('and'),
            };
            // Update the filter
            dispatch(setReportFilter({ filter: newFilter, reportTab }));
            // Switch to details tab
            dispatch(setValidationReportTab(reportTab));
        }
    };

    return (
        <Box sx={styles.container}>
            <Stack
                justifyContent="flex-start"
                alignItems="center"
                spacing={2}
                direction="row"
                sx={styles.controls}
            >
                <Typography variant="h5" sx={styles.reportType}>
                    {reportSummaryType === 'datasets' ? 'Datasets' : 'Issues'}
                </Typography>
                <Tooltip
                    title={`Switch view to ${reportSummaryType === 'datasets' ? 'Issues' : 'Datasets'}`}
                >
                    <RotatingIcon
                        rotate={reportSummaryType === 'issues'}
                        onClick={handleViewModeChange}
                    >
                        <LoopOutlinedIcon />
                    </RotatingIcon>
                </Tooltip>
                {reportSummaryType === 'datasets' && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showOnlyDatasetsWithIssues}
                                onChange={
                                    handleShowOnlyDatasetsWithIssuesChange
                                }
                            />
                        }
                        label="Only datasets with issues"
                    />
                )}
            </Stack>

            {reportSummaryType === 'datasets' ? (
                <DatasetCards
                    parsedReport={parsedReport}
                    showOnlyDatasetsWithIssues={showOnlyDatasetsWithIssues}
                    onUpdateFilter={handleUpdateFilter}
                />
            ) : (
                <IssueCards
                    parsedReport={parsedReport}
                    onUpdateFilter={handleUpdateFilter}
                />
            )}
        </Box>
    );
};

export default IssueOverview;
