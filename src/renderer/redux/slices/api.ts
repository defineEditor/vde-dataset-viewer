import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api as initialApi } from 'renderer/redux/initialState';
import { IApiRecord, IApiStudy, IApiStudyDataset } from 'interfaces/common';

export const apiSlice = createSlice({
    name: 'api',
    initialState: initialApi,
    reducers: {
        addApi: (state, action: PayloadAction<IApiRecord>) => {
            state.apiRecords[action.payload.id] = action.payload;
        },
        removeApi: (state, action: PayloadAction<string>) => {
            // Check if the key exists
            if (state.apiRecords[action.payload]) {
                delete state.apiRecords[action.payload];
            }
        },
        setCurrentApi: (state, action: PayloadAction<string>) => {
            if (state.currentApiId !== action.payload) {
                state.currentApiId = action.payload;
                state.currentStudyId = null;
                state.currentDatasetId = null;
                state.studies = {};
                state.datasets = {};
            }
        },
        setCurrentStudy: (state, action: PayloadAction<string>) => {
            if (state.currentStudyId !== action.payload) {
                state.currentStudyId = action.payload;
                state.currentDatasetId = null;
                state.datasets = {};
            }
        },
        setCurrentDataset: (state, action: PayloadAction<string>) => {
            if (state.currentDatasetId !== action.payload) {
                state.currentDatasetId = action.payload;
            }
        },
        setDatasets: (state, action: PayloadAction<IApiStudyDataset[]>) => {
            state.datasets = {};
            action.payload.forEach((dataset) => {
                state.datasets[dataset.itemGroupOID] = dataset;
            });
        },
        setStudies: (state, action: PayloadAction<IApiStudy[]>) => {
            state.studies = {};
            action.payload.forEach((study) => {
                state.studies[study.studyOID] = study;
            });
        },
        updateApi: (
            state,
            action: PayloadAction<{ apiId: string; apiRecord: IApiRecord }>,
        ) => {
            // Check if ID has changed;
            if (action.payload.apiId !== action.payload.apiRecord.id) {
                delete state.apiRecords[action.payload.apiId];
            }
            state.apiRecords[action.payload.apiRecord.id] =
                action.payload.apiRecord;
        },
    },
});

export const {
    addApi,
    removeApi,
    setCurrentApi,
    updateApi,
    setCurrentDataset,
    setCurrentStudy,
    setStudies,
    setDatasets,
} = apiSlice.actions;

export default apiSlice.reducer;
