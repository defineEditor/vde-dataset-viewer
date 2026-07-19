import type { DatasetJsonMetadata } from 'interfaces/api';
import type { ISettings } from 'interfaces/store';
import type { ColumnType } from 'interfaces/table';

export type CommandAutocompleteCategory =
    | 'variables'
    | 'filter'
    | 'blank'
    | 'history';

export interface UniqueValuesApi {
    getUniqueValues: (params: {
        fileId: string;
        columnIds: string[];
        limit: number;
        addCount: boolean;
        getAllValues: boolean;
        metadata: DatasetJsonMetadata;
        settings: ISettings;
    }) => Promise<
        Record<
            string,
            {
                values: Array<string | number | boolean | null>;
            }
        >
    >;
}

export type FilterValueOptions = {
    value: string;
    type: 'value' | 'variable' | 'header';
}[];

export interface CommandAutocompleteState {
    options: string[] | FilterValueOptions;
    replaceStart: number;
    replaceEnd: number;
    insertSuffix: string;
    columnId: string;
    tokenType: 'value' | 'column' | 'operator' | 'connector';
    loadingColumnId?: string;
}

export interface CommandHelperTextState {
    text: string;
    isError: boolean;
}

export interface ResolvedAutocompleteContext {
    category: CommandAutocompleteCategory;
    normalizedCommand?: string;
    sourceText: string;
    activeText: string;
}

export interface CategoryAutocompleteParams {
    context: ResolvedAutocompleteContext;
    allColumnNames: string[];
    columnTypes: Record<string, ColumnType>;
    uniqueValueOptions: Record<string, FilterValueOptions>;
    allValuesColumns: string[];
    historyOptions?: string[];
}
