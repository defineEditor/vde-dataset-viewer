import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildGitHubGrey = (mode: ResolvedThemeMode): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#22272e',
            100: '#2d333b',
            200: '#373e47',
            300: '#444c56',
            400: '#545d68',
            500: '#636e7b',
            600: '#768390',
            700: '#909dab',
            800: '#adbac7',
            900: '#cdd9e5',
            A100: '#57ab5a',
            A200: '#539bf5',
            A400: '#986ee2',
            A700: '#c69026',
        };
    }

    return {
        50: '#ffffff',
        100: '#f6f8fa',
        200: '#e1e4e8',
        300: '#d0d7de',
        400: '#b0b8c1',
        500: '#8b949e',
        600: '#59636e',
        700: '#3d444d',
        800: '#252a30',
        900: '#1f2328',
        A100: '#1a7f37',
        A200: '#0969da',
        A400: '#8250df',
        A700: '#9a6700',
    };
};

const createGitHubPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildGitHubGrey(mode);
    const primary = isDarkMode ? '#539bf5' : '#0969da';
    const secondary = isDarkMode ? '#986ee2' : '#8250df';
    const info = primary;
    const warning = isDarkMode ? '#c69026' : '#9a6700';
    const success = isDarkMode ? '#57ab5a' : '#1a7f37';
    const error = isDarkMode ? '#e5534b' : '#cf222e';
    const textPrimary = isDarkMode ? themeGrey[900] : themeGrey[900];
    const textSecondary = isDarkMode ? themeGrey[600] : themeGrey[600];
    const subtleSurface = isDarkMode ? themeGrey[200] : themeGrey[100];
    const chromeSurface = themeGrey[200];
    const backgroundDefault = themeGrey[50];
    const edgeColor = themeGrey[400];

    return {
        primary: { main: primary },
        secondary: { main: secondary },
        info: { main: info },
        warning: { main: warning },
        success: { main: success },
        error: { main: error },
        divider: alpha(edgeColor, isDarkMode ? 0.46 : 0.28),
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? 'radial-gradient(circle farthest-corner at bottom center, #2d333b, #22272e)'
                : 'radial-gradient(circle farthest-corner at bottom center, #f6f8fa, #ffffff)',
        },
        table: {
            header: subtleSurface,
            headerTextColor: textPrimary,
            rowNumber: subtleSurface,
            highlightedCell: compositeOverBackground(
                info,
                isDarkMode ? 0.28 : 0.18,
                backgroundDefault,
            ),
            annotatedCell: compositeOverBackground(
                warning,
                isDarkMode ? 0.26 : 0.16,
                backgroundDefault,
            ),
            annotatedBorder: compositeOverBackground(
                warning,
                isDarkMode ? 0.62 : 0.42,
                backgroundDefault,
            ),
            highlightedAnnotatedCell: compositeOverBackground(
                warning,
                isDarkMode ? 0.48 : 0.32,
                backgroundDefault,
            ),
            highlightedAnnotatedBorder: compositeOverBackground(
                warning,
                isDarkMode ? 0.72 : 0.52,
                backgroundDefault,
            ),
            pinShadow: alpha('#1c2128', isDarkMode ? 0.65 : 0.18),
            resizeHandle: alpha(edgeColor, isDarkMode ? 0.7 : 0.45),
        },
        text: {
            primary: textPrimary,
            secondary: textSecondary,
            muted: alpha(textPrimary, 0.6),
        },
        background: {
            default: backgroundDefault,
            paper: backgroundDefault,
            subtle: subtleSurface,
            chrome: chromeSurface,
            toolbar: backgroundDefault,
        },
        scrollbar: {
            thumb: alpha(themeGrey[400], isDarkMode ? 0.92 : 0.88),
            track: alpha(edgeColor, isDarkMode ? 0.26 : 0.16),
        },
    };
};

export const buildGitHubPalette = (_theme: MuiTheme, mode: ResolvedThemeMode) =>
    createGitHubPalette(mode);
