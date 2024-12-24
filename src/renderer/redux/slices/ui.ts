import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ui as initialUi } from 'renderer/redux/initialState';
import { IUi, IUiSnackbar, IUiModal } from 'interfaces/common';

export const uiSlice = createSlice({
    name: 'ui',
    initialState: initialUi,
    reducers: {
        setPathname: (state, action: PayloadAction<Partial<IUi>>) => {
            const newState = { ...state, ...action.payload };
            return newState;
        },
        openSnackbar: (state, action: PayloadAction<IUiSnackbar>) => {
            const { type, message, props } = action.payload;
            state.snackbar = { type, message, props };
        },
        closeSnackbar: (state) => {
            state.snackbar = { type: null, message: null, props: {} };
        },
        openModal: (state, action: PayloadAction<IUiModal>) => {
            const { type, props } = action.payload;
            state.modals.push({ type, props });
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
        },
        closeModal: (state, action: PayloadAction<{ type: string }>) => {
            const { type } = action.payload;
            // Find the last opened modal of the given type and remove it
            const index = state.modals.map((m) => m.type).lastIndexOf(type);
            if (index !== -1) {
                state.modals.splice(index, 1);
            }
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
    },
});

export const {
    setPathname,
    openSnackbar,
    closeSnackbar,
    closeModal,
    openModal,
    setGoTo,
    setPage,
} = uiSlice.actions;

export default uiSlice.reducer;
