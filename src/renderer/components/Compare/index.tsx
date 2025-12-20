import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { openModal } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import Loading from 'renderer/components/Loading';
import Results from 'renderer/components/Compare/Results';

const styles = {
    container: {
        height: '100%',
        width: '100%',
        backgroundColor: '#FFF',
    },
    loading: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        display: 'flex',
        backgroundColor: '#FFF',
        flexDirection: 'column',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
    },
    sponsored: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#888',
        textAlign: 'center',
    },
    selectButton: {
        textTransform: 'none',
        padding: 0,
        marginRight: '4px',
        minWidth: 'auto',
        lineHeight: 1,
    },
};

const Compare: React.FC = () => {
    const dispatch = useAppDispatch();

    const fileBase = useAppSelector((state) => state.data.compare.fileBase);
    const fileComp = useAppSelector((state) => state.data.compare.fileComp);
    const isComparing = useAppSelector((state) => state.ui.compare.isComparing);
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.datasetDiff,
    );

    const handleSelectFiles = async () => {
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    };

    if (isComparing) {
        return (
            <Box sx={styles.container}>
                <Box sx={styles.loading}>
                    <Loading />
                    <Box sx={styles.sponsored}>Sponsored by:</Box>
                </Box>
            </Box>
        );
    }

    if (datasetDiff) {
        return <Results />;
    }

    if (!fileBase || !fileComp) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
            >
                <Stack direction="row" alignItems="center">
                    <Button
                        sx={styles.selectButton}
                        onClick={handleSelectFiles}
                    >
                        Select
                    </Button>
                    <Box>files to start compare</Box>
                </Stack>
            </Box>
        );
    }

    return null;
};

export default Compare;
