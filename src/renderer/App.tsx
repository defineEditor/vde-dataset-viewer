import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme, resolveThemeMode } from 'renderer/utils/theme';
import Main from 'renderer/components/Main';
import Snackbar from 'renderer/components/Snackbar';
import Modal from 'renderer/components/Modal';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { Provider } from 'react-redux';
import store from 'renderer/redux/store';
import AppContext from 'renderer/utils/AppContext';
import AppContextProvider from 'renderer/utils/AppContextProvider';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { dehydrateState, safeLoadState } from 'renderer/redux/stateUtils';
import {
    closeAllModals,
    openModal,
    setPathname,
} from 'renderer/redux/slices/ui';
import { modals, paths } from 'misc/constants';
import DragAndDrop from 'renderer/components/DragAndDrop';

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        store.dispatch(closeAllModals());
        store.dispatch(setPathname({ pathname: paths.SELECT }));
        store.dispatch(
            openModal({
                type: modals.ERROR,
                data: { message: error.stack || 'Unknown error' },
            }),
        );
        this.setState({ hasError: false });
    }

    render() {
        const { hasError } = this.state;
        const { children } = this.props;
        if (hasError) {
            return null;
        }
        return children;
    }
}

const AppWithContext: React.FC = () => {
    // Get the store from the context
    const { apiService } = React.useContext(AppContext);
    const dispatch = useAppDispatch();
    const checkForUpdates = useAppSelector(
        (state) => state.settings.other.checkForUpdates,
    );

    const colorMode = useAppSelector((state) => state.settings.other.colorMode);

    const disableUiAnimation = useAppSelector(
        (state) => state.settings.other.disableUiAnimation,
    );

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
        noSsr: true,
    });

    const saveStoreListenerRegistered = React.useRef(false);

    const selectedTheme = React.useMemo(
        () =>
            createAppTheme({
                mode: resolveThemeMode(colorMode, prefersDarkMode),
                disableAnimation: disableUiAnimation,
            }),
        [colorMode, disableUiAnimation, prefersDarkMode],
    );

    useEffect(() => {
        // At app startup load the saved state
        const loadStore = async () => {
            const { reduxStore } = await apiService.loadLocalStore();
            const safeStore = safeLoadState(reduxStore);
            dispatch({ type: 'LOAD_STATE', payload: { store: safeStore } });
        };
        loadStore();
    }, [apiService, dispatch]);

    useEffect(() => {
        // Check for updates
        const checkUpdates = async () => {
            const result = await apiService.checkUpdates();
            if (result.newUpdated) {
                dispatch(openModal({ type: modals.APPUPDATE, data: result }));
            }
        };
        if (checkForUpdates) {
            checkUpdates();
        }
    }, [apiService, dispatch, checkForUpdates]);

    useEffect(() => {
        if (saveStoreListenerRegistered.current) {
            return;
        }

        saveStoreListenerRegistered.current = true;
        window.electron.onSaveStore(async () => {
            const state = dehydrateState(store.getState());
            if (state) {
                await apiService.saveLocalStore({ reduxStore: state });
            }
        });
    }, [apiService]);

    return (
        <ThemeProvider theme={selectedTheme}>
            <CssBaseline />
            <ErrorBoundary>
                <DragAndDrop>
                    <Main />
                    <Snackbar />
                    <Modal />
                </DragAndDrop>
            </ErrorBoundary>
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
