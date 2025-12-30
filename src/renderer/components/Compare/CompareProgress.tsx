import React from 'react';
import {
    Zoom,
    Grow,
    Paper,
    Typography,
    LinearProgress,
    Stack,
    Box,
} from '@mui/material';
import DogWorker from 'renderer/components/Loading/DogWorker';
import CatWorker from 'renderer/components/Loading/CatWorker';
import { useAppSelector } from 'renderer/redux/hooks';
import { ISettings } from 'interfaces/common';

const styles = {
    container: {
        p: 2,
        minHeight: '100%',
        backgroundColor: 'grey.100',
    },
    progressContainer: {
        width: '100%',
        mb: 2,
        p: 2,
    },
    progressBar: {
        width: '100%',
        height: 24,
        borderRadius: 2,
        mt: 1,
    },
    closeWindowNote: {
        width: '100%',
        textAlign: 'center',
    },
    workers: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        pr: 4,
    },
    error: {
        mt: 0.5,
    },
};

const ProgressContainer: React.FC<{
    progress: number;
    issues: number;
}> = ({ progress, issues }) => {
    return (
        <Grow in={progress > 0} timeout={500} unmountOnExit>
            <Paper sx={styles.progressContainer}>
                <>
                    <Typography variant="subtitle1">Compare</Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={styles.progressBar}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {progress === 100
                            ? 'Complete'
                            : progress === 0
                              ? 'Pending'
                              : `Comparing (${Math.round(progress)}%) - Issues found: ${issues}`}
                    </Typography>
                </>
            </Paper>
        </Grow>
    );
};

const randomType = Math.random() < 0.5 ? 'cat' : 'dog';

const Worker: React.FC<{
    loadingAnimation: ISettings['other']['loadingAnimation'];
}> = ({ loadingAnimation }) => {
    if (loadingAnimation === 'cat') {
        return <CatWorker />;
    }
    if (loadingAnimation === 'dog') {
        return <DogWorker />;
    }
    if (randomType === 'cat') {
        return <CatWorker />;
    }
    if (randomType === 'dog') {
        return <DogWorker />;
    }
    return null;
};

const CompareProgress: React.FC<{
    progress: number;
    issues: number;
}> = ({ progress, issues }) => {
    const loadingAnimation = useAppSelector(
        (state) => state.settings.other.loadingAnimation,
    );

    return (
        <Stack spacing={2} sx={styles.container} alignItems="flex-start">
            <Typography variant="h6">Processing</Typography>
            <ProgressContainer progress={progress} issues={issues} />
            <Zoom in={progress !== 100} timeout={1000}>
                <Box sx={styles.closeWindowNote}>
                    {loadingAnimation !== 'normal' && (
                        <Box sx={styles.workers}>
                            <Worker loadingAnimation={loadingAnimation} />
                        </Box>
                    )}
                </Box>
            </Zoom>
        </Stack>
    );
};

export default CompareProgress;
