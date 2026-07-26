import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '@redux/rootReducer';
import initialState from '@redux/initialState';

const store = configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
