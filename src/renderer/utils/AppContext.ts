import { createContext } from 'react';
import ApiService from 'renderer/services/ApiService';

export interface IAppContext {
    apiService: ApiService;
}

const defaultApiService = new ApiService();

const AppContext = createContext<IAppContext>({
    apiService: defaultApiService,
});

export default AppContext;
