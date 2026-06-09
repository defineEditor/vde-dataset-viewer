import Filter, { BasicFilter } from 'js-array-filter';
import { DatasetJsonMetadata, IUiControl } from 'interfaces/common';

type DatasetCommandAction =
    | { type: 'resetAll' }
    | { type: 'resetIdColumns' }
    | { type: 'resetSorting' }
    | { type: 'clearMask' }
    | { type: 'setIdColumns'; columns: string[] }
    | { type: 'setSorting'; sorting: IUiControl['sorting'] }
    | { type: 'setMask'; columns: string[] }
    | { type: 'openVariableInfo'; columnId: string }
    | { type: 'setFilter'; filter: BasicFilter }
    | { type: 'setGoTo'; row?: number; column?: string };

type DatasetCommandResultOk = { ok: true; actions: DatasetCommandAction[] };

type DatasetCommandResultError = { ok: false; error: string };

type DatasetCommandResult = DatasetCommandResultOk | DatasetCommandResultError;

interface ParseDatasetCommandParams {
    commandLine: string;
    metadata: DatasetJsonMetadata;
    lastFilterOptions?: BasicFilter['options'];
    currentFilter?: BasicFilter | null;
    currentIdColumns?: string[];
    currentSorting?: IUiControl['sorting'];
    currentVisibleColumns?: string[];
}

interface ParseSingleDatasetCommandParams extends Omit<
    ParseDatasetCommandParams,
    'commandLine'
> {
    command: string;
}

interface CommandExecutionState {
    currentFilter: BasicFilter | null;
    currentIdColumns: string[];
    currentSorting: IUiControl['sorting'];
    currentVisibleColumns?: string[];
}

const COMMAND_ALIASES: Record<string, string> = {
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
    info: 'info',
    osa: 'sortadd',
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
};

const SORT_DIRECTIONS = new Set(['asc', 'desc']);

const stripWrappingQuotes = (value: string): string => {
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }
    return value;
};

const tokenizeArguments = (value: string): string[] => {
    const matches = value.match(/"([^"]+)"|'([^']+)'|(\S+)/g);
    if (!matches) {
        return [];
    }

    return matches
        .map((match) => match.trim())
        .filter((match) => match.length > 0)
        .map((match) => stripWrappingQuotes(match));
};

const splitCommandLine = (value: string): string[] => {
    const commands: string[] = [];
    let currentCommand = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inRegex = false;
    let inRegexCharClass = false;
    let isEscaped = false;

    const isRegexStart = (index: number): boolean => {
        const previousCharacter = value.slice(0, index).trimEnd().slice(-1);
        return previousCharacter === '' || /\s|;/.test(previousCharacter);
    };

    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];

        if (isEscaped) {
            currentCommand += character;
            isEscaped = false;
        } else if (
            character === '\\' &&
            (inSingleQuote || inDoubleQuote || inRegex)
        ) {
            currentCommand += character;
            isEscaped = true;
        } else if (!inDoubleQuote && !inRegex && character === "'") {
            inSingleQuote = !inSingleQuote;
            currentCommand += character;
        } else if (!inSingleQuote && !inRegex && character === '"') {
            inDoubleQuote = !inDoubleQuote;
            currentCommand += character;
        } else if (!inSingleQuote && !inDoubleQuote && character === '/') {
            if (!inRegex && isRegexStart(index)) {
                inRegex = true;
                currentCommand += character;
            } else if (inRegex && !inRegexCharClass) {
                inRegex = false;
                currentCommand += character;
            } else {
                currentCommand += character;
            }
        } else if (inRegex) {
            if (character === '[') {
                inRegexCharClass = true;
            } else if (character === ']') {
                inRegexCharClass = false;
            }
            currentCommand += character;
        } else if (
            character === ';' &&
            !inSingleQuote &&
            !inDoubleQuote &&
            !inRegex
        ) {
            const trimmedCommand = currentCommand.trim();
            if (trimmedCommand !== '') {
                commands.push(trimmedCommand);
            }
            currentCommand = '';
        } else {
            currentCommand += character;
        }
    }

    const trimmedCommand = currentCommand.trim();
    if (trimmedCommand !== '') {
        commands.push(trimmedCommand);
    }

    return commands;
};

