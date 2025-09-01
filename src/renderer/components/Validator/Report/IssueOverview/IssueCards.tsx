import React, { useState, useRef, useEffect } from 'react';
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
} from 'interfaces/core.report';

const styles = {
    actions: {
        width: '100%',
    },
    card: {
        width: '300px',
        backgroundColor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
    },
    cardContent: {
        px: 2,
        py: 0,
        flex: '1 1 auto',
    },
    issueDescription: {
        display: '-webkit-box',
        overflow: 'hidden',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 3,
        lineHeight: '1.5em',
        minHeight: '4.5em',
        height: '4.5em',
    },
    cardHeader: {
        px: 2,
        py: 1,
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

// Component to conditionally show tooltip only if text is truncated
const TruncatedTextWithTooltip: React.FC<{
    text: string;
}> = ({ text }) => {
    const textRef = useRef<HTMLDivElement>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                const element = textRef.current;
                const lineHeight = parseInt(
                    window.getComputedStyle(element).lineHeight,
                    10,
                );
                const maxHeight = lineHeight * 3;
                setShowTooltip(element.scrollHeight > maxHeight);
            }
        };

        checkTruncation();
        // Re-check on window resize
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [text]);

    const truncatedText = (
        <Typography ref={textRef} variant="body2" sx={styles.issueDescription}>
            {text}
        </Typography>
    );

    return showTooltip ? (
        <Tooltip title={text} placement="top" arrow>
            {truncatedText}
        </Tooltip>
    ) : (
        truncatedText
    );
};

interface IssueGroup {
    ruleId: string;
    message: string;
    totalIssues: number;
    datasetCount: number;
    datasets: { dataset: string; issues: number }[];
}

interface IssueCardsProps {
    parsedReport: ParsedValidationReport;
    showOnlyIssuesWithHighCount?: boolean;
}

const IssueCards: React.FC<IssueCardsProps> = ({
    parsedReport,
    showOnlyIssuesWithHighCount = false,
}) => {
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const handleExpandClick = (ruleId: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(ruleId)) {
                newSet.delete(ruleId);
            } else {
                newSet.add(ruleId);
            }
            return newSet;
        });
    };

    // Group issues by rule ID
    const issueGroups: IssueGroup[] = React.useMemo(() => {
        const ruleMap = new Map<string, IssueGroup>();

        parsedReport.Issue_Summary.forEach((issue: IssueSummaryItem) => {
            const existing = ruleMap.get(issue.core_id);
            if (existing) {
                existing.totalIssues += issue.issues;
                existing.datasetCount += 1;
                existing.datasets.push({
                    dataset: issue.dataset,
                    issues: issue.issues,
                });
            } else {
                ruleMap.set(issue.core_id, {
                    ruleId: issue.core_id,
                    message: issue.message,
                    totalIssues: issue.issues,
                    datasetCount: 1,
                    datasets: [
                        {
                            dataset: issue.dataset,
                            issues: issue.issues,
                        },
                    ],
                });
            }
        });

        let groups = Array.from(ruleMap.values()).sort((a, b) => {
            // Sort by total issues descending, then by rule ID
            if (a.totalIssues !== b.totalIssues) {
                return b.totalIssues - a.totalIssues;
            }
            return a.ruleId.localeCompare(b.ruleId);
        });

        if (showOnlyIssuesWithHighCount) {
            groups = groups.filter((group) => group.totalIssues >= 10);
        }

        return groups;
    }, [parsedReport, showOnlyIssuesWithHighCount]);

    const handleShowIssueDetails = (ruleId: string) => {
        if (ruleId) {
            // open issue details
        }
    };

    return (
        <Grid2 container spacing={2}>
            {issueGroups.map((issueGroup) => (
                <Grid2 key={issueGroup.ruleId}>
                    <Card sx={styles.card}>
                        <CardHeader
                            title={
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <Typography
                                        variant="h5"
                                        color="primary.main"
                                    >
                                        {issueGroup.ruleId}
                                    </Typography>
                                </Stack>
                            }
                            sx={styles.cardHeader}
                        />
                        <CardContent sx={styles.cardContent}>
                            <TruncatedTextWithTooltip
                                text={issueGroup.message}
                            />
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
                                            handleShowIssueDetails(
                                                issueGroup.ruleId,
                                            )
                                        }
                                        aria-label="show issue details"
                                    >
                                        <ArrowCircleRightOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                                <ExpandMore
                                    expand={expandedCards.has(
                                        issueGroup.ruleId,
                                    )}
                                    onClick={() =>
                                        handleExpandClick(issueGroup.ruleId)
                                    }
                                    aria-expanded={expandedCards.has(
                                        issueGroup.ruleId,
                                    )}
                                    aria-label="show more"
                                >
                                    <ExpandMoreIcon />
                                </ExpandMore>
                            </Stack>
                        </CardActions>
                        <Collapse
                            in={expandedCards.has(issueGroup.ruleId)}
                            timeout="auto"
                            unmountOnExit
                        >
                            <Divider />
                            <List dense>
                                {issueGroup.datasets
                                    .sort((a, b) => b.issues - a.issues)
                                    .map((datasetInfo) => (
                                        <ListItem
                                            key={`${issueGroup.ruleId}-${datasetInfo.dataset}`}
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
                                                            {
                                                                datasetInfo.dataset
                                                            }
                                                        </Typography>
                                                        <Chip
                                                            label={
                                                                datasetInfo.issues
                                                            }
                                                            size="small"
                                                            color="warning"
                                                        />
                                                    </Box>
                                                }
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

export default IssueCards;
