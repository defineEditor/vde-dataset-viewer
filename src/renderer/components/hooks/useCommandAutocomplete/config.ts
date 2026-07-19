import type {
    CommandAutocompleteCategory,
    CommandHelperTextState,
    ResolvedAutocompleteContext,
} from '@/interfaces/common';
import { getActiveSegment } from '@/renderer/components/hooks/useCommandAutocomplete/utils';

const COMMAND_SYNTAX = {
    id: 'id [selectors] - set ID columns',
    idadd: 'idadd|ia [selectors] - add columns to ID columns',
    idrm: 'idrm [selectors] - remove columns from ID columns',
    sort: 'sort [selector] [asc|desc] ... - set sorting',
    sortadd: 'sortadd|soa [selector] [asc|desc] ... - add sorting columns',
    sortrm: 'sortrm [selector] ... - remove sorting columns',
    show: 'show [selectors] - show only selected columns',
    showadd: 'showadd|sha [selectors] - add columns to visible columns',
    hide: 'hide [selectors] - hide selected columns',
    hideadd: 'hideadd|ha [selectors] - remove columns from visible columns',
    info: 'info [column] - open variable info',
    filter: 'filter|f [expression] - replace current filter',
    filteradd: 'filteradd|fa [expression] - append filter with AND',
    go: 'go [row] | [column] | [row:column] | [column:row]',
    reset: 'reset|r - clear masks, filters, id columns, and sorting',
    selectors:
        'Selectors for multi-column commands: exact names, /regex/, COL+, COL-',
};

const MULTIKEY_COMMANDS = [
    'sort',
    'sortadd',
    'sortrm',
    'soa',
    'idadd',
    'idrm',
    'ia',
    'show',
    'showadd',
    'sha',
    'hide',
    'hideadd',
    'ha',
];

export const COMMAND_ALIASES: Record<string, string> = {
    f: 'filter',
    fa: 'filteradd',
    filter: 'filter',
    filteradd: 'filteradd',
    go: 'go',
    h: 'hide',
    ha: 'hideadd',
    hide: 'hide',
    hideadd: 'hideadd',
    i: 'info',
    id: 'id',
    ia: 'idadd',
    idadd: 'idadd',
    idrm: 'idrm',
    idr: 'idrm',
    info: 'info',
    r: 'reset',
    reset: 'reset',
    sha: 'showadd',
    sh: 'show',
    show: 'show',
    showadd: 'showadd',
    soa: 'sortadd',
    so: 'sort',
    sort: 'sort',
    sortadd: 'sortadd',
    sortrm: 'sortrm',
};

const COMMAND_CATEGORIES: Record<string, CommandAutocompleteCategory> = {
    id: 'variables',
    idadd: 'variables',
    idrm: 'variables',
    sort: 'variables',
    sortadd: 'variables',
    sortrm: 'variables',
    show: 'variables',
    showadd: 'variables',
    hide: 'variables',
    hideadd: 'variables',
    info: 'variables',
    go: 'variables',
    filter: 'filter',
    filteradd: 'filter',
    reset: 'blank',
};

export const getCommandHelperText = (
    command: string,
): CommandHelperTextState => {
    const activeSegment = command.split(';').pop()?.trimStart().toLowerCase();
    const activeCommand = activeSegment?.split(' ')[0];
    const normalizedCommand = COMMAND_ALIASES[activeCommand || ''];
    const commandKey = Object.keys(COMMAND_SYNTAX).find(
        (key) => key !== 'selectors' && normalizedCommand === key,
    );

    if (commandKey) {
        let text = COMMAND_SYNTAX[commandKey as keyof typeof COMMAND_SYNTAX];
        if (MULTIKEY_COMMANDS.includes(commandKey)) {
            text = `${text}. ${COMMAND_SYNTAX.selectors}`;
        }
        return {
            text,
            isError: false,
        };
    }

    if (activeCommand && activeCommand.indexOf(' ') > 0) {
        return {
            text: 'Unknown command.',
            isError: true,
        };
    }

    return { text: '', isError: false };
};

export const resolveAutocompleteContext = ({
    category,
    command,
}: {
    category?: CommandAutocompleteCategory;
    command: string;
}): ResolvedAutocompleteContext => {
    if (category) {
        return {
            category,
            sourceText: command,
            activeText: category === 'blank' ? '' : command,
        };
    }

    const { segment } = getActiveSegment(command);
    const trimmedSegment = segment.trimStart();
    const leadingWhitespace = segment.length - trimmedSegment.length;

    if (trimmedSegment === '') {
        return {
            category: 'blank',
            sourceText: command,
            activeText: '',
        };
    }

    const rawCommand = trimmedSegment.split(/\s+/)[0];
    const normalizedCommand = COMMAND_ALIASES[rawCommand.toLowerCase()];
    const hasSpace = /\S+\s/.test(trimmedSegment);

    if (!normalizedCommand || !hasSpace) {
        return {
            category: 'blank',
            sourceText: command,
            activeText: '',
        };
    }

    return {
        category: COMMAND_CATEGORIES[normalizedCommand] || 'blank',
        normalizedCommand,
        sourceText: command,
        activeText: segment.slice(leadingWhitespace + rawCommand.length),
    };
};
