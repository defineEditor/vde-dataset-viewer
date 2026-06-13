import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { buildDefaultGrey } from './common';

const createGitHubPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildDefaultGrey(mode);
    const primary = isDarkMode ? '#58a6ff' : '#0969da';
    const secondary = isDarkMode ? '#3fb950' : '#1a7f37';
    const info = primary;
    const warning = isDarkMode ? '#d29922' : '#9a6700';
    const success = secondary;
    const error = isDarkMode ? '#f85149' : '#cf222e';
    const textPrimary = isDarkMode ? '#c9d1d9' : '#24292f';
    const textSecondary = isDarkMode ? '#8b949e' : '#57606a';
    const subtleSurface = isDarkMode ? '#161b22' : '#f6f8fa';
    const chromeSurface = isDarkMode ? '#21262d' : '#eaeef2';
    const backgroundDefault = isDarkMode ? '#0d1117' : '#ffffff';
    const edgeColor = isDarkMode ? '#30363d' : '#d0d7de';

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
                ? 'radial-gradient(circle farthest-corner at bottom center, #161b22, #0d1117)'
                : 'radial-gradient(circle farthest-corner at bottom center, #f6f8fa, #ffffff)',
            logo: isDarkMode
                ? 'radial-gradient(circle farthest-corner at right, #58a6ff, #0d1117)'
                : 'radial-gradient(circle farthest-corner at right, #0969da, #ffffff)',
        },
        table: {
            header: subtleSurface,
            rowNumber: subtleSurface,
            highlightedCell: alpha(info, isDarkMode ? 0.28 : 0.18),
            annotatedCell: alpha(warning, isDarkMode ? 0.26 : 0.16),
            annotatedBorder: alpha(warning, isDarkMode ? 0.62 : 0.42),
            highlightedAnnotatedCell: alpha(warning, isDarkMode ? 0.48 : 0.32),
            highlightedAnnotatedBorder: alpha(
                warning,
                isDarkMode ? 0.72 : 0.52,
            ),
            pinShadow: alpha('#0d1117', isDarkMode ? 0.65 : 0.18),
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
        },
        scrollbar: {
            thumb: alpha(edgeColor, isDarkMode ? 0.32 : 0.18),
            track: alpha(edgeColor, isDarkMode ? 0.12 : 0.06),
        },
    };
};

export const buildGitHubPalette = (_theme: MuiTheme, mode: ResolvedThemeMode) =>
    createGitHubPalette(mode);