const normalizeRowValue = (value: string): number | null => {
    const normalizedValue = value.replace(/[\s.,]/g, '');
    if (normalizedValue === '') {
        return null;
    }

    const parsedValue = Number(normalizedValue);
    if (!Number.isInteger(parsedValue)) {
        return null;
    }

    return parsedValue;
};

const getColumnLookup = (
    metadata: DatasetJsonMetadata,
): Map<string, string> => {
    return new Map(
        metadata.columns.map((column) => [
            column.name.toLowerCase(),
            column.name,
        ]),
    );
};

const resolveColumn = (
    columnLookup: Map<string, string>,
    value: string,
): string | null => {
    return columnLookup.get(value.toLowerCase()) || null;
};

const getColumnNames = (metadata: DatasetJsonMetadata): string[] => {
    return metadata.columns.map((column) => column.name);
};

const removeDuplicates = (columns: string[]): string[] => {
    return columns.filter((column, index) => columns.indexOf(column) === index);
};

const parseRegexSelector = (value: string): RegExp | null => {
    if (value.startsWith('/') && value.lastIndexOf('/') > 0) {
        const lastSlash = value.lastIndexOf('/');
        const pattern = value.slice(1, lastSlash);
        const flags = value.slice(lastSlash + 1);
        try {
            return new RegExp(
                pattern,
                flags.includes('i') ? flags : `${flags}i`,
            );
        } catch (_error) {
            return null;
        }
    }

    return null;
};

const resolveColumnSelector = (
    metadata: DatasetJsonMetadata,
    rawSelector: string,
): DatasetCommandResultError | { ok: true; columns: string[] } => {
    const selector = stripWrappingQuotes(rawSelector.trim());
    const columnNames = getColumnNames(metadata);
    const columnLookup = getColumnLookup(metadata);

    if (selector === '') {
        return { ok: false, error: 'Empty column selector.' };
    }

    const regex = parseRegexSelector(selector);
    if (regex) {
        const matchedColumns = columnNames.filter((column) =>
            regex.test(column),
        );
        if (matchedColumns.length === 0) {
            return {
                ok: false,
                error: `No columns match regex: ${selector}`,
            };
        }
        return { ok: true, columns: matchedColumns };
    }

    if (selector.endsWith('+') || selector.endsWith('-')) {
        const anchorRaw = selector.slice(0, -1).trim();
        const anchorColumn = resolveColumn(columnLookup, anchorRaw);
        if (!anchorColumn) {
            return { ok: false, error: `Unknown column: ${anchorRaw}` };
        }

        const anchorIndex = columnNames.findIndex(
            (column) => column === anchorColumn,
        );
        if (anchorIndex === -1) {
            return { ok: false, error: `Unknown column: ${anchorRaw}` };
        }

        return {
            ok: true,
            columns: selector.endsWith('+')
                ? columnNames.slice(anchorIndex)
                : columnNames.slice(0, anchorIndex + 1),
        };
    }

    const resolvedColumn = resolveColumn(columnLookup, selector);
    if (!resolvedColumn) {
        return { ok: false, error: `Unknown column: ${selector}` };
    }

    return { ok: true, columns: [resolvedColumn] };
};

const resolveColumns = (
    metadata: DatasetJsonMetadata,
    rawColumns: string[],
): DatasetCommandResultError | { ok: true; columns: string[] } => {
    const resolvedColumns: string[] = [];

    rawColumns.forEach((column) => {
        const resolvedSelector = resolveColumnSelector(metadata, column);
        if (!resolvedSelector.ok) {
            resolvedColumns.push(`__ERROR__${resolvedSelector.error}`);
            return;
        }
        resolvedColumns.push(...resolvedSelector.columns);
    });

    const errorValue = resolvedColumns.find((column) =>
        column.startsWith('__ERROR__'),
    );
    if (errorValue) {
        return {
            ok: false,
            error: errorValue.replace('__ERROR__', ''),
        };
    }

    return { ok: true, columns: removeDuplicates(resolvedColumns) };
};

