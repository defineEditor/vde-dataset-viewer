import { combineReducers } from 'redux';
import ui from 'renderer/redux/slices/ui';
import data from 'renderer/redux/slices/data';
import settings from 'renderer/redux/slices/settings';
import api from 'renderer/redux/slices/api';
import { PayloadAction } from '@reduxjs/toolkit';
import { IStore } from 'interfaces/store.d';

const combinedReducer = combineReducers({ ui, data, settings, api });

const rootReducer = (state, action: PayloadAction<{ store: IStore }>) => {
    let newState = state;
    if (action.type === 'LOAD_STATE') {
        newState = action.payload.store;
    }
    return combinedReducer(newState, action);
};

export default rootReducer;
