import React, { useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { Stack, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { setCurrentIssueIndex, setGoTo } from 'renderer/redux/slices/ui';

const styles = {
    tabs: {
        maxWidth: '100%',
    },
    item: {
        px: 1,
    },
    label: {
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        overflow: 'auto',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
    },
    iconButton: {
        ml: 0,
        height: 24,
        width: 24,
        transform: 'translateY(-1px)',
    },
    container: {
        height: '100%',
        width: '100%',
    },
};

const IssueNavigation: React.FC<{
    issuesByRow:
        | { row: number; ruleId: string; column: string; text: string }[]
        | null;
}> = ({ issuesByRow }) => {
    const dispatch = useAppDispatch();
    const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const currentIssueIndex = useAppSelector((state) => {
        const dataSettings = state.ui.dataSettings[currentFileId];
        return dataSettings?.currentIssueIndex || 0;
    });

    const totalIssues = issuesByRow?.length || 0;

    const throttledSetGoTo = useCallback(
        (row: number, column?: string) => {
            if (throttleRef.current) {
                clearTimeout(throttleRef.current);
            }

            throttleRef.current = setTimeout(() => {
                if (column) {
                    dispatch(setGoTo({ row, column }));
                } else {
                    dispatch(setGoTo({ row }));
                }
            }, 300);
        },
        [dispatch],
    );

    const handleChange = (direction: 'next' | 'previous') => {
        if (issuesByRow === null) {
            return;
        }

        let newIndex = currentIssueIndex;
        if (direction === 'previous') {
            newIndex =
                currentIssueIndex > 0 ? currentIssueIndex - 1 : totalIssues - 1;
        } else {
            newIndex =
                currentIssueIndex < totalIssues - 1 ? currentIssueIndex + 1 : 0;
        }
        // Get issue at the new index
        const issue = issuesByRow[newIndex];

        throttledSetGoTo(issue.row + 1, issue?.column);

        dispatch(
            setCurrentIssueIndex({
                id: currentFileId,
                index: newIndex,
            }),
        );
    };

    if (issuesByRow === null) {
        return null;
    }

    const currentIssue = issuesByRow[currentIssueIndex];

    if (totalIssues === 0) {
        return null;
    }

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={styles.container}
        >
            <Typography variant="body2">
                {currentIssueIndex + 1}/{totalIssues}
            </Typography>

            <Stack direction="row" spacing={0}>
                <IconButton
                    size="small"
                    onClick={() => handleChange('previous')}
                    disabled={totalIssues <= 1}
                >
                    <ChevronLeftIcon />
                </IconButton>

                <IconButton
                    size="small"
                    onClick={() => handleChange('next')}
                    disabled={totalIssues <= 1}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Stack>

            <Typography variant="body2" sx={styles.label}>
                {currentIssue?.ruleId || 'Unknown Rule'} :{' '}
                {currentIssue?.text || ''}
            </Typography>
        </Stack>
    );
};

export default IssueNavigation;
