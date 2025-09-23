import initialState, { data, ui, api } from 'renderer/redux/initialState';
import { IStore, IUi, IApi, IData } from 'interfaces/common';
import store from 'renderer/redux/store';
import ApiService from 'renderer/services/ApiService';

// In case new state slices are added, the previous state will be merged with the new version to add all required attributes
const mergeDefaults = (
    state: Record<string, unknown>,
    defaultState: Record<string, unknown>,
): Record<string, unknown> => {
    if (state === null || state === undefined) {
        return defaultState;
    }
    const newState = { ...state };
    Object.keys(defaultState).forEach((attr) => {
        if (
            !!defaultState[attr] &&
            (defaultState[attr] as Record<string, unknown>).constructor ===
                Object
        ) {
            newState[attr] = mergeDefaults(
                newState[attr] as Record<string, unknown>,
                defaultState[attr] as Record<string, unknown>,
            );
        } else if (state[attr] === undefined) {
            newState[attr] = defaultState[attr];
        }
    });
    return newState;
};

export const safeLoadState = (state: IStore): IStore => {
    try {
        return mergeDefaults(
            state as unknown as Record<string, unknown>,
            initialState as unknown as Record<string, unknown>,
        ) as unknown as IStore;
    } catch (err) {
        return initialState;
    }
};

export const dehydrateState = (state: IStore): IStore => {
    // Remove some things, which should not be kept between sessions
    const newData: IData = { ...state.data };
    // Reset opened files
    newData.loadedRecords = data.loadedRecords;
    // Remove filter if it was applied
    newData.filterData = { ...newData.filterData, currentFilter: null };
    // Remove validation filter and current report
    newData.validator = {
        ...newData.validator,
        reportFilters: {},
        reportData: {},
    };
    // Keep zoom level between sessions
    const newUi: IUi = { ...ui, validation: {}, zoomLevel: state.ui.zoomLevel };
    // Remove all but API records
    const newApi: IApi = { ...api, apiRecords: state.api.apiRecords };

    return { ...state, ui: newUi, data: newData, api: newApi };
};

export const saveStore = async (apiService: ApiService) => {
    const state = dehydrateState(store.getState());
    if (state) {
        await apiService.saveLocalStore({
            reduxStore: state,
        });
    }
};
