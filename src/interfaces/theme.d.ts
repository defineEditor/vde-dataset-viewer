export type ThemeModePreference = 'system' | 'light' | 'dark';

export type ResolvedThemeMode = Exclude<ThemeModePreference, 'system'>;

export type ThemeDensity = 'comfortable' | 'compact';
