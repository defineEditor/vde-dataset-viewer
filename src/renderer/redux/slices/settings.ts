import { createSlice } from '@reduxjs/toolkit';
import { settings as initialSettings } from 'renderer/redux/initialState';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialSettings,
    reducers: {
        resetSettings: (state) => {
            const newState = {
                ...initialSettings,
            };
            return newState;
        },
    },
});

export const { resetSettings } = dataSlice.actions;

export default dataSlice.reducer;
