import { alpha } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { ResolvedThemeMode } from 'interfaces/theme';
import { compositeOverBackground } from 'renderer/theme/themes/utils';

const buildDefaultGrey = (mode: ResolvedThemeMode): Record<string, string> => {
    const themeGrey = {} as Record<string, string>;

    if (mode === 'dark') {
        themeGrey[50] = grey[900];
        themeGrey[100] = grey[800];
        themeGrey[200] = grey[700];
        themeGrey[300] = grey[600];
        themeGrey[400] = grey[500];
        themeGrey[500] = grey[400];
        themeGrey[600] = grey[300];
        themeGrey[700] = grey[200];
        themeGrey[800] = grey[100];
        themeGrey[900] = grey[50];
        themeGrey.A100 = grey.A700;
        themeGrey.A200 = grey.A400;
        themeGrey.A400 = grey.A200;
        themeGrey.A700 = grey.A100;
        return themeGrey;
    }

    Object.assign(themeGrey, grey);
    return themeGrey;
};

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
        },
        table: {
            header: subtleSurface,
            headerTextColor: theme.palette.text.primary,
            rowNumber: subtleSurface,
            highlightedCell: compositeOverBackground(
                theme.palette.info.main,
                isDarkMode ? 0.32 : 0.22,
                themeGrey[50],
            ),
            annotatedCell: compositeOverBackground(
                theme.palette.warning.main,
                isDarkMode ? 0.26 : 0.18,
                themeGrey[50],
            ),
            annotatedBorder: compositeOverBackground(
                theme.palette.warning.main,
                isDarkMode ? 0.72 : 0.48,
                themeGrey[50],
            ),
            highlightedAnnotatedCell: compositeOverBackground(
                theme.palette.warning.main,
                isDarkMode ? 0.56 : 0.44,
                themeGrey[50],
            ),
            highlightedAnnotatedBorder: compositeOverBackground(
                theme.palette.warning.main,
                isDarkMode ? 0.82 : 0.56,
                themeGrey[50],
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
            toolbar: theme.vars?.palette.background.paper,
        },
        scrollbar: {
            thumb: alpha(theme.palette.grey[500], isDarkMode ? 0.36 : 0.54),
            track: alpha(theme.palette.grey[50], isDarkMode ? 0.12 : 0.08),
        },
    };
};

export const buildDefaultPalette = (theme: MuiTheme, mode: ResolvedThemeMode) =>
    createDefaultPalette(theme, mode);
