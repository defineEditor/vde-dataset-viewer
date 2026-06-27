import { Theme, ThemeOptions } from '@mui/material/styles';

export type ThemeModePreference = 'system' | 'light' | 'dark';
export type ThemePalette =
    | 'normal'
    | 'solarized'
    | 'github'
    | 'oneDark'
    | 'dracula'
    | 'matcha'
    | 'catppuccin';

export type ResolvedThemeMode = Exclude<ThemeModePreference, 'system'>;

export type ThemeDensity = 'normal' | 'compact';

export interface DensitySettings {
    mode: ThemeDensity;
    spacingUnit: number;
    table: {
        headerHeight: string;
        headerLineHeight: string;
        cellPadding: number;
        fontSize: number;
        rowSize: number;
        rowNumberFontSize: string | number;
        rowNumberPadding: number;
        rowNumberWidth: number;
        overscanRows: number;
    };
    drawer: {
        widthCollapsed: number;
        widthExpanded: number;
    };
    toolbarHeight: number;
}

export interface AppTheme extends Theme {
    densitySettings: DensitySettings;
}

export interface ThemeGradients {
    tabStrip: string;
}

export interface ThemeTablePalette {
    header: string;
    headerTextColor: string;
    rowNumber: string;
    highlightedCell: string;
    annotatedCell: string;
    annotatedBorder: string;
    highlightedAnnotatedCell: string;
    highlightedAnnotatedBorder: string;
    pinShadow: string;
    resizeHandle: string;
}

export type AppPaletteOptions = NonNullable<ThemeOptions['palette']>;

declare module '@mui/material/styles/createPalette' {
    interface TypeBackground {
        subtle: string;
        chrome: string;
        toolbar: string;
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
