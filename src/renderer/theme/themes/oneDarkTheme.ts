import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { buildDefaultGrey } from './common';

const createoneDarkPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildDefaultGrey(mode);
    const primary = isDarkMode ? '#61afef' : '#2c6dd8';
    const secondary = isDarkMode ? '#98c379' : '#4b6e38';
    const info = primary;
    const warning = isDarkMode ? '#e5c07b' : '#b57c00';
    const success = secondary;
    const error = isDarkMode ? '#e06c75' : '#c43d4d';
    const textPrimary = isDarkMode ? '#abb2bf' : '#2f3640';
    const textSecondary = isDarkMode ? '#5c6370' : '#4b5563';
    const subtleSurface = isDarkMode ? '#2c313a' : '#f3f5f7';
    const chromeSurface = isDarkMode ? '#21252b' : '#e6eaee';
    const backgroundDefault = isDarkMode ? '#282c34' : '#fafbfc';
    const edgeColor = isDarkMode ? '#3b4048' : '#d0d7de';

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
            logo: isDarkMode
                ? 'radial-gradient(circle farthest-corner at right, #61afef, #21252b)'
                : 'radial-gradient(circle farthest-corner at right, #2c6dd8, #fafbfc)',
        },
        table: {
            header: subtleSurface,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.28 : 0.18),
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
        },
        scrollbar: {
            thumb: alpha(edgeColor, isDarkMode ? 0.28 : 0.14),
            track: alpha(edgeColor, isDarkMode ? 0.1 : 0.04),
        },
    };
};

export const buildoneDarkPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createoneDarkPalette(mode);
