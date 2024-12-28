import { configureStore } from '@reduxjs/toolkit';
import rootReducer from 'renderer/redux/rootReducer';
import initialState from 'renderer/redux/initialState';

const store = configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
