import Filter, { BasicFilter } from 'js-array-filter';
import { DatasetJsonMetadata, IUiControl } from 'interfaces/common';

type DatasetCommandAction =
    | { type: 'reset-all' }
    | { type: 'reset-id-columns' }
    | { type: 'reset-sorting' }
    | { type: 'clear-mask' }
    | { type: 'set-id-columns'; columns: string[] }
    | { type: 'set-sorting'; sorting: IUiControl['sorting'] }
    | { type: 'set-mask'; columns: string[] }
    | { type: 'open-variable-info'; columnId: string }
    | { type: 'set-filter'; filter: BasicFilter }
    | { type: 'set-go-to'; row?: number; column?: string };

type DatasetCommandResultOk = { ok: true; action: DatasetCommandAction };

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

const dedupeColumns = (columns: string[]): string[] => {
    const result: string[] = [];
    columns.forEach((column) => {
        if (!result.includes(column)) {
            result.push(column);
        }
    });
    return result;
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

    if (value.toLowerCase().startsWith('re:')) {
        const pattern = value.slice(3);
        try {
            return new RegExp(pattern, 'i');
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

    if (selector.toLowerCase().startsWith('re:')) {
        return { ok: false, error: `Invalid regex selector: ${selector}` };
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

    return { ok: true, columns: dedupeColumns(resolvedColumns) };
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

const mergeColumns = (
    currentColumns: string[],
    addedColumns: string[],
): string[] => {
    return dedupeColumns([...currentColumns, ...addedColumns]);
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
                action: { type: 'set-go-to', row: firstRow, column },
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
                action: { type: 'set-go-to', row: secondRow, column },
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
        return { ok: true, action: { type: 'set-go-to', row } };
    }

    const column = resolveColumn(
        columnLookup,
        stripWrappingQuotes(trimmedValue),
    );
    if (!column) {
        return { ok: false, error: `Unknown column: ${trimmedValue}` };
    }

    return { ok: true, action: { type: 'set-go-to', column } };
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
    const trimmedCommand = commandLine.trim();
    if (trimmedCommand === '') {
        return { ok: false, error: 'Enter a command.' };
    }

    const [rawCommand, ...restParts] = trimmedCommand.split(/\s+/);
    const command = COMMAND_ALIASES[rawCommand.toLowerCase()];
    const rest = trimmedCommand.slice(rawCommand.length).trim();

    if (!command) {
        return { ok: false, error: `Unknown command: ${rawCommand}` };
    }

    switch (command) {
        case 'reset': {
            if (restParts.length > 0) {
                return {
                    ok: false,
                    error: 'Reset does not accept any arguments.',
                };
            }
            return { ok: true, action: { type: 'reset-all' } };
        }
        case 'id': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, action: { type: 'reset-id-columns' } };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                action: {
                    type: 'set-id-columns',
                    columns: resolvedColumns.columns,
                },
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
                action: {
                    type: 'set-id-columns',
                    columns: mergeColumns(
                        currentIdColumns,
                        resolvedColumns.columns,
                    ),
                },
            };
        }
        case 'sort': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, action: { type: 'reset-sorting' } };
            }
            const sortColumns = parseSortColumns(metadata, args);
            if (!sortColumns.ok) {
                return sortColumns;
            }
            return {
                ok: true,
                action: {
                    type: 'set-sorting',
                    sorting: sortColumns.sorting,
                },
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
                action: {
                    type: 'set-sorting',
                    sorting: mergeSorting(currentSorting, sortColumns.sorting),
                },
            };
        }
        case 'show': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, action: { type: 'clear-mask' } };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            return {
                ok: true,
                action: { type: 'set-mask', columns: resolvedColumns.columns },
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
                action: {
                    type: 'set-mask',
                    columns: mergeColumns(
                        visibleColumns,
                        resolvedColumns.columns,
                    ),
                },
            };
        }
        case 'hide': {
            const args = tokenizeArguments(rest);
            if (args.length === 0) {
                return { ok: true, action: { type: 'clear-mask' } };
            }
            const resolvedColumns = resolveColumns(metadata, args);
            if (!resolvedColumns.ok) {
                return resolvedColumns;
            }
            const hiddenColumns = new Set(resolvedColumns.columns);
            return {
                ok: true,
                action: {
                    type: 'set-mask',
                    columns: metadata.columns
                        .map((column) => column.name)
                        .filter((column) => !hiddenColumns.has(column)),
                },
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
                action: {
                    type: 'set-mask',
                    columns: visibleColumns.filter(
                        (column) => !hiddenColumns.has(column),
                    ),
                },
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
                action: {
                    type: 'open-variable-info',
                    columnId: resolvedColumns.columns[0],
                },
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
                action: {
                    type: 'set-filter',
                    filter: {
                        ...filter.toBasicFilter(),
                        options: {
                            caseInsensitive:
                                lastFilterOptions?.caseInsensitive ?? true,
                        },
                    },
                },
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
                action: {
                    type: 'set-filter',
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

export type { DatasetCommandAction, DatasetCommandResult };
