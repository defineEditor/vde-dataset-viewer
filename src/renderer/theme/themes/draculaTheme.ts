import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import type { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildDraculaGrey = (mode: ResolvedThemeMode): Record<string, string> => {
    if (mode === 'dark') {
        return {
            50: '#212121',
            100: '#424242',
            200: '#616161',
            300: '#757575',
            400: '#9e9e9e',
            500: '#bdbdbd',
            600: '#e0e0e0',
            700: '#eeeeee',
            800: '#f5f5f5',
            900: '#fafafa',
            A100: '#50FA7B',
            A200: '#8BE9FD',
            A400: '#BD93F9',
            A700: '#FFB86C',
        };
    }

    return {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
        A100: '#2E8B57',
        A200: '#1F6FEB',
        A400: '#6F42C1',
        A700: '#B87700',
    };
};

const createDraculaPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildDraculaGrey(mode);
    const primary = isDarkMode ? '#BD93F9' : '#6F42C1';
    const secondary = isDarkMode ? '#FF79C6' : '#C724B1';
    const info = isDarkMode ? '#8BE9FD' : '#1F6FEB';
    const warning = isDarkMode ? '#FFB86C' : '#B87700';
    const success = isDarkMode ? '#50FA7B' : '#2E8B57';
    const error = isDarkMode ? '#FF5555' : '#D7263D';
    const textPrimary = isDarkMode ? '#F8F8F2' : themeGrey[900];
    const textSecondary = isDarkMode ? '#6272A4' : themeGrey[700];
    const backgroundDefault = isDarkMode ? '#282A36' : themeGrey[50];
    const subtleSurface = isDarkMode ? '#343746' : themeGrey[100];
    const chromeSurface = isDarkMode ? '#21222C' : themeGrey[200];
    const toolbarSurface = isDarkMode ? '#2e2b40' : themeGrey[100];
    const edgeColor = isDarkMode ? '#44475A' : themeGrey[300];

    return {
        primary: { main: primary },
        secondary: { main: secondary },
        info: { main: info },
        warning: { main: warning },
        success: { main: success },
        error: { main: error },
        divider: alpha(edgeColor, isDarkMode ? 0.42 : 0.22),
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? 'radial-gradient(circle farthest-corner at bottom center, #343746, #282a36)'
                : 'radial-gradient(circle farthest-corner at bottom center, #f5f5f7, #ffffff)',
        },
        table: {
            header: subtleSurface,
            headerTextColor: primary,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.22 : 0.14),
            highlightedPinnedCell: compositeOverBackground(
                info,
                isDarkMode ? 0.22 : 0.14,
                backgroundDefault,
            ),
            annotatedCell: alpha(warning, isDarkMode ? 0.24 : 0.14),
            annotatedBorder: alpha(warning, isDarkMode ? 0.6 : 0.38),
            highlightedAnnotatedCell: alpha(warning, isDarkMode ? 0.46 : 0.3),
            highlightedAnnotatedBorder: alpha(warning, isDarkMode ? 0.7 : 0.45),
            pinShadow: alpha('#191a21', isDarkMode ? 0.62 : 0.16),
            resizeHandle: alpha(edgeColor, isDarkMode ? 0.62 : 0.4),
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
            toolbar: toolbarSurface,
        },
        scrollbar: {
            thumb: alpha(themeGrey[400], isDarkMode ? 0.78 : 0.79),
            track: alpha(edgeColor, isDarkMode ? 0.2 : 0.24),
        },
    };
};

export const buildDraculaPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createDraculaPalette(mode);
