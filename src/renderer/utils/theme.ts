import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        secondary: {
            light: '#F44336',
            main: '#FF7961',
            dark: '#BA000D',
        },
        text: {
            primary: '#222222',
            secondary: '#AA2266',
            disabled: '#C4C4C4',
        },
        background: {
            paper: '#FFF',
            default: '#e0e0e0',
        },
    },
});

export default theme;
