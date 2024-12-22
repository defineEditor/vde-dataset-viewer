import React from 'react';
import DatasetContainer from 'renderer/components/DatasetContainer';
import AppContextProvider from 'renderer/utils/AppContextProvider';

const ViewFile: React.FC = () => {
    return (
        <AppContextProvider>
            <DatasetContainer />
        </AppContextProvider>
    );
};

export default ViewFile;
