import { combineReducers } from 'redux';
import ui from '@redux/slices/ui';
import data from '@redux/slices/data';
import settings from '@redux/slices/settings';
import api from '@redux/slices/api';
import { PayloadAction } from '@reduxjs/toolkit';
import { IStore } from '@interfaces/store.d';

const combinedReducer = combineReducers({ ui, data, settings, api });

const rootReducer = (state, action: PayloadAction<{ store: IStore }>) => {
    let newState = state;
    if (action.type === 'LOAD_STATE') {
        newState = action.payload.store;
    }
    return combinedReducer(newState, action);
};

export default rootReducer;
