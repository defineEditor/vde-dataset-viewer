import { createContext } from 'react';
import ApiService from 'renderer/services/ApiService';

export interface IAppContext {
    apiService: ApiService;
}

const apiService = new ApiService('local');

const defaultAppContext: IAppContext = {
    apiService,
};

const AppContext = createContext<IAppContext>(defaultAppContext);

export default AppContext;
