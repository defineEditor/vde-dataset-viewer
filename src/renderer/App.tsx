import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'renderer/utils/theme';
import Main from 'renderer/components/Main';
import Snackbar from 'renderer/components/Snackbar';
import Modal from 'renderer/components/Modal';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from 'renderer/redux/store';
import AppContext from 'renderer/utils/AppContext';
import AppContextProvider from 'renderer/utils/AppContextProvider';
import { useAppDispatch } from 'renderer/redux/hooks';
import { dehydrateState, safeLoadState } from 'renderer/redux/stateUtils';
import { openSnackbar } from './redux/slices/ui';

const AppWithContext: React.FC = () => {
    // Get the store from the context
    const { apiService } = React.useContext(AppContext);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // At app startup load the saved state
        const loadStore = async () => {
            const { reduxStore } = await apiService.loadLocalStore();
            const safeStore = safeLoadState(reduxStore);
            dispatch({ type: 'LOAD_STATE', payload: { store: safeStore } });
        };
        loadStore();
        // Check for updates
        const checkUpdates = async () => {
            const result = await apiService.checkUpdates();
            console.log('checkUpdates', result);
            if (result.newUpdated) {
                dispatch(
                    openSnackbar({
                        type: 'info',
                        message: 'New update available',
                    }),
                );
            }
        };
        checkUpdates();
    }, [apiService, dispatch]);

    // Add listener to save the store when the app is closed
    window.electron.onSaveStore(async () => {
        const state = dehydrateState(store.getState());
        if (state) {
            await apiService.saveLocalStore({ reduxStore: state });
        }
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main theme={theme} />
            <Snackbar />
            <Modal />
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    return (
        <AppContextProvider>
            <Provider store={store}>
                <AppWithContext />
            </Provider>
        </AppContextProvider>
    );
};

export default App;
