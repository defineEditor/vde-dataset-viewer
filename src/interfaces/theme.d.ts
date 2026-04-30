import { Theme } from '@mui/material/styles';

export type ThemeModePreference = 'system' | 'light' | 'dark';
export type ThemePalette = 'normal' | 'solarized';

export type ResolvedThemeMode = Exclude<ThemeModePreference, 'system'>;

export type ThemeDensity = 'normal' | 'compact';

export interface DensitySettings {
    mode: ThemeDensity;
    spacingUnit: number;
    table: {
        tableHeaderHeight: string;
        tableCellPadding: number;
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
