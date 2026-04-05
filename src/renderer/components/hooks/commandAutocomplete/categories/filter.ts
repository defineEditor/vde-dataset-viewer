import {
    booleanOperators,
    numberOperators,
    stringOperators,
    operatorLabels,
} from 'js-array-filter';
import type {
    CategoryAutocompleteParams,
    CommandAutocompleteState,
} from 'renderer/components/hooks/commandAutocomplete/types';
import {
    filterOptions,
    getColumnName,
    tokenizeQuotedText,
} from 'renderer/components/hooks/commandAutocomplete/utils';

const FILTER_CONNECTORS = ['and', 'or'];
const FILTER_COMPARATORS = {
    numeric: numberOperators.map((op) =>
        (operatorLabels[op] || op).toLowerCase(),
    ),
    string: stringOperators.map((op) =>
        (operatorLabels[op] || op).toLowerCase(),
    ),
    boolean: booleanOperators.map((op) =>
        (operatorLabels[op] || op).toLowerCase(),
    ),
};

export const getFilterAutocomplete = ({
    allColumnNames,
    columnTypes,
    context,
    uniqueValueOptions,
    allValuesColumns,
}: CategoryAutocompleteParams): CommandAutocompleteState | null => {
    if (context.category !== 'filter') {
        return null;
    }

    const trimmedFilter = context.activeText.trimStart();
    if (trimmedFilter === '') {
        return {
            options: allColumnNames,
            replaceStart: context.sourceText.length,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId: '',
            tokenType: 'column',
        };
    }

    const filterTokens = tokenizeQuotedText(trimmedFilter);
    const endsWithSpace = /\s$/.test(trimmedFilter);
    const normalizedTokens = filterTokens.map((token) => token.toLowerCase());
    const lastConnectorIndex = normalizedTokens.reduce(
        (latestIndex, token, index) =>
            FILTER_CONNECTORS.includes(token) ? index : latestIndex,
        -1,
    );
    const conditionTokens = filterTokens.slice(lastConnectorIndex + 1);
    const lastToken = filterTokens[filterTokens.length - 1] || '';
    const currentFilterToken = endsWithSpace ? '' : lastToken;
    const separatorPrefix = currentFilterToken.match(/^[(),]+/)?.[0] || '';
    const currentFilterPrefix = currentFilterToken
        .replace(/^[(),]+/, '')
        .replace(/^["']/, '')
        .toLowerCase();
    const replaceStart =
        context.sourceText.length -
        currentFilterToken.length +
        separatorPrefix.length;

    if (FILTER_CONNECTORS.includes(lastToken.toLowerCase()) && !endsWithSpace) {
        return {
            options: filterOptions(FILTER_CONNECTORS, currentFilterPrefix),
            replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId: '',
            tokenType: 'connector',
        };
    }

    if (FILTER_CONNECTORS.includes(lastToken.toLowerCase()) && endsWithSpace) {
        return {
            options: allColumnNames,
            replaceStart: context.sourceText.length,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId: '',
            tokenType: 'column',
        };
    }

    if (conditionTokens.length === 0 || conditionTokens.length === 1) {
        if (endsWithSpace && conditionTokens.length === 1) {
            const columnId = getColumnName(allColumnNames, conditionTokens[0]);
            if (!columnId) {
                return null;
            }

            return {
                options: FILTER_COMPARATORS[columnTypes[columnId] || 'string'],
                replaceStart: context.sourceText.length,
                replaceEnd: context.sourceText.length,
                insertSuffix: ' ',
                columnId,
                tokenType: 'column',
            };
        }

        return {
            options: filterOptions(allColumnNames, currentFilterPrefix),
            replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId: '',
            tokenType: 'column',
        };
    }

    if (conditionTokens.length === 2) {
        const columnId = getColumnName(allColumnNames, conditionTokens[0]);
        if (!columnId) {
            return null;
        }

        if (endsWithSpace) {
            const updatedUniqueValueOptions = { ...uniqueValueOptions };
            if (
                allValuesColumns &&
                !allValuesColumns.includes(columnId) &&
                updatedUniqueValueOptions[columnId] !== undefined
            ) {
                updatedUniqueValueOptions[columnId] = [
                    '_show_all_values_',
                    ...updatedUniqueValueOptions[columnId],
                ];
            }
            return {
                options: updatedUniqueValueOptions[columnId] || [],
                replaceStart: context.sourceText.length,
                replaceEnd: context.sourceText.length,
                insertSuffix: '',
                columnId,
                tokenType: 'value',
                loadingColumnId:
                    updatedUniqueValueOptions[columnId] === undefined
                        ? columnId
                        : undefined,
            };
        }

        return {
            options: filterOptions(
                FILTER_COMPARATORS[columnTypes[columnId] || 'string'],
                currentFilterPrefix,
            ),
            replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId,
            tokenType: 'operator',
        };
    }

    const columnId = getColumnName(allColumnNames, conditionTokens[0]);
    if (!columnId) {
        return null;
    }

    const updatedUniqueValueOptions = { ...uniqueValueOptions };
    if (
        allValuesColumns &&
        !allValuesColumns.includes(columnId) &&
        updatedUniqueValueOptions[columnId] !== undefined
    ) {
        updatedUniqueValueOptions[columnId] = [
            '_show_all_values_',
            ...updatedUniqueValueOptions[columnId],
        ];
    }

    const comparator = conditionTokens[1].toLowerCase();
    if (comparator === 'in' || comparator === 'notin') {
        return {
            options: filterOptions(
                updatedUniqueValueOptions[columnId] || [],
                currentFilterPrefix,
            ),
            replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId,
            tokenType: 'value',
            loadingColumnId:
                updatedUniqueValueOptions[columnId] === undefined
                    ? columnId
                    : undefined,
        };
    }

    if (conditionTokens.length === 3 && !endsWithSpace) {
        return {
            options: filterOptions(
                updatedUniqueValueOptions[columnId] || [],
                currentFilterPrefix,
            ),
            replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ' ',
            columnId,
            tokenType: 'value',
            loadingColumnId:
                updatedUniqueValueOptions[columnId] === undefined
                    ? columnId
                    : undefined,
        };
    }

    return {
        options: filterOptions(FILTER_CONNECTORS, currentFilterPrefix),
        replaceStart,
        replaceEnd: context.sourceText.length,
        insertSuffix: ' ',
        columnId: '',
        tokenType: 'connector',
    };
};
