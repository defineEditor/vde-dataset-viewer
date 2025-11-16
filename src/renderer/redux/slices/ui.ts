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
                // Set the current page to 0
                state.currentPage = 0;
                // Reset the control.goTo object
                state.control = initialUi.control;
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
                // Reset the current page to 0
                if (state.currentPage !== 0) {
                    state.currentPage = 0;
                }
                // Close sidebar if it is open
                if (state.viewer.sidebarOpen) {
                    state.viewer.sidebarOpen = false;
                }

                if (
                    state.control.goTo.row !== null ||
                    state.control.goTo.column !== null
                ) {
                    state.control = initialUi.control;
                }
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
                row?: number | null;
                column?: string | null;
                cellSelection?: boolean;
            }>,
        ) => {
            const { row, column, cellSelection } = action.payload;
            if (row !== undefined) {
                state.control.goTo.row = row;
            }
            if (column !== undefined) {
                state.control.goTo.column = column;
            }
            if (cellSelection !== undefined) {
                state.control.goTo.cellSelection = cellSelection;
            }
            if (
                row !== undefined &&
                column !== undefined &&
                cellSelection === undefined
            ) {
                state.control.goTo.cellSelection = true;
            } else if (!state.control.goTo.row && !state.control.goTo.column) {
                // Reset the value once both column and cell are selected
                state.control.goTo.cellSelection = false;
            }
        },
        setSelect: (
            state,
            action: PayloadAction<{
                row?: number | null;
                column?: string | null;
            }>,
        ) => {
            const { row, column } = action.payload;
            if (row !== undefined) {
                state.control.select.row = row;
            }
            if (column !== undefined) {
                state.control.select.column = column;
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
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setDatasetInfoTab: (state, action: PayloadAction<0 | 1>) => {
            state.viewer.datasetInfoTab = action.payload;
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
    resetDefineUi,
} = uiSlice.actions;

export default uiSlice.reducer;
