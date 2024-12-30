import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { data as initialData } from 'renderer/redux/initialState';
import { IRecentFile, DatasetType, Filter } from 'interfaces/common';
import deepEqual from 'renderer/utils/deepEqual';
import getFolderName from 'renderer/utils/getFolderName';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialData,
    reducers: {
        setData: (
            state,
            action: PayloadAction<{
                fileId: string;
                type: DatasetType;
                name: string;
                label: string;
            }>,
        ) => {
            const newState = {
                ...state,
                openedFileIds: {
                    ...state.openedFileIds,
                    [action.payload.fileId]: {
                        name: action.payload.name,
                        label: action.payload.label,
                        type: action.payload.type,
                    },
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
            // Check if the new file is already present in the recent files
            const index = state.recentFiles.findIndex(
                (recentFile) => recentFile.path === action.payload.path,
            );

            if (index !== -1) {
                // If it is, remove the old entry
                state.recentFiles.splice(index, 1);
            } else if (state.recentFiles.length >= 20) {
                state.recentFiles.pop();
            }

            state.recentFiles.unshift(action.payload);
            // Get folder from the file path
            const folder = getFolderName(action.payload.path);
            // Check if the folder is already present in the recent folders
            const folderIndex = state.recentFolders.findIndex(
                (recentFolder) => recentFolder === folder,
            );
            if (folderIndex !== -1) {
                // If it is, remove the old entry
                state.recentFolders.splice(folderIndex, 1);
            } else if (state.recentFolders.length >= 10) {
                state.recentFolders.pop();
            }
            state.recentFolders.unshift(folder);

            return state;
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
