import React, { useState } from 'react';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Card,
    CardContent,
    CardActions,
    CardHeader,
    Typography,
    Chip,
    Box,
    IconButton,
    ButtonBase,
    Collapse,
    List,
    ListItem,
    ListItemText,
    Divider,
    Grid2,
    Stack,
    Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    ParsedValidationReport,
    IssueSummaryItem,
    DatasetDetail,
    IUiValidationPage,
} from 'interfaces/common';

const styles = {
    actions: {
        width: '100%',
    },
    card: {
        width: '300px',
        backgroundColor: 'grey.200',
    },
    cardContent: {
        px: 2,
        py: 1,
    },
    cardHeader: {
        px: 2,
        py: 1,
    },
    datasetButton: {
        textTransform: 'none',
        color: 'primary.main',
        fontSize: '1.5rem',
        fontWeight: '500',
        p: 0.5,
    },
};

const ExpandMore = styled(
    (props: { expand: boolean } & React.ComponentProps<typeof IconButton>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { expand, ...other } = props;
        return <IconButton {...other} />;
    },
)(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

interface DatasetIssue {
    dataset: string;
    totalIssues: number;
    uniqueIssues: number;
    totalRecords: number;
    date: string;
    newIssues?: number;
    issues: IssueSummaryItem[];
}

interface DatasetCardsProps {
    parsedReport: ParsedValidationReport;
    showOnlyDatasetsWithIssues: boolean;
    onUpdateFilter: (
        value: string,
        variable: string,
        reportTab: IUiValidationPage['currentReportTab'],
    ) => void;
}

const DatasetCards: React.FC<DatasetCardsProps> = ({
    parsedReport,
    showOnlyDatasetsWithIssues,
    onUpdateFilter,
}) => {
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const handleExpandClick = (dataset: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(dataset)) {
                newSet.delete(dataset);
            } else {
                newSet.add(dataset);
            }
            return newSet;
        });
    };

    // Create dataset issue summary
    const datasetIssues: DatasetIssue[] = React.useMemo(() => {
        const datasetMap = new Map<string, DatasetIssue>();

        // Initialize with dataset details
        parsedReport.Dataset_Details.forEach((detail: DatasetDetail) => {
            datasetMap.set(
                detail.filename.replace(/\.[^/\\.]+$/, '').toUpperCase(),
                {
                    dataset: detail.filename
                        .replace(/\.[^/\\.]+$/, '')
                        .toUpperCase(),
                    totalIssues: 0,
                    uniqueIssues: 0,
                    totalRecords: detail.length,
                    date: detail.modification_date,
                    issues: [],
                },
            );
        });

        // Add issue summaries
        parsedReport.Issue_Summary.forEach((issue: IssueSummaryItem) => {
            const existing = datasetMap.get(issue.dataset);
            if (existing) {
                existing.totalIssues += issue.issues;
                existing.uniqueIssues += 1;
                existing.issues.push(issue);
            }
        });

        if (showOnlyDatasetsWithIssues) {
            // Filter out datasets without issues
            return Array.from(datasetMap.values()).filter(
                (dataset) => dataset.totalIssues > 0,
            );
        }

        return Array.from(datasetMap.values()).sort((a, b) =>
            a.dataset.localeCompare(b.dataset),
        );
    }, [parsedReport, showOnlyDatasetsWithIssues]);

    return (
        <Grid2 container spacing={2}>
            {datasetIssues.map((datasetIssue) => (
                <Grid2 key={datasetIssue.dataset}>
                    <Card sx={styles.card}>
                        <CardHeader
                            title={
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <ButtonBase
                                        sx={styles.datasetButton}
                                        onClick={() =>
                                            onUpdateFilter(
                                                datasetIssue.dataset,
                                                'dataset',
                                                'summary',
                                            )
                                        }
                                        disabled={
                                            datasetIssue.totalIssues === 0
                                        }
                                    >
                                        {datasetIssue.dataset}
                                    </ButtonBase>
                                    <Typography
                                        variant="body2"
                                        color="text.primary"
                                    >
                                        {datasetIssue.totalRecords} records
                                    </Typography>
                                </Stack>
                            }
                            subheader={
                                <Typography variant="body2" color="grey.600">
                                    {datasetIssue.date}
                                </Typography>
                            }
                            sx={styles.cardHeader}
                        />
                        <CardContent sx={styles.cardContent}>
                            {datasetIssue.totalIssues === 0 ? (
                                <>
                                    <Typography variant="h6">
                                        No Issues
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        component="span"
                                    >
                                        &nbsp;
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Typography variant="h6">Issues</Typography>
                                    <Typography
                                        variant="body2"
                                        component="span"
                                    >
                                        {datasetIssue.uniqueIssues} unique /{' '}
                                        {datasetIssue.totalIssues} total
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                        <CardActions>
                            <Stack
                                display="flex"
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-end"
                                sx={styles.actions}
                            >
                                <Tooltip title="Show issue details">
                                    <IconButton
                                        onClick={() =>
                                            onUpdateFilter(
                                                datasetIssue.dataset,
                                                'dataset',
                                                'details',
                                            )
                                        }
                                        aria-label="show issues"
                                        disabled={
                                            datasetIssue.totalIssues === 0
                                        }
                                    >
                                        <ArrowCircleRightOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                                <ExpandMore
                                    disabled={datasetIssue.totalIssues === 0}
                                    expand={expandedCards.has(
                                        datasetIssue.dataset,
                                    )}
                                    onClick={() =>
                                        handleExpandClick(datasetIssue.dataset)
                                    }
                                    aria-expanded={expandedCards.has(
                                        datasetIssue.dataset,
                                    )}
                                    aria-label="show more"
                                >
                                    <ExpandMoreIcon />
                                </ExpandMore>
                            </Stack>
                        </CardActions>
                        <Collapse
                            in={expandedCards.has(datasetIssue.dataset)}
                            timeout="auto"
                            unmountOnExit
                        >
                            <Divider />
                            <List dense>
                                {datasetIssue.issues.map((issue) => (
                                    <ListItem
                                        key={`${issue.dataset}-${issue.core_id}`}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box
                                                    display="flex"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="primary"
                                                    >
                                                        {issue.core_id}
                                                    </Typography>
                                                    <Chip
                                                        label={issue.issues}
                                                        size="small"
                                                        color="warning"
                                                    />
                                                </Box>
                                            }
                                            secondary={issue.message}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </Card>
                </Grid2>
            ))}
        </Grid2>
    );
};

export default DatasetCards;
