import {
    alpha,
    createTheme,
    darken,
    lighten,
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import { amber, blue, grey, red } from '@mui/material/colors';
import {
    ResolvedThemeMode,
    ThemeDensity,
    ThemeModePreference,
} from 'interfaces/theme';

interface DensityTokens {
    mode: ThemeDensity;
    spacingUnit: number;
    tableHeaderHeight: number;
    toolbarHeight: number;
}

export interface AppThemeTokens {
    density: DensityTokens;
    gradients: {
        tabStrip: string;
        logo: string;
        dragFollower: string;
    };
    surfaces: {
        subtle: string;
        chrome: string;
        raised: string;
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
        onPrimary: string;
    };
}

declare module '@mui/material/styles' {
    interface Theme {
        appTheme: AppThemeTokens;
    }

    interface ThemeOptions {
        appTheme?: AppThemeTokens;
    }
}

const DENSITY_TOKENS: Record<ThemeDensity, DensityTokens> = {
    comfortable: {
        mode: 'comfortable',
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

const buildPalette = (
    mode: ResolvedThemeMode,
): NonNullable<MuiThemeOptions['palette']> => {
    if (mode === 'dark') {
        return {
            mode,
            primary: {
                light: blue[200],
                main: blue[300],
                dark: blue[100],
                contrastText: '#081a2c',
            },
            secondary: {
                light: red[200],
                main: red[300],
                dark: red[100],
                contrastText: '#2a0808',
            },
            info: {
                light: blue[100],
                main: blue[200],
                dark: blue[300],
            },
            warning: {
                light: amber[200],
                main: amber[300],
                dark: amber[100],
            },
            background: {
                default: '#0f1722',
                paper: '#182130',
            },
            text: {
                primary: '#edf2f7',
                secondary: 'rgba(237, 242, 247, 0.72)',
                disabled: 'rgba(237, 242, 247, 0.42)',
            },
            divider: 'rgba(237, 242, 247, 0.12)',
        };
    }

    return {
        mode,
        primary: {
            light: blue[500],
            main: blue[700],
            dark: blue[900],
            contrastText: '#ffffff',
        },
        secondary: {
            light: red[500],
            main: red[400],
            dark: red[900],
            contrastText: '#ffffff',
        },
        info: {
            light: blue[200],
            main: blue[400],
            dark: blue[700],
        },
        warning: {
            light: amber[200],
            main: amber[500],
            dark: amber[800],
        },
        background: {
            default: grey[200],
            paper: '#ffffff',
        },
        text: {
            primary: '#222222',
            secondary: 'rgba(34, 34, 34, 0.72)',
            disabled: 'rgba(34, 34, 34, 0.4)',
        },
        divider: 'rgba(15, 23, 34, 0.12)',
    };
};

const buildThemeTokens = (
    theme: MuiTheme,
    mode: ResolvedThemeMode,
    density: DensityTokens,
): AppThemeTokens => {
    const subtleSurface =
        mode === 'dark'
            ? lighten(theme.palette.background.paper, 0.04)
            : '#f4f4f4';
    const chromeSurface =
        mode === 'dark'
            ? darken(theme.palette.background.default, 0.08)
            : grey[100];

    return {
        density,
        gradients: {
            tabStrip:
                mode === 'dark'
                    ? `radial-gradient(circle farthest-corner at bottom center, ${lighten(theme.palette.background.paper, 0.08)}, ${darken(theme.palette.background.default, 0.08)})`
                    : 'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
            logo:
                mode === 'dark'
                    ? `radial-gradient(circle farthest-corner at right, ${lighten(theme.palette.background.paper, 0.12)}, ${darken(theme.palette.background.default, 0.02)})`
                    : 'radial-gradient(circle farthest-corner at right,#eeeeee,#c4c4c4)',
            dragFollower:
                'radial-gradient(circle at 30% 30%, #ffeb3b, #ffc107, #ff9800)',
        },
        surfaces: {
            subtle: subtleSurface,
            chrome: chromeSurface,
            raised: theme.palette.background.paper,
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
            onPrimary: theme.palette.primary.contrastText,
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
    mode: ResolvedThemeMode;
    density?: ThemeDensity;
    disableAnimation?: boolean;
}

export const resolveThemeMode = (
    modePreference: ThemeModePreference,
    prefersDarkMode: boolean,
): ResolvedThemeMode => {
    if (modePreference === 'system') {
        return prefersDarkMode ? 'dark' : 'light';
    }

    return modePreference;
};

export const createAppTheme = ({
    mode,
    density = 'comfortable',
    disableAnimation = false,
}: CreateAppThemeOptions) => {
    const densityTokens = DENSITY_TOKENS[density];

    let theme = createTheme({
        spacing: densityTokens.spacingUnit,
        shape: {
            borderRadius: 8,
        },
        palette: buildPalette(mode),
        components: buildComponents(disableAnimation),
        transitions: disableAnimation
            ? {
                  create: () => 'none',
              }
            : undefined,
    });

    theme = createTheme(theme, {
        appTheme: buildThemeTokens(theme, mode, densityTokens),
    });

    return theme;
};

export const theme = createAppTheme({
    mode: 'light',
});

export const themeWithoutAnimation = createAppTheme({
    mode: 'light',
    disableAnimation: true,
});
