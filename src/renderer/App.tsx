import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'renderer/utils/theme';
import Main from 'renderer/components/Main';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from 'renderer/redux/store';

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Main />
            </ThemeProvider>
        </Provider>
    );
};

export default App;
