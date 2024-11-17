import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { data as initialData } from 'renderer/redux/initialState';
import { IRecentFile } from 'interfaces/common';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialData,
    reducers: {
        setData: (
            state,
            action: PayloadAction<{
                fileId: string;
                name: string;
                label: string;
            }>
        ) => {
            const newState = {
                ...state,
                openedFileIds: {
                    ...state.openedFileIds,
                    [action.payload.fileId]: {
                        name: action.payload.name,
                        label: action.payload.label,
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
            const newRecentFiles = state.recentFiles.slice(0, 19);
            newRecentFiles.unshift(action.payload);
            const newState = {
                ...state,
                recentFiles: newRecentFiles,
            };
            return newState;
        },
    },
});

export const { setData, cleanData, addRecent } = dataSlice.actions;

export default dataSlice.reducer;
