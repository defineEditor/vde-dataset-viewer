import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { data as initialData } from 'renderer/redux/initialState';
import {
    IRecentFile,
    BasicFilter,
    ConverterData,
    ValidationRunReport,
    ParsedValidationReport,
    IMask,
    IUiValidationPage,
    ValidatorData,
    DatasetDiff,
} from 'interfaces/common';
import deepEqual from 'renderer/utils/deepEqual';
import getFolderName from 'renderer/utils/getFolderName';
import {
    closeDataset,
    openDataset,
    closeCompare,
} from 'renderer/redux/slices/ui';

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
            action: PayloadAction<{
                fileId: string;
                filter: BasicFilter;
                datasetName: string;
            }>,
        ) => {
            const newRecentFilters = state.filterData.recentFilters.slice();
            // Check if the new filter is already present in the recent filters
            const index = newRecentFilters.findIndex((recentFilter) =>
                // Do not compare options
                deepEqual(
                    { ...recentFilter.filter, options: {} },
                    { ...action.payload.filter, options: {} },
                ),
            );
            if (index !== -1) {
                // If it is, remove the old entry
                newRecentFilters.splice(index, 1);
            } else if (newRecentFilters.length >= 100) {
                // If there are more than 100 recent filters, remove the oldest one
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
                    currentFilter: {
                        ...state.filterData.currentFilter,
                        [action.payload.fileId]: action.payload.filter,
                    },
                    recentFilters: newRecentFilters,
                    lastOptions: action.payload.filter.options,
                },
            };
            return newState;
        },
        resetFilter: (state, action: PayloadAction<{ fileId: string }>) => {
            if (state.filterData.currentFilter[action.payload.fileId]) {
                delete state.filterData.currentFilter[action.payload.fileId];
            }
            return state;
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
        setValidatorData: (
            state,
            action: PayloadAction<Partial<ValidatorData>>,
        ) => {
            // Set validator info
            state.validator = {
                ...state.validator,
                ...action.payload,
            };
        },
        resetValidatorInfo: (state) => {
            // Reset validator info
            state.validator.info = initialData.validator.info;
        },
        addValidationReport: (
            state,
            action: PayloadAction<ValidationRunReport>,
        ) => {
            state.validator.reports = {
                ...state.validator.reports,
                [action.payload.id]: action.payload,
            };
        },
        removeValidationReport: (
            state,
            action: PayloadAction<{ id: string }>,
        ) => {
            // Remove a validation report
            if (state.validator.reports[action.payload.id]) {
                delete state.validator.reports[action.payload.id];
            }
            // If it is currently loaded, then clean the report data
            if (state.validator.reportData[action.payload.id]) {
                delete state.validator.reportData[action.payload.id];
            }
        },
        setReport: (
            state,
            action: PayloadAction<{
                reportId: string;
                report: ParsedValidationReport;
            }>,
        ) => {
            const sameReport =
                state.validator.reportData[action.payload.reportId] !==
                undefined;
            // Keep only one report in memory
            state.validator.reportData = {
                [action.payload.reportId]: action.payload.report,
            };
            // Clean the filters if the report was changed
            if (!sameReport) {
                state.validator.reportFilters = {};
            }
        },
        setReportFilter: (
            state,
            action: PayloadAction<{
                filter: BasicFilter | null;
                reportTab: IUiValidationPage['currentReportTab'];
            }>,
        ) => {
            state.validator.reportFilters = {
                [action.payload.reportTab]: action.payload.filter,
            };
        },
        resetReportFilter: (state) => {
            state.validator.reportFilters = {};
        },
        setReportLastSaveFolder: (state, action: PayloadAction<string>) => {
            state.validator.lastReportSaveFolder = action.payload;
        },
        setCompareData: (
            state,
            action: PayloadAction<{
                compareId: string;
                fileBase: string | null;
                fileComp: string | null;
                datasetDiff: DatasetDiff | null;
            }>,
        ) => {
            // Delete existing compare data for the same files
            Object.keys(state.compare.data).forEach((cId) => {
                const compareEntry = state.compare.data[cId];
                if (
                    compareEntry.fileBase === action.payload.fileBase &&
                    compareEntry.fileComp === action.payload.fileComp
                ) {
                    delete state.compare.data[cId];
                }
            });

            state.compare.data[action.payload.compareId] = {
                fileBase: action.payload.fileBase,
                fileComp: action.payload.fileComp,
                datasetDiff: action.payload.datasetDiff,
            };
        },
        addRecentCompare: (
            state,
            action: PayloadAction<{ fileBase: string; fileComp: string }>,
        ) => {
            const { fileBase, fileComp } = action.payload;
            // Check if already exists
            const index = state.compare.recentCompares.findIndex(
                (c) => c.fileBase === fileBase && c.fileComp === fileComp,
            );
            if (index !== -1) {
                state.compare.recentCompares.splice(index, 1);
            } else if (state.compare.recentCompares.length >= 20) {
                state.compare.recentCompares.pop();
            }
            state.compare.recentCompares.unshift({ fileBase, fileComp });
        },
    },
    extraReducers: (builder) => {
        builder.addCase(openDataset, (state, _action) => {
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
            // Remove filters associated with the closed file
            if (state.filterData.currentFilter[fileId]) {
                delete state.filterData.currentFilter[fileId];
            }
            // If mask is not sticky, reset it
            if (
                state.maskData.currentMask &&
                !state.maskData.currentMask.sticky
            ) {
                state.maskData.currentMask = null;
            }
        });
        builder.addCase(closeCompare, (state, action) => {
            const { compareId } = action.payload;
            if (state.compare.data[compareId]) {
                delete state.compare.data[compareId];
            }
            // Remove all filters associated with comparison
            if (state.filterData.currentFilter[compareId]) {
                delete state.filterData.currentFilter[compareId];
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
    setValidatorData,
    resetValidatorInfo,
    addValidationReport,
    removeValidationReport,
    setReport,
    setReportFilter,
    resetReportFilter,
    setReportLastSaveFolder,
    setCompareData,
    addRecentCompare,
} = dataSlice.actions;

export default dataSlice.reducer;
