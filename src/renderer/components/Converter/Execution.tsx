import React, { useContext, useState, useEffect } from 'react';
import {
    Stack,
    Button,
    LinearProgress,
    Box,
    Paper,
    Typography,
} from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch } from 'renderer/redux/hooks';
import { ConvertTask, TaskProgress } from 'interfaces/common';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { mainTaskTypes } from 'misc/constants';

const styles = {
    container: {
        p: 2,
        minHeight: '100%',
        backgroundColor: 'grey.100',
    },
    progressContainer: {
        mb: 2,
        p: 2,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        mt: 1,
    },
    title: {
        flex: '1 1 auto',
    },
    tasks: {
        flex: '1 1 99%',
        overflow: 'scroll',
    },
    button: {
        flex: '1 1 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
    },
};

const Execution: React.FC<{
    onBack: () => void;
    task: ConvertTask;
}> = ({ onBack, task }) => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [progress, setProgress] = useState<number[]>(
        new Array(task.files.length).fill(0),
    );
    const [isComplete, setIsComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Add timer effect
    useEffect(() => {
        const startTime = Date.now();
        const timer = setInterval(() => {
            if (!isComplete) {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isComplete]);

    useEffect(() => {
        apiService.cleanTaskProgressListeners();

        apiService.subscribeToTaskProgress((info: TaskProgress) => {
            if (
                info.type !== mainTaskTypes.CONVERT ||
                !info.id.startsWith(task.id)
            ) {
                return;
            }
            const match = info.id.match(/.*-(\d+)$/);
            if (match) {
                const fileIndex = parseInt(match[1], 10);
                setProgress((prev) => {
                    const newProgress = [...prev];
                    newProgress[fileIndex] = info.progress;
                    return newProgress;
                });
            }
        });

        const runTask = async () => {
            const result = await apiService.startTask(task);
            if (typeof result === 'object' && 'error' in result) {
                dispatch(
                    openSnackbar({
                        message: result.error,
                        type: 'error',
                    }),
                );
            } else if (result === false) {
                dispatch(
                    openSnackbar({
                        message: 'Error while executing the task',
                        type: 'error',
                    }),
                );
            }
            setIsComplete(true);
        };

        runTask();

        return () => {
            apiService.cleanTaskProgressListeners();
        };
    }, [apiService, task, dispatch]);

    return (
        <Stack spacing={2} sx={styles.container}>
            <Typography variant="h6" sx={styles.title}>
                Converting Files
            </Typography>

            <Box sx={styles.tasks}>
                {task.files.map((file, index) => (
                    <Paper key={file.fullPath} sx={styles.progressContainer}>
                        <Typography variant="subtitle1">
                            {file.outputName}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progress[index]}
                            sx={styles.progressBar}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {progress[index] === 100
                                ? 'Complete'
                                : progress[index] === 0
                                  ? 'Pending'
                                  : `Converting (${Math.round(progress[index])}%)`}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            <Box sx={styles.button}>
                <Typography variant="caption" sx={{ ml: 2 }}>
                    {(elapsedTime > 0 || isComplete) &&
                        `Time: ${Math.floor(elapsedTime / 60)}:${(
                            elapsedTime % 60
                        )
                            .toString()
                            .padStart(2, '0')}`}
                </Typography>
                <Button
                    variant="contained"
                    onClick={onBack}
                    disabled={!isComplete}
                >
                    {isComplete ? 'Done' : 'Converting...'}
                </Button>
            </Box>
        </Stack>
    );
};

export default Execution;
