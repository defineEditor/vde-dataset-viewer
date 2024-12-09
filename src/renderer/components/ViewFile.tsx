import React from 'react';
import Stack from '@mui/material/Stack';
import Header from 'renderer/components/Header';
import DatasetContainer from 'renderer/components/DatasetContainer';
import AppContextProvider from 'renderer/utils/AppContextProvider';

const styles = {
    stack: {
        display: 'flex',
        height: '100%',
    },
};

const ViewFile: React.FC = () => {
    return (
        <AppContextProvider>
            <Stack sx={styles.stack}>
                <Header />
                <DatasetContainer />
            </Stack>
        </AppContextProvider>
    );
};

export default ViewFile;
