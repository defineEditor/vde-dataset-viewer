import type {
    CategoryAutocompleteParams,
    CommandAutocompleteState,
} from 'interfaces/common';
import {
    filterOptions,
    isNumericToken,
} from 'renderer/components/hooks/useCommandAutocomplete/utils';

const SORT_COMMANDS = new Set(['sort', 'sortadd']);
const SORT_DIRECTIONS = ['asc', 'desc'];

export const getVariablesAutocomplete = ({
    allColumnNames,
    context,
}: CategoryAutocompleteParams): CommandAutocompleteState | null => {
    const currentToken = /\s$/.test(context.sourceText)
        ? ''
        : context.sourceText.trimEnd().split(/\s+/).pop() || '';
    const replaceStartBase = context.sourceText.length - currentToken.length;

    if (context.normalizedCommand && context.activeText === '') {
        return null;
    }

    if (context.normalizedCommand === 'go') {
        const colonIndex = currentToken.lastIndexOf(':');
        const currentPart =
            colonIndex === -1
                ? currentToken
                : currentToken.slice(colonIndex + 1);

        if (isNumericToken(currentPart)) {
            return null;
        }

        return {
            options: filterOptions(allColumnNames, currentPart.toLowerCase()),
            replaceStart: context.sourceText.length - currentPart.length,
            replaceEnd: context.sourceText.length,
            insertSuffix: '',
            columnId: '',
            tokenType: 'column',
        };
    }

    const selectorOptions = SORT_COMMANDS.has(context.normalizedCommand || '')
        ? [...allColumnNames, ...SORT_DIRECTIONS]
        : allColumnNames;

    return {
        options: filterOptions(selectorOptions, currentToken.toLowerCase()),
        replaceStart: replaceStartBase,
        replaceEnd: context.sourceText.length,
        insertSuffix: '',
        columnId: '',
        tokenType: 'value',
    };
};
