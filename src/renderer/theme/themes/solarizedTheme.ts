import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildSolarizedGrey = (
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

const createSolarizedPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildSolarizedGrey(mode);
    const primary = '#268bd2';
    const secondary = '#2aa198';
    const info = '#268bd2';
    const warning = isDarkMode ? '#cb4b16' : '#b58900';
    const success = '#859900';
    const error = '#dc322f';
    const textPrimary = isDarkMode ? '#93a1a1' : '#586e75';
    const textSecondary = isDarkMode ? '#839496' : '#657b83';
    const subtleSurface = isDarkMode ? '#0f3b46' : '#eee8d5';
    const chromeSurface = isDarkMode ? '#184955' : '#e3dcc8';
    const backgroundDefault = isDarkMode ? '#002b36' : '#fdf6e3';
    const edgeColor = isDarkMode ? '#93a1a1' : '#586e75';

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
                ? 'radial-gradient(circle farthest-corner at bottom center, #0f3b46, #002b36)'
                : 'radial-gradient(circle farthest-corner at bottom center, #fdf6e3, #eee8d5)',
        },
        table: {
            header: subtleSurface,
            headerTextColor: textPrimary,
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
            pinShadow: alpha('#001f27', isDarkMode ? 0.72 : 0.24),
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
            thumb: alpha(edgeColor, isDarkMode ? 0.36 : 0.24),
            track: alpha(edgeColor, isDarkMode ? 0.12 : 0.08),
        },
    };
};

export const buildSolarizedPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createSolarizedPalette(mode);
