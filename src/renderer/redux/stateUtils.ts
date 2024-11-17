import initialState from 'renderer/redux/initialState';
import { IStore } from 'interfaces/common';

// In case new state slices are added, the previous state will be merged with the new version to add all required attributes
const mergeDefaults = (
    state: Record<string, unknown>,
    defaultState: Record<string, unknown>
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
                defaultState[attr] as Record<string, unknown>
            );
        } else if (state[attr] === undefined) {
            newState[attr] = defaultState[attr];
        }
    });
    return newState;
};

export const loadState = (): IStore => {
    try {
        const serializedState = localStorage.getItem('state');
        if (serializedState === null) {
            return initialState;
        }
        const state: IStore = JSON.parse(serializedState);
        return mergeDefaults(
            state as unknown as Record<string, unknown>,
            initialState as unknown as Record<string, unknown>
        ) as unknown as IStore;
    } catch (err) {
        return initialState;
    }
};

export const saveState = (state: IStore): void => {
    // Remove some things, which should not be kept between sessions
    const savedState = { ...state };
    const serializedState = JSON.stringify(savedState);
    localStorage.setItem('state', serializedState);
};
