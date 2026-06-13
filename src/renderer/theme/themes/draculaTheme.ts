import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { buildDefaultGrey } from './common';

const createDraculaPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildDefaultGrey(mode);
    const primary = isDarkMode ? '#bd93f9' : '#6f42c1';
    const secondary = isDarkMode ? '#ff79c6' : '#c724b1';
    const info = isDarkMode ? '#8be9fd' : '#1f6feb';
    const warning = isDarkMode ? '#ffb86c' : '#b87700';
    const success = isDarkMode ? '#50fa7b' : '#2e8b57';
    const error = isDarkMode ? '#ff5555' : '#d7263d';
    const textPrimary = isDarkMode ? '#f8f8f2' : '#282a36';
    const textSecondary = isDarkMode ? '#6272a4' : '#44475a';
    const subtleSurface = isDarkMode ? '#343746' : '#f5f5f7';
    const chromeSurface = isDarkMode ? '#21222c' : '#ececf2';
    const backgroundDefault = isDarkMode ? '#282a36' : '#ffffff';
    const edgeColor = isDarkMode ? '#44475a' : '#d5d7df';

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
            logo: isDarkMode
                ? 'radial-gradient(circle farthest-corner at right, #bd93f9, #21222c)'
                : 'radial-gradient(circle farthest-corner at right, #6f42c1, #ffffff)',
        },
        table: {
            header: subtleSurface,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.22 : 0.14),
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
        },
        scrollbar: {
            thumb: alpha(edgeColor, isDarkMode ? 0.28 : 0.14),
            track: alpha(edgeColor, isDarkMode ? 0.1 : 0.04),
        },
    };
};

export const buildDraculaPalette = (
    _theme: MuiTheme,
    mode: ResolvedThemeMode,
) => createDraculaPalette(mode);
