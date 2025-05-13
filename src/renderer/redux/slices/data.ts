import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { data as initialData } from 'renderer/redux/initialState';
import { IRecentFile, BasicFilter, ConverterData } from 'interfaces/common';
import { IMask } from 'interfaces/store';
import deepEqual from 'renderer/utils/deepEqual';
import getFolderName from 'renderer/utils/getFolderName';
import { closeDataset, openDataset } from 'renderer/redux/slices/ui';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialData,
    reducers: {
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
            action: PayloadAction<{ filter: BasicFilter; datasetName: string }>,
        ) => {
            // If there are more than 100 recent filters, remove the oldest one
            const newRecentFilters = state.filterData.recentFilters.slice();
            // Check if the new filter is already present in the recent filters
            const index = newRecentFilters.findIndex((recentFilter) =>
                deepEqual(recentFilter.filter, action.payload.filter),
            );
            if (index !== -1) {
                // If it is, remove the old entry
                newRecentFilters.splice(index, 1);
            } else if (newRecentFilters.length >= 100) {
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
        setLoadedRecords: (
            state,
            action: PayloadAction<{ fileId: string; records: number }>,
        ) => {
            state.loadedRecords[action.payload.fileId] = action.payload.records;
        },
        setConverterData: (state, action: PayloadAction<ConverterData>) => {
            state.converter = action.payload;
        },
        // Mask related actions
        selectMask: (state, action: PayloadAction<IMask>) => {
            state.maskData.currentMask = action.payload;
            return state;
        },
        saveMask: (state, action: PayloadAction<IMask>) => {
            // Check if mask with this id already exists
            const existingIndex = state.maskData.savedMasks.findIndex(
                (mask) => mask.id === action.payload.id,
            );

            if (existingIndex !== -1) {
                // Update existing mask
                state.maskData.savedMasks[existingIndex] = action.payload;
            } else {
                // Add new mask
                state.maskData.savedMasks.push(action.payload);
            }

            return state;
        },
        deleteMask: (state, action: PayloadAction<IMask>) => {
            // Remove mask from saved masks
            state.maskData.savedMasks = state.maskData.savedMasks.filter(
                (mask) => mask.id !== action.payload.id,
            );
            return state;
        },
        clearMask: (state) => {
            state.maskData.currentMask = null;
            return state;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(openDataset, (state, action) => {
            const { fileId } = action.payload;
            if (action.payload.currentFileId !== fileId) {
                // Save the filter;
                if (
                    action.payload.currentFileId &&
                    state.filterData.currentFilter
                ) {
                    state.openDatasets[action.payload.currentFileId] = {
                        filter: state.filterData.currentFilter,
                    };
                }
                // Check if filter is saved;
                if (
                    state.openDatasets[fileId] &&
                    state.openDatasets[fileId].filter
                ) {
                    state.filterData.currentFilter =
                        state.openDatasets[fileId].filter;
                } else {
                    state.filterData.currentFilter = null;
                }
            }

            // If mask is not sticky, reset it
            if (
                state.maskData.currentMask &&
                !state.maskData.currentMask.sticky
            ) {
                state.maskData.currentMask = null;
            }

            return state;
        });
        builder.addCase(closeDataset, (state, action) => {
            // Remove file from the loaded records
            const { fileId } = action.payload;
            if (state.loadedRecords[fileId]) {
                delete state.loadedRecords[fileId];
            }
            // Reset any filters
            state.filterData.currentFilter = null;

            // If mask is not sticky, reset it
            if (
                state.maskData.currentMask &&
                !state.maskData.currentMask.sticky
            ) {
                state.maskData.currentMask = null;
            }
        });
    },
});

export const {
    addRecent,
    setFilter,
    resetFilter,
    setLoadedRecords,
    setConverterData,
    selectMask,
    saveMask,
    deleteMask,
    clearMask,
} = dataSlice.actions;

export default dataSlice.reducer;
