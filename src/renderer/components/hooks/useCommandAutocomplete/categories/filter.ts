import {
    booleanOperators,
    numberOperators,
    stringOperators,
    operatorLabels,
} from 'js-array-filter';
import type {
    CategoryAutocompleteParams,
    CommandAutocompleteState,
} from 'interfaces/common';
import {
    filterOptions,
    getColumnName,
    getInOperatorValueInput,
    getLastFilterCondition,
    tokenizeQuotedText,
} from 'renderer/components/hooks/useCommandAutocomplete/utils';

const FILTER_CONNECTORS = ['and', 'or'];
const FILTER_COMPARATORS = {
    numeric: numberOperators.map((op) => operatorLabels[op] || op),
    string: stringOperators.map((op) => operatorLabels[op] || op),
    boolean: booleanOperators.map((op) => operatorLabels[op] || op),
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
    const conditionText = getLastFilterCondition(trimmedFilter);
    const conditionTokens = tokenizeQuotedText(conditionText);

    // If the last token is a connector, suggest columns
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

    // A new condition is being started after a connector, suggest columns
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

    // If there is none or only one token
    if (conditionTokens.length === 0 || conditionTokens.length === 1) {
        // If a column name is fully typed and followed by a space, suggest operators
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
                tokenType: 'operator',
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

        const comparator = conditionTokens[1].toLowerCase();

        if (endsWithSpace) {
            if (comparator === 'in' || comparator === 'notin') {
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
        const valueInput = getInOperatorValueInput(context.sourceText);

        if (
            !valueInput.hasOpeningParenthesis ||
            valueInput.endsWithClosingParenthesis
        ) {
            return null;
        }

        const selectedValues = new Set(valueInput.selectedValues);
        const availableOptions = (
            updatedUniqueValueOptions[columnId] || []
        ).filter(
            (option) =>
                option === '_show_all_values_' || !selectedValues.has(option),
        );

        return {
            options: filterOptions(
                availableOptions,
                valueInput.currentValueSearch,
                true,
            ),
            replaceStart: valueInput.replaceStart,
            replaceEnd: context.sourceText.length,
            insertSuffix: ', ',
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
                true,
            ),
            replaceStart,
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
        options: filterOptions(FILTER_CONNECTORS, currentFilterPrefix),
        replaceStart,
        replaceEnd: context.sourceText.length,
        insertSuffix: ' ',
        columnId: '',
        tokenType: 'connector',
    };
};