const parseSortColumns = (
    metadata: DatasetJsonMetadata,
    rawTokens: string[],
): DatasetCommandResultError | { ok: true; sorting: IUiControl['sorting'] } => {
    const sorting: IUiControl['sorting'] = [];
    let lastGroupStartIndex = -1;

    rawTokens.forEach((rawToken) => {
        const token = rawToken.trim();
        const direction = token.toLowerCase();

        if (SORT_DIRECTIONS.has(direction)) {
            if (lastGroupStartIndex === -1) {
                sorting.push({
                    id: `__ERROR__Sort direction ${token} must follow a column selector.`,
                    desc: false,
                });
                return;
            }

            for (
                let index = lastGroupStartIndex;
                index < sorting.length;
                index += 1
            ) {
                if (!sorting[index].id.startsWith('__ERROR__')) {
                    sorting[index].desc = direction === 'desc';
                }
            }
            lastGroupStartIndex = -1;
            return;
        }

        const resolvedColumns = resolveColumnSelector(metadata, token);
        if (!resolvedColumns.ok) {
            sorting.push({
                id: `__ERROR__${resolvedColumns.error}`,
                desc: false,
            });
            return;
        }

        lastGroupStartIndex = sorting.length;
        resolvedColumns.columns.forEach((column) => {
            if (!sorting.some((item) => item.id === column)) {
                sorting.push({ id: column, desc: false });
            }
        });
    });

    const sortError = sorting.find((item) => item.id.startsWith('__ERROR__'));
    if (sortError) {
        return {
            ok: false,
            error: sortError.id.replace('__ERROR__', ''),
        };
    }

    return { ok: true, sorting };
};

const mergeSorting = (
    currentSorting: IUiControl['sorting'],
    newSorting: IUiControl['sorting'],
): IUiControl['sorting'] => {
    const result = currentSorting.map((item) => ({ ...item }));

    newSorting.forEach((newItem) => {
        const existingIndex = result.findIndex(
            (item) => item.id === newItem.id,
        );
        if (existingIndex === -1) {
            result.push(newItem);
        } else {
            result[existingIndex] = {
                ...result[existingIndex],
                desc: newItem.desc,
            };
        }
    });

    return result;
};

const mergeFilter = (
    currentFilter: BasicFilter | null | undefined,
    nextFilter: BasicFilter,
): BasicFilter => {
    if (!currentFilter || currentFilter.conditions.length === 0) {
        return nextFilter;
    }

    return {
        conditions: [
            ...currentFilter.conditions.map((condition) => ({ ...condition })),
            ...nextFilter.conditions.map((condition) => ({ ...condition })),
        ],
        connectors: [
            ...currentFilter.connectors,
            'and',
            ...nextFilter.connectors,
        ],
        options: nextFilter.options || currentFilter.options,
    };
};

const parseGoTarget = (
    metadata: DatasetJsonMetadata,
    value: string,
): DatasetCommandResult => {
    const trimmedValue = value.trim();
    const columnLookup = getColumnLookup(metadata);

    if (trimmedValue.includes(':')) {
        const parts = trimmedValue
            .split(':')
            .map((part) => stripWrappingQuotes(part.trim()));
        if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
            return {
                ok: false,
                error: 'Go command must be in the form go <row>, go <col>, or go <col>:<row>.',
            };
        }

        const firstRow = normalizeRowValue(parts[0]);
        const secondRow = normalizeRowValue(parts[1]);

        if (firstRow !== null && secondRow === null) {
            const column = resolveColumn(columnLookup, parts[1]);
            if (!column) {
                return { ok: false, error: `Unknown column: ${parts[1]}` };
            }
            if (firstRow <= 0 || firstRow > metadata.records) {
                return {
                    ok: false,
                    error: `Row number must be between 1 and ${metadata.records}.`,
                };
            }
            return {
                ok: true,
                actions: [{ type: 'setGoTo', row: firstRow, column }],
            };
        }

        if (firstRow === null && secondRow !== null) {
            const column = resolveColumn(columnLookup, parts[0]);
            if (!column) {
                return { ok: false, error: `Unknown column: ${parts[0]}` };
            }
            if (secondRow <= 0 || secondRow > metadata.records) {
                return {
                    ok: false,
                    error: `Row number must be between 1 and ${metadata.records}.`,
                };
            }
            return {
                ok: true,
                actions: [{ type: 'setGoTo', row: secondRow, column }],
            };
        }

        return {
            ok: false,
            error: 'Go command with a colon must include one row number and one column name.',
        };
    }

    const row = normalizeRowValue(trimmedValue);
    if (row !== null) {
        if (row <= 0 || row > metadata.records) {
            return {
                ok: false,
                error: `Row number must be between 1 and ${metadata.records}.`,
            };
        }
        return { ok: true, actions: [{ type: 'setGoTo', row }] };
    }

    const column = resolveColumn(
        columnLookup,
        stripWrappingQuotes(trimmedValue),
    );
    if (!column) {
        return { ok: false, error: `Unknown column: ${trimmedValue}` };
    }

    return { ok: true, actions: [{ type: 'setGoTo', column }] };
};

