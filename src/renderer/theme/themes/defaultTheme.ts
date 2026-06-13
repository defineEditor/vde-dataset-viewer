import { alpha } from '@mui/material/styles';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { buildDefaultGrey } from './common';

const createDefaultPalette = (
    theme: MuiTheme,
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    const isDarkMode = mode === 'dark';
    const themeGrey = buildDefaultGrey(mode);
    const subtleSurface = themeGrey[100];
    const chromeSurface = themeGrey[200];

    return {
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? 'radial-gradient(circle farthest-corner at bottom center, #263238, #37474f30)'
                : 'radial-gradient(circle farthest-corner at bottom center, #eeeeee, #e5e4e4)',
            logo: isDarkMode
                ? 'radial-gradient(circle farthest-corner at right,#757575,#bdbdbd)'
                : 'radial-gradient(circle farthest-corner at right,#eeeeee,#c4c4c4)',
        },
        table: {
            header: subtleSurface,
            rowNumber: subtleSurface,
            highlightedCell: alpha(
                theme.palette.info.main,
                isDarkMode ? 0.32 : 0.22,
            ),
            annotatedCell: alpha(
                theme.palette.warning.main,
                isDarkMode ? 0.26 : 0.18,
            ),
            annotatedBorder: alpha(
                theme.palette.warning.main,
                isDarkMode ? 0.72 : 0.48,
            ),
            highlightedAnnotatedCell: alpha(
                theme.palette.warning.main,
                isDarkMode ? 0.56 : 0.44,
            ),
            highlightedAnnotatedBorder: alpha(
                theme.palette.warning.main,
                isDarkMode ? 0.82 : 0.56,
            ),
            pinShadow: alpha(
                theme.palette.common.black,
                isDarkMode ? 0.6 : 0.25,
            ),
            resizeHandle: alpha(
                isDarkMode
                    ? theme.palette.common.white
                    : theme.palette.common.black,
                isDarkMode ? 0.65 : 0.5,
            ),
        },
        text: {
            muted: alpha(theme.palette.text.primary, 0.55),
        },
        background: {
            subtle: subtleSurface,
            chrome: chromeSurface,
        },
        scrollbar: {
            thumb: alpha(theme.palette.grey[900], isDarkMode ? 0.36 : 0.24),
            track: alpha(theme.palette.grey[50], isDarkMode ? 0.12 : 0.08),
        },
    };
};

export const buildDefaultPalette = (theme: MuiTheme, mode: ResolvedThemeMode) =>
    createDefaultPalette(theme, mode);
