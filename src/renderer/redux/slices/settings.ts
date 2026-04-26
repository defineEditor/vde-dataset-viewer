import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { settings as initialSettings } from 'renderer/redux/initialState';
import { ISettings, DeepPartial } from 'interfaces/common';

export const dataSlice = createSlice({
    name: 'data',
    initialState: initialSettings,
    reducers: {
        resetSettings: (_state) => {
            const newState = {
                ...initialSettings,
            };
            return newState;
        },
        setSettings: (state, action: PayloadAction<DeepPartial<ISettings>>) => {
            const newSettings = action.payload;

            // Go through each key in the new settings and update the state
            Object.keys(newSettings).forEach((sectionKey) => {
                if (state[sectionKey] !== undefined) {
                    const newSection = newSettings[sectionKey];
                    Object.keys(newSection).forEach((subKey) => {
                        if (state[sectionKey][subKey] !== newSection[subKey]) {
                            state[sectionKey][subKey] = newSection[subKey];
                        }
                    });
                }
            });
        },
        toggleColorMode: (state) => {
            const currentMode = state.other.colorMode;
            if (currentMode === 'dark') {
                state.other.colorMode = 'light';
            } else if (currentMode === 'light') {
                state.other.colorMode = 'system';
            } else if (currentMode === 'system') {
                state.other.colorMode = 'dark';
            }
        },
    },
});

export const { resetSettings, setSettings, toggleColorMode } =
    dataSlice.actions;

export default dataSlice.reducer;