const parseSingleDatasetCommand = ({
    command: commandText,
    metadata,
    lastFilterOptions,
    currentFilter = null,
    currentIdColumns = [],
    currentSorting = [],
    currentVisibleColumns,
}: ParseSingleDatasetCommandParams): DatasetCommandResult => {
    const trimmedCommand = commandText.trim();
    if (trimmedCommand === '') {
        return { ok: false, error: 'Enter a command.' };
    }

    const [rawCommand, ...restParts] = trimmedCommand.split(/\s+/);
    const normalizedCommand = COMMAND_ALIASES[rawCommand.toLowerCase()];
    const rest = trimmedCommand.slice(rawCommand.length).trim();

    if (!normalizedCommand) {
        return { ok: false, error: `Unknown command: ${rawCommand}` };
    }

    switch (normalizedCommand) {
        case 'reset': {
            if (restParts.length > 0) {
                return {
                    ok: false,
                    error: 'Reset does not accept any arguments.',
                };
            }
            return { ok: true, actions: [{ type: 'resetAll' }] };
        }
        case 'id': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, actions: [{ type: 'resetIdColumns' }] };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'setIdColumns',
                        columns: resolvedColumns.columns,
                    },
                ],
            };
        }
        case 'idadd': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return {
                    ok: false,
                    error: 'Idadd command requires one or more column selectors.',
                };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'setIdColumns',
                        columns: removeDuplicates([
                            ...currentIdColumns,
                            ...resolvedColumns.columns,
                        ]),
                    },
                ],
            };
        }
        case 'sort': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, actions: [{ type: 'resetSorting' }] };
            }
            const sortColumns = parseSortColumns(metadata, args);
            if (!sortColumns.ok) {
                return sortColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'setSorting',
                        sorting: sortColumns.sorting,
                    },
                ],
            };
        }
        case 'sortadd': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return {
                    ok: false,
                    error: 'Sortadd command requires one or more column selectors.',
                };
            }
            const sortColumns = parseSortColumns(metadata, args);
            if (!sortColumns.ok) {
                return sortColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'setSorting',
                        sorting: mergeSorting(
                            currentSorting,
                            sortColumns.sorting,
                        ),
                    },
                ],
            };
        }
        case 'show': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, actions: [{ type: 'clearMask' }] };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'setMask',
                        columns: resolvedColumns.columns,
                    },
                ],
            };
        }
        case 'showadd': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return {
                    ok: false,
                    error: 'Showadd command requires one or more column selectors.',
                };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            const visibleColumns =
                currentVisibleColumns || getColumnNames(metadata);
            return {
                ok: true,
                actions: [
                    {
                        type: 'setMask',
                        columns: removeDuplicates([
                            ...visibleColumns,
                            ...resolvedColumns.columns,
                        ]),
                    },
                ],
            };
        }
        case 'hide': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, actions: [{ type: 'clearMask' }] };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            const hiddenColumns = new Set(resolvedColumns.columns);
            return {
                ok: true,
                actions: [
                    {
                        type: 'setMask',
                        columns: metadata.columns
                            .map((column) => column.name)
                            .filter((column) => !hiddenColumns.has(column)),
                    },
                ],
            };
        }
        case 'hideadd': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return {
                    ok: false,
                    error: 'Hideadd command requires one or more column selectors.',
                };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            const visibleColumns =
                currentVisibleColumns || getColumnNames(metadata);
            const hiddenColumns = new Set(resolvedColumns.columns);
            return {
                ok: true,
                actions: [
                    {
                        type: 'setMask',
                        columns: visibleColumns.filter(
                            (column) => !hiddenColumns.has(column),
                        ),
                    },
                ],
            };
        }
        case 'info': {
            const args = tokenizeArguments(rest);
            if (args.length !== 1) {
                return {
                    ok: false,
                    error: 'Info command requires exactly one column name.',
                };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                actions: [
                    {
                        type: 'openVariableInfo',
                        columnId: resolvedColumns.columns[0],
                    },
                ],
            };
        }
        case 'filter': {
            if (rest === '') {
                return {
                    ok: false,
                    error: 'Filter command requires a filter expression.',
                };
            }

            const filter = new Filter('dataset-json1.1', metadata.columns, '');
            if (!filter.validateFilterString(rest)) {
                return { ok: false, error: 'Invalid filter expression.' };
            }
            filter.update(rest);
            return {
                ok: true,
                actions: [
                    {
                        type: 'setFilter',
                        filter: {
                            ...filter.toBasicFilter(),
                            options: {
                                caseInsensitive:
                                    lastFilterOptions?.caseInsensitive ?? true,
                            },
                        },
                    },
                ],
            };
        }
        case 'filteradd': {
            if (rest === '') {
                return {
                    ok: false,
                    error: 'Filteradd command requires a filter expression.',
                };
            }

            const filter = new Filter('dataset-json1.1', metadata.columns, '');
            if (!filter.validateFilterString(rest)) {
                return { ok: false, error: 'Invalid filter expression.' };
            }
            filter.update(rest);
            return {
                ok: true,
                actions: [
                    {
                        type: 'setFilter',
                        filter: mergeFilter(currentFilter, {
                            ...filter.toBasicFilter(),
                            options: {
                                caseInsensitive:
                                    currentFilter?.options?.caseInsensitive ??
                                    lastFilterOptions?.caseInsensitive ??
                                    true,
                            },
                        }),
                    },
                ],
            };
        }
        case 'go': {
            if (rest === '') {
                return {
                    ok: false,
                    error: 'Go command requires a row number, column name, or both.',
                };
            }
            return parseGoTarget(metadata, rest);
        }
        default:
            return { ok: false, error: `Unknown command: ${rawCommand}` };
    }
};

