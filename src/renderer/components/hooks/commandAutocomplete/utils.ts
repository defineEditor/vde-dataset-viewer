export const getActiveSegment = (
    value: string,
): { segment: string; start: number } => {
    const segment = value.split(';').pop() || '';
    return {
        segment,
        start: value.length - segment.length,
    };
};

export const filterOptions = (
    options: string[],
    search: string,
    fullSearch: boolean = false,
): string[] => {
    const normalizedSearch = search.toLowerCase();
    if (normalizedSearch === '') {
        return options;
    }

    const filteredOptions = options.filter((option) =>
        fullSearch
            ? option.toLowerCase().includes(normalizedSearch)
            : option.toLowerCase().startsWith(normalizedSearch),
    );

    // We do not want to show the dropdown if there is only one option and it exactly matches the search (case-insensitive)
    if (
        filteredOptions.length === 1 &&
        filteredOptions[0].toLowerCase() === normalizedSearch
    ) {
        return [];
    }

    return filteredOptions;
};

export const tokenizeQuotedText = (value: string): string[] => {
    const matches = value.match(/"([^"]*)"|'([^']*)'|(\S+)/g);
    return matches || [];
};

export const getColumnName = (
    columns: string[],
    rawValue: string,
): string | null => {
    const normalizedValue = rawValue.toLowerCase();
    return (
        columns.find((column) => column.toLowerCase() === normalizedValue) ||
        null
    );
};

export const isNumericToken = (value: string): boolean => {
    return /^\d[\d.,]*$/.test(value.trim());
};

export const formatFilterValueOption = (
    value: string | number | boolean | null,
    useQuotes: boolean,
): string => {
    if (value === null) {
        return 'null';
    }

    if (typeof value === 'boolean' || typeof value === 'number' || !useQuotes) {
        return String(value);
    }

    const stringValue = String(value);
    if (stringValue === '') {
        return "''";
    }

    if (stringValue.includes("'")) {
        return `"${stringValue.replace(/"/g, '\\"')}"`;
    }

    return `'${stringValue}'`;
};
