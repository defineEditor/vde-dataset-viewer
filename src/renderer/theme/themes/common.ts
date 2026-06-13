import { grey } from '@mui/material/colors';
import { ResolvedThemeMode } from 'interfaces/theme';

export const buildDefaultGrey = (
    mode: ResolvedThemeMode,
): Record<string, string> => {
    const themeGrey = {} as Record<string, string>;

    if (mode === 'dark') {
        themeGrey[50] = grey[900];
        themeGrey[100] = grey[800];
        themeGrey[200] = grey[700];
        themeGrey[300] = grey[600];
        themeGrey[400] = grey[500];
        themeGrey[500] = grey[400];
        themeGrey[600] = grey[300];
        themeGrey[700] = grey[200];
        themeGrey[800] = grey[100];
        themeGrey[900] = grey[50];
        themeGrey.A100 = grey.A700;
        themeGrey.A200 = grey.A400;
        themeGrey.A400 = grey.A200;
        themeGrey.A700 = grey.A100;
        return themeGrey;
    }

    Object.assign(themeGrey, grey);
    return themeGrey;
};

export const buildSolarizedGrey = (
    mode: ResolvedThemeMode,
): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#002b36',
            100: '#073642',
            200: '#0f3b46',
            300: '#184955',
            400: '#35616d',
            500: '#586e75',
            600: '#657b83',
            700: '#839496',
            800: '#93a1a1',
            900: '#eee8d5',
            A100: '#2aa198',
            A200: '#268bd2',
            A400: '#6c71c4',
            A700: '#859900',
        };
    }

    return {
        50: '#fdf6e3',
        100: '#f5efdc',
        200: '#eee8d5',
        300: '#e3dcc8',
        400: '#d0cab8',
        500: '#b8b29f',
        600: '#93a1a1',
        700: '#839496',
        800: '#657b83',
        900: '#586e75',
        A100: '#2aa198',
        A200: '#268bd2',
        A400: '#6c71c4',
        A700: '#859900',
    };
};
