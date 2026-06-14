const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
};

export const compositeOverBackground = (
    foregroundHex: string,
    alpha: number,
    backgroundHex: string,
): string => {
    const fg = hexToRgb(foregroundHex);
    const bg = hexToRgb(backgroundHex);
    const r = Math.round(fg.r * alpha + bg.r * (1 - alpha));
    const g = Math.round(fg.g * alpha + bg.g * (1 - alpha));
    const b = Math.round(fg.b * alpha + bg.b * (1 - alpha));
    return `rgb(${r}, ${g}, ${b})`;
};
