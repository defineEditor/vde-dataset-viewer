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

const isEscapedCharacter = (value: string, index: number): boolean => {
    let backslashCount = 0;
    for (
        let cursor = index - 1;
        cursor >= 0 && value[cursor] === '\\';
        cursor -= 1
    ) {
        backslashCount += 1;
    }

    return backslashCount % 2 === 1;
};

const isCompleteFilterValue = (value: string): boolean => {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
        return false;
    }

    const openingQuote = trimmedValue[0];
    if (openingQuote !== '"' && openingQuote !== "'") {
        return true;
    }

    return (
        trimmedValue.length > 1 &&
        trimmedValue.endsWith(openingQuote) &&
        !isEscapedCharacter(trimmedValue, trimmedValue.length - 1)
    );
};

const normalizeFilterValueSearch = (value: string): string => {
    const trimmedValue = value.trimStart();
    if (trimmedValue === '') {
        return '';
    }

    const leadingQuote =
        trimmedValue[0] === '"' || trimmedValue[0] === "'"
            ? trimmedValue[0]
            : null;
    let normalizedValue = leadingQuote ? trimmedValue.slice(1) : trimmedValue;

    if (
        leadingQuote &&
        normalizedValue.endsWith(leadingQuote) &&
        !isEscapedCharacter(normalizedValue, normalizedValue.length - 1)
    ) {
        normalizedValue = normalizedValue.slice(0, -1);
    }

    return normalizedValue.toLowerCase();
};

const matchesConnector = (
    value: string,
    index: number,
    connector: 'and' | 'or',
): boolean => {
    const normalizedValue = value
        .slice(index, index + connector.length)
        .toLowerCase();

    if (normalizedValue !== connector) {
        return false;
    }

    const previousCharacter = value[index - 1];
    const nextCharacter = value[index + connector.length];

    return (
        (previousCharacter === undefined || /\s/.test(previousCharacter)) &&
        (nextCharacter === undefined || /\s/.test(nextCharacter))
    );
};

export const getLastFilterCondition = (value: string): string => {
    let activeQuote: '"' | "'" | null = null;
    let parenthesisDepth = 0;
    let conditionStart = 0;

    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];

        if (
            (character === '"' || character === "'") &&
            !isEscapedCharacter(value, index)
        ) {
            if (activeQuote === character) {
                activeQuote = null;
            } else if (activeQuote === null) {
                activeQuote = character;
            }
        } else if (activeQuote === null) {
            if (character === '(') {
                parenthesisDepth += 1;
            } else if (character === ')' && parenthesisDepth > 0) {
                parenthesisDepth -= 1;
            } else if (parenthesisDepth === 0) {
                if (matchesConnector(value, index, 'and')) {
                    conditionStart = index + 3;
                    index += 2;
                } else if (matchesConnector(value, index, 'or')) {
                    conditionStart = index + 2;
                    index += 1;
                }
            }
        }
    }

    return value.slice(conditionStart).trimStart();
};

export const getInOperatorValueInput = (
    value: string,
): {
    hasOpeningParenthesis: boolean;
    endsWithClosingParenthesis: boolean;
    replaceStart: number;
    currentValueSearch: string;
    selectedValues: string[];
} => {
    const lastCommand = value.split(';').pop() || '';
    const lastCommandStart = value.length - lastCommand.length;
    const operatorMatches = Array.from(
        lastCommand.matchAll(/\b(?:notin|in)\b/gi),
    );
    const operatorMatch = operatorMatches[operatorMatches.length - 1];

    if (!operatorMatch || operatorMatch.index === undefined) {
        return {
            hasOpeningParenthesis: false,
            endsWithClosingParenthesis: false,
            replaceStart: value.length,
            currentValueSearch: '',
            selectedValues: [],
        };
    }

    const operatorEnd = operatorMatch.index + operatorMatch[0].length;
    const textAfterOperator = lastCommand.slice(operatorEnd);
    const textAfterOperatorStart = lastCommandStart + operatorEnd;
    const leadingWhitespaceLength =
        textAfterOperator.length - textAfterOperator.trimStart().length;
    const trimmedValue = textAfterOperator.trimStart();

    if (!trimmedValue.startsWith('(')) {
        return {
            hasOpeningParenthesis: false,
            endsWithClosingParenthesis: false,
            replaceStart: value.length,
            currentValueSearch: '',
            selectedValues: [],
        };
    }

    const valueList = trimmedValue.slice(1);
    const valueListStart = textAfterOperatorStart + leadingWhitespaceLength + 1;
    let activeQuote: '"' | "'" | null = null;
    let currentValue = '';
    let currentValueStart = valueListStart;
    let endsWithClosingParenthesis = false;
    const selectedValues: string[] = [];

    for (let index = 0; index < valueList.length; index += 1) {
        const character = valueList[index];

        if (
            (character === '"' || character === "'") &&
            !isEscapedCharacter(valueList, index)
        ) {
            if (activeQuote === character) {
                activeQuote = null;
            } else if (activeQuote === null) {
                activeQuote = character;
            }
        }

        if (character === ',' && activeQuote === null) {
            if (isCompleteFilterValue(currentValue)) {
                selectedValues.push(currentValue.trim());
            }
            currentValue = '';
            currentValueStart = valueListStart + index + 1;
        } else if (
            character === ')' &&
            activeQuote === null &&
            valueList.slice(index).trim() === ')'
        ) {
            endsWithClosingParenthesis = true;
            if (isCompleteFilterValue(currentValue)) {
                selectedValues.push(currentValue.trim());
            }
            currentValue = '';
            break;
        } else {
            currentValue += character;
        }
    }

    const currentValueLeadingWhitespace =
        currentValue.length - currentValue.trimStart().length;

    return {
        hasOpeningParenthesis: true,
        endsWithClosingParenthesis,
        replaceStart:
            currentValue.trim() === '' || endsWithClosingParenthesis
                ? value.length
                : currentValueStart + currentValueLeadingWhitespace,
        currentValueSearch: endsWithClosingParenthesis
            ? ''
            : normalizeFilterValueSearch(currentValue),
        selectedValues,
    };
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
        return '""';
    }

    if (stringValue.includes('"')) {
        return `"${stringValue.replace(/'/g, "\\'")}"`;
    }

    return `"${stringValue}"`;
};
