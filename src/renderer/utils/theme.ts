import {
    alpha,
    createTheme,
    extendTheme,
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { ResolvedThemeMode, ThemeDensity } from 'interfaces/theme';

interface DensityTokens {
    mode: ThemeDensity;
    spacingUnit: number;
    tableHeaderHeight: number;
    toolbarHeight: number;
}

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
    }
}

interface ThemePaletteExtras {
    grey: Record<string, string>;
    gradients: {
        tabStrip: string;
        logo: string;
    };
    table: {
        header: string;
        rowNumber: string;
        highlightedCell: string;
        annotatedCell: string;
        annotatedBorder: string;
        highlightedAnnotatedCell: string;
        highlightedAnnotatedBorder: string;
        pinShadow: string;
        resizeHandle: string;
    };
    text: {
        muted: string;
    };
    background: {
        subtle: string;
        chrome: string;
    };
}

const DENSITY_TOKENS: Record<ThemeDensity, DensityTokens> = {
    normal: {
        mode: 'normal',
        spacingUnit: 8,
        tableHeaderHeight: 40,
        toolbarHeight: 64,
    },
    compact: {
        mode: 'compact',
        spacingUnit: 6,
        tableHeaderHeight: 32,
        toolbarHeight: 56,
    },
};

const buildPaletteExtras = (
    theme: MuiTheme,
    mode: ResolvedThemeMode,
): ThemePaletteExtras => {
    // Invert grey scale for dark mode
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
    } else {
        Object.assign(themeGrey, grey);
    }

    const subtleSurface = themeGrey[100];
    const chromeSurface = themeGrey[200];

    return {
        grey: themeGrey,
        gradients: {
            tabStrip:
                mode === 'dark'
                    ? `radial-gradient(circle farthest-corner at bottom center, #263238, #37474f30)`
                    : 'radial-gradient(circle farthest-corner at bottom center, #eeeeee, #e5e4e4)',
            logo:
                mode === 'dark'
                    ? `radial-gradient(circle farthest-corner at right,#757575,#bdbdbd)`
                    : 'radial-gradient(circle farthest-corner at right,#eeeeee,#c4c4c4)',
        },
        table: {
            header: subtleSurface,
            rowNumber: subtleSurface,
            highlightedCell: alpha(
                theme.palette.info.main,
                mode === 'dark' ? 0.32 : 0.22,
            ),
            annotatedCell: alpha(
                theme.palette.warning.main,
                mode === 'dark' ? 0.26 : 0.18,
            ),
            annotatedBorder: alpha(
                theme.palette.warning.main,
                mode === 'dark' ? 0.72 : 0.48,
            ),
            highlightedAnnotatedCell: alpha(
                theme.palette.warning.main,
                mode === 'dark' ? 0.56 : 0.44,
            ),
            highlightedAnnotatedBorder: alpha(
                theme.palette.warning.main,
                mode === 'dark' ? 0.82 : 0.56,
            ),
            pinShadow: alpha(
                theme.palette.common.black,
                mode === 'dark' ? 0.6 : 0.25,
            ),
            resizeHandle: alpha(
                mode === 'dark'
                    ? theme.palette.common.white
                    : theme.palette.common.black,
                mode === 'dark' ? 0.65 : 0.5,
            ),
        },
        text: {
            muted: alpha(theme.palette.text.primary, 0.55),
        },
        background: {
            subtle: subtleSurface,
            chrome: chromeSurface,
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
    density?: ThemeDensity;
    disableAnimation?: boolean;
}

export const createAppTheme = ({
    density = 'normal',
    disableAnimation = false,
}: CreateAppThemeOptions) => {
    const densityTokens = DENSITY_TOKENS[density];

    const baseTheme = createTheme({
        cssVariables: {
            colorSchemeSelector: 'class',
        },
        defaultColorScheme: 'light',
        spacing: densityTokens.spacingUnit,
        shape: {
            borderRadius: 8,
        },
        components: buildComponents(disableAnimation),
        transitions: disableAnimation
            ? {
                  create: () => 'none',
              }
            : undefined,
        colorSchemes: {
            dark: true,
        },
    });

    return extendTheme(baseTheme, {
        colorSchemes: {
            light: {
                palette: buildPaletteExtras(baseTheme, 'light'),
            },
            dark: {
                palette: buildPaletteExtras(baseTheme, 'dark'),
            },
        },
    });
};

export const theme = createAppTheme({});

export const themeWithoutAnimation = createAppTheme({
    disableAnimation: true,
});
