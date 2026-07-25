import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    DatasetJsonMetadata,
    ISettings,
    CommandAutocompleteCategory,
    CommandAutocompleteState,
    UniqueValuesApi,
    FilterValueOptions,
    ColumnType,
} from '@/interfaces/common';
import { resolveAutocompleteContext } from '@/renderer/components/hooks/useCommandAutocomplete/config';
import { getFilterAutocomplete } from '@/renderer/components/hooks/useCommandAutocomplete/categories/filter';
import { getHistoryAutocomplete } from '@/renderer/components/hooks/useCommandAutocomplete/categories/history';
import { getVariablesAutocomplete } from '@/renderer/components/hooks/useCommandAutocomplete/categories/variables';
import { formatFilterValueOption } from '@/renderer/components/hooks/useCommandAutocomplete/utils';

export type {
    CommandAutocompleteCategory,
    CommandAutocompleteState,
    CommandHelperTextState,
} from '@/interfaces/useCommandAutocomplete';
export { getCommandHelperText } from '@/renderer/components/hooks/useCommandAutocomplete/config';

export const useCommandAutocomplete = ({
    apiService,
    allColumnNames,
    category,
    columnTypes,
    allValuesColumns,
    command,
    currentFileId,
    historyOptions,
    metadata,
    settings,
}: {
    apiService: UniqueValuesApi;
    allColumnNames: string[];
    category?: CommandAutocompleteCategory;
    columnTypes: Record<string, ColumnType>;
    allValuesColumns: string[];
    command: string;
    currentFileId: string;
    historyOptions?: string[];
    metadata?: DatasetJsonMetadata;
    settings: ISettings;
}): {
    commandAutocomplete: CommandAutocompleteState | null;
    isAutocompleteLoading: boolean;
    resolvedCategory: CommandAutocompleteCategory;
} => {
    const [uniqueValueOptions, setUniqueValueOptions] = useState<
        Record<string, FilterValueOptions>
    >({});
    const [loadingValueColumnId, setLoadingValueColumnId] = useState<
        string | null
    >(null);

    const [allValuesLoaded, setAllValuesLoaded] = useState<
        Record<string, boolean>
    >({});

    const context = useMemo(
        () => resolveAutocompleteContext({ category, command }),
        [category, command],
    );

    const commandAutocomplete = useMemo<CommandAutocompleteState | null>(() => {
        if (!metadata && context.category !== 'history') {
            return null;
        }

        const params = {
            context,
            allColumnNames,
            columnTypes,
            uniqueValueOptions,
            historyOptions,
            allValuesColumns,
        };

        switch (context.category) {
            case 'history':
                return getHistoryAutocomplete(params);
            case 'filter':
                return getFilterAutocomplete(params);
            case 'variables':
                return getVariablesAutocomplete(params);
            case 'blank':
            default:
                return null;
        }
    }, [
        allColumnNames,
        columnTypes,
        context,
        historyOptions,
        metadata,
        uniqueValueOptions,
        allValuesColumns,
    ]);

    const loadValues = useCallback(
        async (columnId: string, getAll: boolean = false) => {
            setLoadingValueColumnId(columnId);
            setUniqueValueOptions((prev) => {
                const newValues = {
                    ...prev,
                };
                delete newValues[columnId];
                return newValues;
            });
            try {
                if (!metadata) {
                    return;
                }
                const values = await apiService.getUniqueValues({
                    fileId: currentFileId,
                    columnIds: [columnId],
                    limit: getAll ? 1000 : 100,
                    addCount: false,
                    getAllValues: getAll,
                    metadata,
                    settings,
                });

                const columnType = columnTypes[columnId.toLowerCase()];
                const formattedValues = (values[columnId]?.values ?? []).map(
                    (value) =>
                        formatFilterValueOption(
                            value,
                            columnType === 'string' || columnType === 'date',
                        ),
                );

                // Get variable names which are comparable to the column type and add them to the list of unique values
                const comparableVariables = metadata.columns
                    .filter(
                        (item) =>
                            item.name.toLowerCase() !==
                                columnId.toLowerCase() &&
                            columnTypes[item.name.toLowerCase()] ===
                                columnTypes[columnId.toLowerCase()],
                    )
                    .map((item) => item.name);

                const uniqueFormattedValues = Array.from(
                    new Set(formattedValues),
                );

                const newValues: FilterValueOptions = [];
                uniqueFormattedValues.forEach((value) => {
                    newValues.push({
                        value,
                        type: 'value',
                    });
                });
                comparableVariables.forEach((value) => {
                    newValues.push({
                        value,
                        type: 'variable',
                    });
                });
                setUniqueValueOptions((previousValues) => ({
                    ...previousValues,
                    [columnId]: newValues,
                }));
            } catch (_error) {
                setUniqueValueOptions((previousValues) => ({
                    ...previousValues,
                    [columnId]: [],
                }));
            } finally {
                setLoadingValueColumnId((currentColumnId) =>
                    currentColumnId === columnId ? null : currentColumnId,
                );
                if (getAll) {
                    setAllValuesLoaded((prev) => ({
                        ...prev,
                        [columnId]: true,
                    }));
                }
            }
        },
        [apiService, currentFileId, metadata, settings, columnTypes],
    );

    // If allValuesColumns is updated, load the values again for the current column;
    useEffect(() => {
        if (
            context.category === 'filter' &&
            commandAutocomplete?.columnId &&
            allValuesColumns.includes(commandAutocomplete.columnId) &&
            !allValuesLoaded[commandAutocomplete.columnId]
        ) {
            loadValues(commandAutocomplete.columnId, true).catch(
                () => undefined,
            );
        }
    }, [
        loadValues,
        allValuesColumns,
        commandAutocomplete?.columnId,
        context.category,
        allValuesLoaded,
    ]);

    useEffect(() => {
        if (
            !metadata ||
            !commandAutocomplete?.loadingColumnId ||
            uniqueValueOptions[commandAutocomplete.loadingColumnId] !==
                undefined ||
            allValuesLoaded[commandAutocomplete.loadingColumnId] ||
            loadingValueColumnId === commandAutocomplete.loadingColumnId
        ) {
            return;
        }

        const columnId = commandAutocomplete.loadingColumnId;

        loadValues(columnId, allValuesColumns.includes(columnId)).catch(
            () => undefined,
        );
    }, [
        loadValues,
        apiService,
        commandAutocomplete,
        allValuesColumns,
        currentFileId,
        loadingValueColumnId,
        metadata,
        settings,
        uniqueValueOptions,
        columnTypes,
        allValuesLoaded,
    ]);

    return {
        commandAutocomplete,
        isAutocompleteLoading: Boolean(
            (commandAutocomplete?.loadingColumnId &&
                uniqueValueOptions[commandAutocomplete.loadingColumnId] ===
                    undefined) ||
            (loadingValueColumnId &&
                uniqueValueOptions[loadingValueColumnId] === undefined),
        ),
        resolvedCategory: context.category,
    };
};
