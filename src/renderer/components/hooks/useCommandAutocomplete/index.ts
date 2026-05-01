import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    DatasetJsonMetadata,
    ISettings,
    CommandAutocompleteCategory,
    CommandAutocompleteState,
    UniqueValuesApi,
} from 'interfaces/common';
import { resolveAutocompleteContext } from 'renderer/components/hooks/useCommandAutocomplete/config';
import { getFilterAutocomplete } from 'renderer/components/hooks/useCommandAutocomplete/categories/filter';
import { getHistoryAutocomplete } from 'renderer/components/hooks/useCommandAutocomplete/categories/history';
import { getVariablesAutocomplete } from 'renderer/components/hooks/useCommandAutocomplete/categories/variables';
import { formatFilterValueOption } from 'renderer/components/hooks/useCommandAutocomplete/utils';

export type {
    CommandAutocompleteCategory,
    CommandAutocompleteState,
    CommandHelperTextState,
} from 'interfaces/useCommandAutocomplete';
export { getCommandHelperText } from 'renderer/components/hooks/useCommandAutocomplete/config';

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
    columnTypes: Record<string, 'numeric' | 'string' | 'boolean'>;
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
        Record<string, string[]>
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

                const formattedValues = (values[columnId]?.values ?? []).map(
                    (value) =>
                        formatFilterValueOption(
                            value,
                            columnTypes[columnId] === 'string',
                        ),
                );

                setUniqueValueOptions((previousValues) => ({
                    ...previousValues,
                    [columnId]: Array.from(new Set(formattedValues)),
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
