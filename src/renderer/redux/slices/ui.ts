import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ui as initialUi } from 'renderer/redux/initialState';
import {
    IUiSnackbar,
    IUiModal,
    AllowedPathnames,
    DatasetType,
    ModalType,
    DatasetMode,
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
                type?: DatasetType;
                name?: string;
                label?: string;
                mode?: DatasetMode;
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
                if (
                    state.control.goTo.row !== null ||
                    state.control.goTo.column !== null
                ) {
                    state.control = initialUi.control;
                }
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
            }>,
        ) => {
            const { row, column } = action.payload;
            if (row !== undefined) {
                state.control.goTo.row = row;
            }
            if (column !== undefined) {
                state.control.goTo.column = column;
            }
            if (row !== undefined && column !== undefined) {
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
        setFilterInputMode: (
            state,
            action: PayloadAction<'manual' | 'interactive'>,
        ) => {
            state.viewer.filterInputMode = action.payload;
        },
        toggleSidebar: (state) => {
            state.viewer.sidebarOpen = !state.viewer.sidebarOpen;
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
    setFilterInputMode,
    toggleSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
