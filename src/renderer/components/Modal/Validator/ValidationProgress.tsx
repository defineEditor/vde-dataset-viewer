import React from 'react';
import { Paper, Typography, LinearProgress, Stack } from '@mui/material';

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

interface ValidationProgressProps {
    conversionProgress: number | null;
    validationProgress: number;
}

const ValidationProgress: React.FC<ValidationProgressProps> = ({
    conversionProgress,
    validationProgress,
}) => {
    return (
        <Stack spacing={2} sx={styles.container}>
            <Typography variant="h6">Processing</Typography>
            {conversionProgress !== null && (
                <Paper sx={styles.progressContainer}>
                    <>
                        <Typography variant="subtitle1">Conversion</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={conversionProgress}
                            sx={styles.progressBar}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {conversionProgress === 100
                                ? 'Complete'
                                : conversionProgress === 0
                                  ? 'Pending'
                                  : `Converting (${Math.round(conversionProgress)}%)`}
                        </Typography>
                    </>
                </Paper>
            )}
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
        </Stack>
    );
};

export default ValidationProgress;
