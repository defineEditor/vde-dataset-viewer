import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ui as initialUi } from 'renderer/redux/initialState';
import { IUi } from 'interfaces/common';

export const uiSlice = createSlice({
    name: 'ui',
    initialState: initialUi,
    reducers: {
        setView: (state, action: PayloadAction<Partial<IUi>>) => {
            const newState = { ...state, ...action.payload };
            return newState;
        },
    },
});

export const { setView } = uiSlice.actions;

export default uiSlice.reducer;
