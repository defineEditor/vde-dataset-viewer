import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ui as initialUi } from 'renderer/redux/initialState';
import {
    IUiSnackbar,
    IUiModal,
    IUiValidation,
    IUiValidationPage,
    AllowedPathnames,
    DataType,
    ModalType,
    DataMode,
    IUiViewer,
    DefineTab,
    IUiCompare,
} from 'interfaces/common';
import { paths } from 'misc/constants';

export const uiSlice = createSlice({
    name: 'ui',
    initialState: initialUi,
    reducers: {
        openDataset: (
            state,
            action: PayloadAction<{
                fileId: string;
                type?: DataType;
                name?: string;
                label?: string;
                mode?: DataMode;
                currentFileId?: string;
                totalRecords?: number;
            }>,
        ) => {
            const { fileId } = action.payload;
            // If the current dataset is the opened one, do nothing
            if (state.currentFileId !== fileId) {
                // Set the opened dataset as the current dataset
                state.currentFileId = fileId;
                // Initialize control for this file if it doesn't exist
                if (!state.control[fileId]) {
                    state.control[fileId] = {
                        goTo: {
                            row: null,
                            column: null,
                            cellSelection: false,
                        },
                        select: {
                            row: null,
                            column: null,
                        },
                        scrollPosition: {
                            offsetY: 0,
                            offsetX: 0,
                        },
                        currentPage: 0,
                    };
                }
                // Open dataset view
                state.pathname = paths.VIEWFILE;
            } else if (state.pathname !== paths.VIEWFILE) {
                // Open the view page
                state.pathname = paths.VIEWFILE;
            }
        },
        closeDataset: (state, action: PayloadAction<{ fileId: string }>) => {
            const { fileId } = action.payload;
            // Check if the closed dataset is the current dataset
            if (state.currentFileId === fileId) {
                // Close the current dataset
                state.currentFileId = '';
                if (state.pathname === paths.VIEWFILE) {
                    // Close dataset view
                    state.pathname = paths.SELECT;
                }
                // Close sidebar if it is open
                if (state.viewer.sidebarOpen) {
                    state.viewer.sidebarOpen = false;
                }
            }
            // Remove control state for this file
            if (state.control[fileId]) {
                delete state.control[fileId];
            }
            // Check if there are any settings
            if (state.dataSettings[fileId]) {
                // Remove the settings for this dataset
                delete state.dataSettings[fileId];
            }
        },
        setPathname: (
            state,
            action: PayloadAction<{ pathname: AllowedPathnames }>,
        ) => {
            state.pathname = action.payload.pathname;
        },
        openSnackbar: (state, action: PayloadAction<IUiSnackbar>) => {
            const { type, message, props } = action.payload;
            state.snackbar = { type, message, props };
        },
        closeSnackbar: (state) => {
            state.snackbar = { type: null, message: null, props: {} };
        },
        openModal: (state, action: PayloadAction<IUiModal>) => {
            state.modals.push(action.payload);
        },
        setGoTo: (
            state,
            action: PayloadAction<{
                fileId: string;
                row?: number | null;
                column?: string | null;
                cellSelection?: boolean;
            }>,
        ) => {
            const { fileId, row, column, cellSelection } = action.payload;
            if (!state.control[fileId]) {
                return;
            }
            if (row !== undefined) {
                state.control[fileId].goTo.row = row;
            }
            if (column !== undefined) {
                state.control[fileId].goTo.column = column;
            }
            if (cellSelection !== undefined) {
                state.control[fileId].goTo.cellSelection = cellSelection;
            }
            if (
                row !== undefined &&
                column !== undefined &&
                cellSelection === undefined
            ) {
                state.control[fileId].goTo.cellSelection = true;
            } else if (
                !state.control[fileId].goTo.row &&
                !state.control[fileId].goTo.column
            ) {
                // Reset the value once both column and cell are selected
                state.control[fileId].goTo.cellSelection = false;
            }
        },
        setSelect: (
            state,
            action: PayloadAction<{
                fileId: string;
                row?: number | null;
                column?: string | null;
            }>,
        ) => {
            const { fileId, row, column } = action.payload;
            if (!state.control[fileId]) {
                return;
            }
            if (row !== undefined) {
                state.control[fileId].select.row = row;
            }
            if (column !== undefined) {
                state.control[fileId].select.column = column;
            }
        },
        closeModal: (state, action: PayloadAction<{ type: ModalType }>) => {
            const { type } = action.payload;
            // Find the last opened modal of the given type and remove it
            const index = state.modals.map((m) => m.type).lastIndexOf(type);
            if (index !== -1) {
                state.modals.splice(index, 1);
            }
        },
        closeAllModals: (state) => {
            // Find the last opened modal of the given type and remove it
            state.modals = [];
        },
        setPage: (
            state,
            action: PayloadAction<{ fileId: string; page: number }>,
        ) => {
            const { fileId, page } = action.payload;
            if (!state.control[fileId]) {
                return;
            }
            state.control[fileId].currentPage = page;
            // Reset scroll position when page changes
            state.control[fileId].scrollPosition = {
                offsetY: 0,
                offsetX: 0,
            };
        },
        setDatasetInfoTab: (state, action: PayloadAction<0 | 1>) => {
            state.viewer.datasetInfoTab = action.payload;
        },
        setDatasetScrollPosition: (
            state,
            action: PayloadAction<{
                fileId: string;
                offsetX: number;
                offsetY: number;
            }>,
        ) => {
            const { fileId, offsetX, offsetY } = action.payload;
            if (!state.control[fileId]) {
                return;
            }
            state.control[fileId].scrollPosition = { offsetX, offsetY };
        },
        setBottomSection: (
            state,
            action: PayloadAction<'dataset' | 'issues'>,
        ) => {
            state.viewer.bottomSection = action.payload;
        },
        setValidationModalTab: (
            state,
            action: PayloadAction<IUiViewer['validatorTab']>,
        ) => {
            state.viewer.validatorTab = action.payload;
        },
        setFilterInputMode: (
            state,
            action: PayloadAction<'manual' | 'interactive'>,
        ) => {
            state.viewer.filterInputMode = action.payload;
        },
        toggleSidebar: (state) => {
            state.viewer.sidebarOpen = !state.viewer.sidebarOpen;
        },
        setValidationTab: (
            state,
            action: PayloadAction<IUiValidationPage['currentTab']>,
        ) => {
            state.validationPage.currentTab = action.payload;
        },
        setValidationReport: (state, action: PayloadAction<string | null>) => {
            state.validationPage.currentReportId = action.payload;
        },
        setValidationReportTab: (
            state,
            action: PayloadAction<IUiValidationPage['currentReportTab']>,
        ) => {
            state.validationPage.currentReportTab = action.payload;
        },
        toggleShowOnlyDatasetsWithIssues: (state) => {
            state.validationPage.showOnlyDatasetsWithIssues =
                !state.validationPage.showOnlyDatasetsWithIssues;
        },
        setReportSummaryType: (
            state,
            action: PayloadAction<IUiValidationPage['reportSummaryType']>,
        ) => {
            state.validationPage.reportSummaryType = action.payload;
        },
        setZoomLevel: (state, action: PayloadAction<number>) => {
            state.zoomLevel = action.payload;
        },
        setDefineFileId: (state, action: PayloadAction<string | null>) => {
            state.define.currentFileId = action.payload;
        },
        setDefineIsLoading: (state, action: PayloadAction<boolean>) => {
            state.define.isDefineLoading = action.payload;
        },
        setDefineTab: (state, action: PayloadAction<DefineTab>) => {
            state.define.currentTab = action.payload;
        },
        setDefineItemGroup: (state, action: PayloadAction<string | null>) => {
            state.define.selectedItemGroupOid = action.payload;
        },
        setDefineVariable: (state, action: PayloadAction<string | null>) => {
            state.define.selectedVariableOid = action.payload;
        },
        setDefineSearchTerm: (state, action: PayloadAction<string>) => {
            state.define.searchTerm = action.payload;
        },
        setDefineScrollPosition: (
            state,
            action: PayloadAction<{ fileId: string; position: number }>,
        ) => {
            const { fileId, position } = action.payload;
            state.define.scrollPosition[fileId] = position;
        },
        resetDefineUi: (state) => {
            state.define = initialUi.define;
        },
        updateValidation: (
            state,
            action: PayloadAction<{
                validationId: string;
                validation: Partial<IUiValidation>;
            }>,
        ) => {
            const { validationId, validation } = action.payload;
            if (!state.validation[validationId]) {
                state.validation[validationId] = {
                    status: 'not started',
                    validationProgress: 0,
                    conversionProgress: null,
                    dateCompleted: null,
                    error: null,
                    logFileName: null,
                    ...validation,
                };
            } else {
                state.validation[validationId] = {
                    ...state.validation[validationId],
                    ...validation,
                };
            }
        },
        setShowIssues: (
            state,
            action: PayloadAction<{
                id: string;
                show: boolean;
                filteredIssues?: string[];
            }>,
        ) => {
            const { id, show, filteredIssues = null } = action.payload;
            if (!state.dataSettings[id]) {
                state.dataSettings[id] = {
                    showIssues: show,
                    filteredIssues: filteredIssues || [],
                    currentIssueIndex: 0,
                };
            } else {
                state.dataSettings[id].showIssues = show;
                if (filteredIssues && filteredIssues.length > 0) {
                    state.dataSettings[id].filteredIssues = filteredIssues;
                    state.dataSettings[id].currentIssueIndex = 0;
                } else if (!show) {
                    // Clear filtered issues when disabling issue view
                    state.dataSettings[id].filteredIssues = [];
                    state.dataSettings[id].currentIssueIndex = 0;
                }
            }
            // If issue navigation is enabled and showIsssues is false, switch to dataset navigation
            if (
                state.currentFileId === id &&
                !show &&
                state.viewer.bottomSection === 'issues'
            ) {
                state.viewer.bottomSection = 'dataset';
            }
        },
        setIssueFilter: (
            state,
            action: PayloadAction<{ id: string; filter: string[] }>,
        ) => {
            const { id, filter } = action.payload;
            if (!state.dataSettings[id]) {
                state.dataSettings[id] = {
                    showIssues: true,
                    filteredIssues: filter,
                    currentIssueIndex: 0,
                };
            } else {
                state.dataSettings[id].filteredIssues = filter;
                // Reset current issue index
                state.dataSettings[id].currentIssueIndex = 0;
            }
        },
        setCurrentIssueIndex: (
            state,
            action: PayloadAction<{ id: string; index: number }>,
        ) => {
            const { id, index } = action.payload;
            if (!state.dataSettings[id]) {
                state.dataSettings[id] = {
                    showIssues: true,
                    filteredIssues: [],
                    currentIssueIndex: index,
                };
            } else {
                state.dataSettings[id].currentIssueIndex = index;
            }
        },
        setIsComparing: (state, action: PayloadAction<boolean>) => {
            state.compare.isComparing = action.payload;
        },
        setCompareResultTab: (
            state,
            action: PayloadAction<'summary' | 'metadata' | 'data'>,
        ) => {
            state.compare.resultTab = action.payload;
        },
        setCompareView: (state, action: PayloadAction<IUiCompare['view']>) => {
            state.compare.view = action.payload;
        },
        setComparePage: (state, action: PayloadAction<number>) => {
            state.compare.currentComparePage = action.payload;
        },
        setCompareFiles: (
            state,
            action: PayloadAction<
                Partial<{
                    fileBase: string | null;
                    fileComp: string | null;
                }>
            >,
        ) => {
            if (action.payload.fileBase !== undefined) {
                state.compare.fileBase = action.payload.fileBase;
            }
            if (action.payload.fileComp !== undefined) {
                state.compare.fileComp = action.payload.fileComp;
            }
        },
        setNewCompare: (
            state,
            action: PayloadAction<{
                fileBase: string;
                fileComp: string;
            }>,
        ) => {
            state.compare.fileBase = action.payload.fileBase;
            state.compare.fileComp = action.payload.fileComp;
            state.compare.currentComparePage = 0;
            state.compare.currentDiffIndex = 0;
            state.compare.isComparing = true;
        },
    },
});

export const {
    setPathname,
    openDataset,
    closeDataset,
    openSnackbar,
    closeSnackbar,
    closeModal,
    closeAllModals,
    openModal,
    setGoTo,
    setSelect,
    setPage,
    setDatasetInfoTab,
    setDatasetScrollPosition,
    setBottomSection,
    setValidationModalTab,
    setFilterInputMode,
    toggleSidebar,
    updateValidation,
    setValidationReport,
    setValidationTab,
    setValidationReportTab,
    toggleShowOnlyDatasetsWithIssues,
    setReportSummaryType,
    setZoomLevel,
    setShowIssues,
    setIssueFilter,
    setCurrentIssueIndex,
    setDefineFileId,
    setDefineTab,
    setDefineItemGroup,
    setDefineVariable,
    setDefineSearchTerm,
    setDefineScrollPosition,
    setDefineIsLoading,
    resetDefineUi,
    setIsComparing,
    setCompareFiles,
    setCompareResultTab,
    setCompareView,
    setComparePage,
    setNewCompare,
} = uiSlice.actions;

export default uiSlice.reducer;
