import React from 'react';
import ApiService from 'renderer/services/ApiService';
import AppContext from 'renderer/utils/AppContext';

interface IAppContextProvider {
    children: React.ReactNode;
}

const apiService = new ApiService('local');

const AppContextProvider: React.FC<IAppContextProvider> = ({
    children,
}: IAppContextProvider) => {
    return (
        <AppContext.Provider value={{ apiService }}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
