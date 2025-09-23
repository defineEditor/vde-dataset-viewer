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
import { ISettings, IUiValidation } from 'interfaces/common';

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
};

const ProgressContainer: React.FC<{
    validationId: string | null;
}> = ({ validationId }) => {
    const { conversionProgress, validationProgress } =
        useAppSelector<IUiValidation>(
            (state) =>
                (validationId !== null &&
                    state.ui.validation[validationId]) || {
                    status: 'not started',
                    validationProgress: 0,
                    conversionProgress: null,
                    dateCompleted: null,
                },
        );

    return (
        <>
            <Grow in={conversionProgress !== null} timeout={500}>
                <Paper sx={styles.progressContainer}>
                    <>
                        <Typography variant="subtitle1">Conversion</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={conversionProgress || 0}
                            sx={styles.progressBar}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {conversionProgress === 100
                                ? 'Complete'
                                : conversionProgress === 0
                                  ? 'Pending'
                                  : `Converting (${Math.round(conversionProgress || 0)}%)`}
                        </Typography>
                    </>
                </Paper>
            </Grow>
            <Grow in={validationProgress > 0} timeout={500}>
                <Paper sx={styles.progressContainer}>
                    <Typography variant="subtitle1">Validation</Typography>
                    <LinearProgress
                        variant="determinate"
                        value={validationProgress}
                        sx={styles.progressBar}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {validationProgress === 100
                            ? 'Complete'
                            : validationProgress === 0
                              ? 'Pending'
                              : `Validating (${Math.round(validationProgress)}%)`}
                    </Typography>
                </Paper>
            </Grow>
        </>
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

const ValidationProgress: React.FC<{
    validationId: string | null;
    validationStatus: IUiValidation['status'];
}> = ({ validationId, validationStatus }) => {
    const loadingAnimation = useAppSelector(
        (state) => state.settings.other.loadingAnimation,
    );

    return (
        <Stack spacing={2} sx={styles.container} alignItems="flex-start">
            <Typography variant="h6">Processing</Typography>
            <ProgressContainer validationId={validationId} />
            <Zoom in={validationStatus !== 'completed'} timeout={1000}>
                <Box sx={styles.closeWindowNote}>
                    <Typography variant="body2" sx={styles.closeWindowNote}>
                        You can continue working on other tasks
                    </Typography>
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

export default ValidationProgress;
