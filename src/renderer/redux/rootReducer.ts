import { combineReducers } from 'redux';
import ui from 'renderer/redux/slices/ui';
import data from 'renderer/redux/slices/data';
import settings from 'renderer/redux/slices/settings';

const rootReducer = combineReducers({ ui, data, settings });

export default rootReducer;
