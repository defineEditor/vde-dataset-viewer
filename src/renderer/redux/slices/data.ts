import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { data as initialData } from 'renderer/redux/initialState';
import {
    DatasetJsonMetadata,
    IRecentFile,
    DatasetType,
    Filter,
} from 'interfaces/common';
import deepEqual from 'renderer/utils/deepEqual';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialData,
    reducers: {
        setData: (
            state,
            action: PayloadAction<{
                fileId: string;
                metadata: DatasetJsonMetadata;
                type: DatasetType;
            }>,
        ) => {
            const newState = {
                ...state,
                openedFileIds: {
                    ...state.openedFileIds,
                    [action.payload.fileId]: {
                        name: action.payload.metadata.name,
                        label: action.payload.metadata.label,
                        type: action.payload.type,
                    },
                },
                openedFileMetadata: {
                    ...state.openedFileMetadata,
                    [action.payload.fileId]: action.payload.metadata,
                },
            };
            return newState;
        },
        cleanData: (state, action: PayloadAction<{ fileId: string }>) => {
            const newOpenedFileIds = { ...state.openedFileIds };
            delete newOpenedFileIds[action.payload.fileId];
            const newState = {
                ...state,
                openedFileIds: newOpenedFileIds,
            };
            return newState;
        },
        addRecent: (state, action: PayloadAction<IRecentFile>) => {
            const newRecentFiles = state.recentFiles.slice(0, 19);
            newRecentFiles.unshift(action.payload);
            const newState = {
                ...state,
                recentFiles: newRecentFiles,
            };
            return newState;
        },
        setFilter: (
            state,
            action: PayloadAction<{ filter: Filter; datasetName: string }>,
        ) => {
            // If there are more than 20 recent filters, remove the oldest one
            const newRecentFilters = state.filterData.recentFilters.slice();
            // Check if the new filter is already present in the recent filters
            const index = newRecentFilters.findIndex((recentFilter) =>
                deepEqual(recentFilter.filter, action.payload.filter),
            );
            if (index !== -1) {
                // If it is, remove the old entry
                newRecentFilters.splice(index, 1);
            } else if (newRecentFilters.length >= 20) {
                newRecentFilters.pop();
            }
            newRecentFilters.unshift({
                filter: action.payload.filter,
                datasetName: action.payload.datasetName,
                date: Date.now(),
            });
            const newState = {
                ...state,
                filterData: {
                    ...state.filterData,
                    currentFilter: action.payload.filter,
                    recentFilters: newRecentFilters,
                    lastOptions: action.payload.filter.options,
                },
            };
            return newState;
        },
        resetFilter: (state) => {
            const newState = {
                ...state,
                filterData: {
                    ...state.filterData,
                    currentFilter: null,
                },
            };
            return newState;
        },
    },
});

export const { setData, cleanData, addRecent, setFilter, resetFilter } =
    dataSlice.actions;

export default dataSlice.reducer;
