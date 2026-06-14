import {
    createTheme,
    extendTheme,
    useTheme,
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import {
    ResolvedThemeMode,
    ThemeDensity,
    ThemePalette,
    DensitySettings,
    AppTheme,
    AppPaletteOptions,
} from 'interfaces/theme';
import { buildDefaultPalette } from 'renderer/theme/themes/defaultTheme';
import { buildSolarizedPalette } from 'renderer/theme/themes/solarizedTheme';
import { buildGitHubPalette } from 'renderer/theme/themes/githubTheme';
import { buildoneDarkPalette } from 'renderer/theme/themes/oneDarkTheme';
import { buildDraculaPalette } from 'renderer/theme/themes/draculaTheme';
import { buildMatchaPalette } from 'renderer/theme/themes/matchaTheme';
import { buildCatppuccinPalette } from 'renderer/theme/themes/catppuccinTheme';

const densityConfig: Record<ThemeDensity, DensitySettings> = {
    normal: {
        mode: 'normal',
        spacingUnit: 8,
        table: {
            headerHeight: 'inherit',
            headerLineHeight: 'inherit',
            cellPadding: 1,
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
            headerHeight: '35px',
            headerLineHeight: 'normal',
            cellPadding: 0.2,
            fontSize: 12,
            rowSize: 22,
            rowNumberFontSize: 10,
            rowNumberPadding: 0.2,
            rowNumberWidth: 40,
            overscanRows: 25,
        },
        drawer: {
            widthCollapsed: 60,
            widthExpanded: 200,
        },
        toolbarHeight: 56,
    },
};

const paletteBuilders: Record<
    ThemePalette,
    (theme: MuiTheme, mode: ResolvedThemeMode) => AppPaletteOptions
> = {
    normal: buildDefaultPalette,
    solarized: buildSolarizedPalette,
    github: buildGitHubPalette,
    oneDark: buildoneDarkPalette,
    dracula: buildDraculaPalette,
    matcha: buildMatchaPalette,
    catppuccin: buildCatppuccinPalette,
};

const buildPalette = (
    theme: MuiTheme,
    mode: ResolvedThemeMode,
    variant: ThemePalette,
): AppPaletteOptions =>
    paletteBuilders[variant]
        ? paletteBuilders[variant](theme, mode)
        : buildDefaultPalette(theme, mode);

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
