export type ThemeModePreference = 'system' | 'light' | 'dark';
export type ThemePalette = 'normal' | 'solarized';

export type ResolvedThemeMode = Exclude<ThemeModePreference, 'system'>;

export type ThemeDensity = 'normal' | 'compact';
