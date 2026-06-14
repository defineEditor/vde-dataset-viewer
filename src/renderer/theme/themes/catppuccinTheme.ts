import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildCatppuccinGrey = (
    mode: ResolvedThemeMode,
): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#1e1e2e',
            100: '#181825',
            200: '#313244',
            300: '#45475a',
            400: '#585b70',
            500: '#6c7086',
            600: '#7f849c',
            700: '#9399b2',
            800: '#a6adc8',
            900: '#cdd6f4',
            A100: '#a6e3a1',
            A200: '#89b4fa',
            A400: '#cba6f7',
            A700: '#f9e2af',
        };
    }

    return {
        50: '#eff1f5',
        100: '#e6e9ef',
        200: '#ccd0da',
        300: '#bcc0cc',
        400: '#acb0be',
        500: '#9ca0b0',
        600: '#8c8fa1',
        700: '#7c7f93',
        800: '#6c6f85',
        900: '#4c4f69',
        A100: '#40a02b',
        A200: '#1e66f5',
        A400: '#8839ef',
        A700: '#df8e1d',
    };
};

const createCatppuccinPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildCatppuccinGrey(mode);
    const primary = isDarkMode ? '#89b4fa' : '#b7a0d4';
    const secondary = isDarkMode ? '#cba6f7' : '#7287fd';
    const info = isDarkMode ? '#89dceb' : '#04a5e5';
    const warning = isDarkMode ? '#fab387' : '#fe640b';
    const success = isDarkMode ? '#a6e3a1' : '#40a02b';
    const error = isDarkMode ? '#f38ba8' : '#d20f39';
    const textPrimary = isDarkMode ? themeGrey[900] : themeGrey[900];
    const textSecondary = isDarkMode ? themeGrey[800] : themeGrey[800];
    const subtleSurface = isDarkMode ? themeGrey[200] : themeGrey[100];
    const chromeSurface = themeGrey[300];
    const backgroundDefault = themeGrey[50];
    const edgeColor = isDarkMode ? themeGrey[500] : themeGrey[500];

    return {
        primary: { main: primary },
        secondary: { main: secondary },
        info: { main: info },
        warning: { main: warning },
        success: { main: success },
        error: { main: error },
        divider: alpha(edgeColor, isDarkMode ? 0.36 : 0.24),
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? 'radial-gradient(circle farthest-corner at bottom center, #313244, #1e1e2e)'
                : 'radial-gradient(circle farthest-corner at bottom center, #ccd0da, #eff1f5)',
        },
        table: {
            header: subtleSurface,
            headerTextColor: primary,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.32 : 0.22),
            highlightedPinnedCell: compositeOverBackground(
                info,
                isDarkMode ? 0.32 : 0.22,
                backgroundDefault,
            ),
            annotatedCell: alpha(warning, isDarkMode ? 0.26 : 0.18),
            annotatedBorder: alpha(warning, isDarkMode ? 0.72 : 0.48),
            highlightedAnnotatedCell: alpha(warning, isDarkMode ? 0.56 : 0.44),
            highlightedAnnotatedBorder: alpha(
                warning,
                isDarkMode ? 0.82 : 0.56,
            ),
            pinShadow: alpha('#0f0f17', isDarkMode ? 0.72 : 0.24),
            resizeHandle: alpha(edgeColor, isDarkMode ? 0.7 : 0.45),
        },
        text: {
            primary: textPrimary,
            secondary: textSecondary,
            muted: alpha(textPrimary, 0.55),
        },
        background: {
            default: backgroundDefault,
            paper: backgroundDefault,
            subtle: subtleSurface,
            chrome: chromeSurface,
            toolbar: backgroundDefault,
        },
        scrollbar: {
            thumb: alpha(edgeColor, isDarkMode ? 0.76 : 0.74),
            track: alpha(edgeColor, isDarkMode ? 0.12 : 0.08),
        },
    };
};

export const buildCatppuccinPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createCatppuccinPalette(mode);
