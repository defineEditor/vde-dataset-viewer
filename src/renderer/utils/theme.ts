import { createTheme } from '@mui/material/styles';

const baseObj = {
    palette: {
        secondary: {
            light: '#F44336',
            main: '#FF7961',
            dark: '#BA000D',
        },
        text: {
            primary: '#222222',
            secondary: '#222222',
            disabled: '#C4C4C4',
        },
        background: {
            paper: '#FFF',
            default: '#e0e0e0',
        },
    },
};

export const theme = createTheme({
    ...baseObj,
});

export const themeWithoutAnimation = createTheme({
    ...baseObj,
    transitions: {
        // So we have `transition: none;` everywhere
        create: () => 'none',
    },
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiButton: {
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiIconButton: {
            defaultProps: {
                disableRipple: true,
            },
        },
    },
});
