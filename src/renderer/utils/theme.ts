import {
    alpha,
    createTheme,
    extendTheme,
    useTheme,
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import {
    ResolvedThemeMode,
    ThemeDensity,
    ThemePalette,
    DensitySettings,
    AppTheme,
} from 'interfaces/theme';

interface ThemeGradients {
    tabStrip: string;
    logo: string;
}

interface ThemeTablePalette {
    header: string;
    rowNumber: string;
    highlightedCell: string;
    annotatedCell: string;
    annotatedBorder: string;
    highlightedAnnotatedCell: string;
    highlightedAnnotatedBorder: string;
    pinShadow: string;
    resizeHandle: string;
}

declare module '@mui/material/styles/createPalette' {
    interface TypeBackground {
        subtle: string;
        chrome: string;
    }

    interface TypeText {
        muted: string;
    }

    interface Palette {
        gradients: ThemeGradients;
        table: ThemeTablePalette;
    }

    interface PaletteOptions {
        gradients?: Partial<ThemeGradients>;
        table?: Partial<ThemeTablePalette>;
        scrollbar?: {
            thumb: string;
            track: string;
        };
    }
}

type AppPaletteOptions = NonNullable<MuiThemeOptions['palette']>;

const densityConfig: Record<ThemeDensity, DensitySettings> = {
    normal: {
        mode: 'normal',
        spacingUnit: 8,
        table: {
            tableHeaderHeight: 40,
            tableCellPadding: 1,
            fontSize: 14,
            rowSize: 38,
            rowNumberFontSize: 12,
            rowNumberPadding: 0.5,
            rowNumberWidth: 60,
            overscanRows: 15,
        },
        drawer: {
            widthCollapsed: 60,
            widthExpanded: 200,
        },
        toolbarHeight: 64,
    },
    compact: {
        mode: 'compact',
        spacingUnit: 6,
        table: {
            tableHeaderHeight: 32,
            tableCellPadding: 0.2,
            fontSize: 12,
            rowSize: 22,
            rowNumberFontSize: 10,
            rowNumberPadding: 0.2,
            rowNumberWidth: 40,
            overscanRows: 25,
        },
        drawer: {
            widthCollapsed: 0,
            widthExpanded: 200,
        },
        toolbarHeight: 56,
    },
};

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

const buildPalette = (
    theme: MuiTheme,
    mode: ResolvedThemeMode,
    variant: ThemePalette,
): AppPaletteOptions => {
    const isDarkMode = mode === 'dark';
    if (variant === 'solarized') {
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
                logo: isDarkMode
                    ? 'radial-gradient(circle farthest-corner at right, #007e9d, #073642)'
                    : 'radial-gradient(circle farthest-corner at right, #93a1a1, #fdf6e3)',
            },
            table: {
                header: subtleSurface,
                rowNumber: subtleSurface,
                highlightedCell: alpha(info, isDarkMode ? 0.32 : 0.22),
                annotatedCell: alpha(warning, isDarkMode ? 0.26 : 0.18),
                annotatedBorder: alpha(warning, isDarkMode ? 0.72 : 0.48),
                highlightedAnnotatedCell: alpha(
                    warning,
                    isDarkMode ? 0.56 : 0.44,
                ),
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
            },
            scrollbar: {
                thumb: alpha(edgeColor, isDarkMode ? 0.36 : 0.24),
                track: alpha(edgeColor, isDarkMode ? 0.12 : 0.08),
            },
        };
    }

    // Invert grey scale for dark mode
    const themeGrey = buildDefaultGrey(mode);

    const subtleSurface = themeGrey[100];
    const chromeSurface = themeGrey[200];

    return {
        grey: themeGrey,
        gradients: {
            tabStrip: isDarkMode
                ? `radial-gradient(circle farthest-corner at bottom center, #263238, #37474f30)`
                : 'radial-gradient(circle farthest-corner at bottom center, #eeeeee, #e5e4e4)',
            logo: isDarkMode
                ? `radial-gradient(circle farthest-corner at right,#757575,#bdbdbd)`
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

const buildComponents = (
    disableAnimation: boolean,
): MuiThemeOptions['components'] => ({
    MuiButtonBase: {
        defaultProps: {
            disableRipple: disableAnimation,
        },
    },
    MuiButton: {
        defaultProps: {
            disableRipple: disableAnimation,
        },
    },
    MuiIconButton: {
        defaultProps: {
            disableRipple: disableAnimation,
        },
    },
});

export interface CreateAppThemeOptions {
    compactMode?: boolean;
    disableUiAnimation?: boolean;
    themePalette?: ThemePalette;
}

export const createAppTheme = ({
    compactMode = false,
    disableUiAnimation = false,
    themePalette = 'normal',
}: CreateAppThemeOptions) => {
    const density = compactMode ? 'compact' : 'normal';
    const densitySettings = densityConfig[density];

    const baseTheme = createTheme(
        {
            cssVariables: {
                colorSchemeSelector: 'class',
            },
            defaultColorScheme: 'light',
            spacing: densitySettings.spacingUnit,
            shape: {
                borderRadius: 8,
            },
            components: buildComponents(disableUiAnimation),
            transitions: disableUiAnimation
                ? {
                      create: () => 'none',
                  }
                : undefined,
            colorSchemes: {
                light: true,
                dark: true,
            },
        },
        { densitySettings },
    );

    return extendTheme(baseTheme, {
        colorSchemes: {
            light: {
                palette: buildPalette(baseTheme, 'light', themePalette),
            },
            dark: {
                palette: buildPalette(baseTheme, 'dark', themePalette),
            },
        },
    });
};

export const theme = createAppTheme({});

export const useAppTheme = () => useTheme() as AppTheme;

export const themeWithoutAnimation = createAppTheme({
    disableUiAnimation: true,
});
