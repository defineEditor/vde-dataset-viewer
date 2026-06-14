import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildMatchaGrey = (mode: ResolvedThemeMode): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#1c2427',
            100: '#273136',
            200: '#323e45',
            300: '#3a474f',
            400: '#4a5a62',
            500: '#5a6c74',
            600: '#6c7d85',
            700: '#83948f',
            800: '#a5b5aa',
            900: '#D1DED3',
            A100: '#A4B07E',
            A200: '#7EB0A3',
            A400: '#8A7EB0',
            A700: '#C0AE69',
        };
    }

    return {
        50: '#FAF6F0',
        100: '#F0EBE2',
        200: '#E5DFD4',
        300: '#D9D2C5',
        400: '#C5BDAE',
        500: '#B0A899',
        600: '#9A9285',
        700: '#80776C',
        800: '#665E55',
        900: '#4D473F',
        A100: '#C2CFA8',
        A200: '#A5D0C6',
        A400: '#B8ADD4',
        A700: '#D6C68F',
    };
};

const createMatchaPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildMatchaGrey(mode);
    const primary = '#A4B07E';
    const secondary = '#D9D4B8';
    const info = '#7EB0A3';
    const warning = isDarkMode ? '#C0AE69' : '#BCA04D';
    const success = '#A4B07E';
    const error = isDarkMode ? '#C6A685' : '#B8926E';
    const textPrimary = isDarkMode ? themeGrey[900] : themeGrey[900];
    const textSecondary = isDarkMode ? themeGrey[700] : themeGrey[700];
    const subtleSurface = themeGrey[200];
    const chromeSurface = themeGrey[300];
    const backgroundDefault = themeGrey[50];
    const edgeColor = isDarkMode ? themeGrey[600] : themeGrey[500];

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
                ? 'radial-gradient(circle farthest-corner at bottom center, #323e45, #1c2427)'
                : 'radial-gradient(circle farthest-corner at bottom center, #E5DFD4, #FAF6F0)',
        },
        table: {
            header: themeGrey.A100,
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
            pinShadow: alpha('#0f1517', isDarkMode ? 0.72 : 0.24),
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

export const buildMatchaPalette = (_theme: MuiTheme, mode: ResolvedThemeMode) =>
    createMatchaPalette(mode);