const applyActionToState = (
    action: DatasetCommandAction,
    state: CommandExecutionState,
    metadata: DatasetJsonMetadata,
): CommandExecutionState => {
    const allColumns = getColumnNames(metadata);

    switch (action.type) {
        case 'resetAll':
            return {
                currentFilter: null,
                currentIdColumns: [],
                currentSorting: [],
                currentVisibleColumns: allColumns,
            };
        case 'resetIdColumns':
            return { ...state, currentIdColumns: [] };
        case 'resetSorting':
            return { ...state, currentSorting: [] };
        case 'clearMask':
            return { ...state, currentVisibleColumns: allColumns };
        case 'setIdColumns':
            return { ...state, currentIdColumns: action.columns };
        case 'setSorting':
            return { ...state, currentSorting: action.sorting };
        case 'setMask':
            return { ...state, currentVisibleColumns: action.columns };
        case 'setFilter':
            return { ...state, currentFilter: action.filter };
        case 'openVariableInfo':
        case 'setGoTo':
            return state;
        default:
            return state;
    }
};

export const parseDatasetCommand = ({
    commandLine,
    metadata,
    lastFilterOptions,
    currentFilter = null,
    currentIdColumns = [],
    currentSorting = [],
    currentVisibleColumns,
}: ParseDatasetCommandParams): DatasetCommandResult => {
    const commands = splitCommandLine(commandLine);
    if (commands.length === 0) {
        return { ok: false, error: 'Enter a command.' };
    }

    const actions: DatasetCommandAction[] = [];
    let state: CommandExecutionState = {
        currentFilter,
        currentIdColumns,
        currentSorting,
        currentVisibleColumns,
    };

    for (let index = 0; index < commands.length; index += 1) {
        const result = parseSingleDatasetCommand({
            command: commands[index],
            metadata,
            lastFilterOptions,
            currentFilter: state.currentFilter,
            currentIdColumns: state.currentIdColumns,
            currentSorting: state.currentSorting,
            currentVisibleColumns: state.currentVisibleColumns,
        });

        if (!result.ok) {
            return {
                ok: false,
                error:
                    commands.length > 1
                        ? `Command ${index + 1}: ${result.error}`
                        : result.error,
            };
        }

        actions.push(...result.actions);
        for (const action of result.actions) {
            state = applyActionToState(action, state, metadata);
        }
    }

    return { ok: true, actions };
};

export type { DatasetCommandAction, DatasetCommandResult };
