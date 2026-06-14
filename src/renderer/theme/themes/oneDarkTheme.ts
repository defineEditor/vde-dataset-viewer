import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildOneDarkGrey = (mode: ResolvedThemeMode): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#21252b',
            100: '#282c34',
            200: '#2c313a',
            300: '#3b4048',
            400: '#3e4451',
            500: '#495162',
            600: '#5c6370',
            700: '#7f848e',
            800: '#9ca0a8',
            900: '#abb2bf',
            A100: '#98c379',
            A200: '#61afef',
            A400: '#c678dd',
            A700: '#e5c07b',
        };
    }

    return {
        50: '#fafbfc',
        100: '#f3f5f7',
        200: '#e6eaee',
        300: '#d0d7de',
        400: '#b6bec8',
        500: '#9ba3ae',
        600: '#7a838e',
        700: '#5b6570',
        800: '#3d4752',
        900: '#2f3640',
        A100: '#4b6e38',
        A200: '#2c6dd8',
        A400: '#a05fc1',
        A700: '#b57c00',
    };
};

const createoneDarkPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildOneDarkGrey(mode);
    const primary = isDarkMode ? '#61afef' : '#2c6dd8';
    const secondary = isDarkMode ? '#98c379' : '#4b6e38';
    const info = primary;
    const warning = isDarkMode ? '#e5c07b' : '#b57c00';
    const success = secondary;
    const error = isDarkMode ? '#e06c75' : '#c43d4d';
    const textPrimary = themeGrey[900];
    const textSecondary = themeGrey[600];
    const backgroundDefault = isDarkMode ? themeGrey[100] : themeGrey[50];
    const subtleSurface = isDarkMode ? themeGrey[200] : themeGrey[100];
    const chromeSurface = isDarkMode ? themeGrey[50] : themeGrey[200];
    const edgeColor = themeGrey[300];

    return {
        primary: { main: primary },
        secondary: { main: secondary },
        info: { main: info },
        warning: { main: warning },
        success: { main: success },
        error: { main: error },
        divider: alpha(edgeColor, isDarkMode ? 0.42 : 0.24),
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? 'radial-gradient(circle farthest-corner at bottom center, #2c313a, #282c34)'
                : 'radial-gradient(circle farthest-corner at bottom center, #f3f5f7, #fafbfc)',
        },
        table: {
            header: subtleSurface,
            headerTextColor: textPrimary,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.28 : 0.18),
            highlightedPinnedCell: compositeOverBackground(
                info,
                isDarkMode ? 0.28 : 0.18,
                backgroundDefault,
            ),
            annotatedCell: alpha(warning, isDarkMode ? 0.24 : 0.14),
            annotatedBorder: alpha(warning, isDarkMode ? 0.6 : 0.4),
            highlightedAnnotatedCell: alpha(warning, isDarkMode ? 0.44 : 0.32),
            highlightedAnnotatedBorder: alpha(warning, isDarkMode ? 0.7 : 0.5),
            pinShadow: alpha('#1e2127', isDarkMode ? 0.68 : 0.18),
            resizeHandle: alpha(edgeColor, isDarkMode ? 0.65 : 0.42),
        },
        text: {
            primary: textPrimary,
            secondary: textSecondary,
            muted: alpha(textPrimary, 0.56),
        },
        background: {
            default: backgroundDefault,
            paper: backgroundDefault,
            subtle: subtleSurface,
            chrome: chromeSurface,
            toolbar: backgroundDefault,
        },
        scrollbar: {
            thumb: alpha(themeGrey[500], isDarkMode ? 0.88 : 0.84),
            track: alpha(edgeColor, isDarkMode ? 0.2 : 0.24),
        },
    };
};

export const buildoneDarkPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createoneDarkPalette(mode);
