import React, { useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { Stack, IconButton, Typography, Box, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { setCurrentIssueIndex } from 'renderer/redux/slices/ui';
import { IUiControl } from 'interfaces/common';

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
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    iconButton: {
        ml: 0,
        height: 24,
        width: 24,
        transform: 'translateY(-1px)',
    },
    container: {
        mx: 1,
        height: '100%',
        width: '100%',
        flex: '1 1 auto',
    },
    difference: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
    },
    moreCols: {
        alignSelf: 'center',
        color: 'text.secondary',
    },
};

const IssueNavigation: React.FC<{
    diffs: Map<
        number,
        {
            column?: {
                baseValue: string;
                compValue: string;
                diff: React.ReactElement;
            };
        }
    >;
    onSetGoTo: (goTo: Partial<IUiControl['goTo']>) => void;
}> = ({ diffs, onSetGoTo }) => {
    const dispatch = useAppDispatch();
    const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const currentIssueIndex = useAppSelector((state) => {
        const dataSettings = state.ui.dataSettings[currentFileId];
        return dataSettings?.currentIssueIndex || 0;
    });

    const totalIssues = diffs.size;

    const diffsByRow: {
        row: number;
        column: string;
        diff: React.ReactElement;
    }[] = [];
    diffs.forEach((value, key) => {
        diffsByRow.push({
            row: Number(key),
            column: Object.keys(value)[0],
            diff: (
                <Stack direction="row" spacing={1}>
                    {Object.keys(value)
                        .slice(0, 8)
                        .map((colId) => (
                            <React.Fragment key={colId}>
                                <Button
                                    variant="text"
                                    onClick={() =>
                                        onSetGoTo({
                                            row: Number(key) + 1,
                                            column: colId,
                                            cellSelection: true,
                                        })
                                    }
                                >
                                    {colId}
                                </Button>
                            </React.Fragment>
                        ))}
                    {Object.keys(value).length > 8 && (
                        <Typography variant="body2" sx={styles.moreCols}>
                            +{Object.keys(value).length - 8} more
                        </Typography>
                    )}
                </Stack>
            ),
        });
    });

    const throttledSetGoTo = useCallback(
        (row: number, column?: string) => {
            if (throttleRef.current) {
                clearTimeout(throttleRef.current);
            }

            throttleRef.current = setTimeout(() => {
                if (column) {
                    onSetGoTo({ row, column, cellSelection: true });
                } else {
                    onSetGoTo({ row });
                }
            }, 300);
        },
        [onSetGoTo],
    );

    const handleChange = (direction: 'next' | 'previous') => {
        if (diffsByRow.length === 0) {
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
        const diff = diffsByRow[newIndex];

        throttledSetGoTo(diff.row + 1, diff?.column);

        dispatch(
            setCurrentIssueIndex({
                id: currentFileId,
                index: newIndex,
            }),
        );
    };

    if (diffsByRow.length === 0) {
        return null;
    }

    const currentIssue = diffsByRow[currentIssueIndex];
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

            <>
                <Typography variant="body2" sx={styles.label}>
                    {`Row ${(currentIssue?.row || 0) + 1}: `}
                </Typography>
                <Box sx={styles.difference}>{currentIssue.diff}</Box>
            </>
        </Stack>
    );
};

export default IssueNavigation;
