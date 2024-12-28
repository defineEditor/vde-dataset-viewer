import React, { useMemo } from 'react';
import ApiService from 'renderer/services/ApiService';
import AppContext from 'renderer/utils/AppContext';

interface IAppContextProvider {
    children: React.ReactNode;
}

const AppContextProvider: React.FC<IAppContextProvider> = ({
    children,
}: IAppContextProvider) => {
    const contextValue = useMemo(() => {
        const apiService = new ApiService();
        return { apiService };
    }, []);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
