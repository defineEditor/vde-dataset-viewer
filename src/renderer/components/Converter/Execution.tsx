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
import { ProgressInfo, ConvertTask } from 'interfaces/common';

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
};

const Execution: React.FC<{
    onBack: () => void;
    task: ConvertTask;
}> = ({ onBack, task }) => {
    const { apiService } = useContext(AppContext);
    const [progress, setProgress] = useState<number[]>(
        new Array(task.files.length).fill(0),
    );
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        apiService.cleanTaskProgressListeners();

        apiService.subscriteToTaskProgress((info: ProgressInfo) => {
            const match = info.id.match(/convert-(\d+)/);
            if (match) {
                const fileIndex = parseInt(match[1], 10);
                setProgress((prev) => {
                    const newProgress = [...prev];
                    newProgress[fileIndex] = info.progress * 100;
                    return newProgress;
                });
            }
        });

        apiService.startTask(task);

        return () => {
            apiService.cleanTaskProgressListeners();
        };
    }, [apiService, task]);

    // Check if all files are complete
    useEffect(() => {
        const allComplete = progress.every((p) => p === 100);
        if (allComplete) {
            setIsComplete(true);
        }
    }, [progress]);

    return (
        <Stack spacing={2} sx={styles.container}>
            <Typography variant="h6">Converting Files</Typography>

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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
