import type {
    CategoryAutocompleteParams,
    CommandAutocompleteState,
} from 'renderer/components/hooks/commandAutocomplete/types';
import { filterOptions } from 'renderer/components/hooks/commandAutocomplete/utils';

export const getHistoryAutocomplete = ({
    context,
    historyOptions = [],
}: CategoryAutocompleteParams): CommandAutocompleteState | null => {
    // Filter history options based on the current input
    return {
        options: filterOptions(historyOptions, context.sourceText, true),
        replaceStart: 0,
        replaceEnd: context.sourceText.length,
        insertSuffix: '',
        columnId: '',
        tokenType: 'value',
    };
};
