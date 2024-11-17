import { configureStore } from '@reduxjs/toolkit';
import rootReducer from 'renderer/redux/rootReducer';
import { loadState } from 'renderer/redux/stateUtils';

const store = configureStore({
    reducer: rootReducer,
    preloadedState: loadState(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
