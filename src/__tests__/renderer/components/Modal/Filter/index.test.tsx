/* eslint-disable import/no-named-as-default-member */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from 'renderer/redux/slices/ui';
import dataReducer from 'renderer/redux/slices/data';
import settingsReducer from 'renderer/redux/slices/settings';
import apiReducer from 'renderer/redux/slices/api';
import Filter from 'renderer/components/Modal/Filter';
import AppContext from 'renderer/utils/AppContext';
import ApiService from 'renderer/services/ApiService';
import initialState from 'renderer/redux/initialState';
import { IStore } from 'interfaces/common';

const mockApiService = {
    getOpenedFileData: jest.fn(),
    getOpenedFileMetadata: jest.fn(),
    getOpenedFiles: jest.fn(),
} as unknown as ApiService;

const updatedInitialState = {
    ...initialState,
    ui: {
        ...initialState.ui,
        currentFileId: 'file1',
        viewer: {
            ...initialState.ui.viewer,
            filterInputMode: 'interactive',
        },
        modals: [{ type: 'FILTER', data: {} }],
    },
    data: {
        ...initialState.data,
        filterData: {
            ...initialState.data.filterData,
            currentFilter: null,
            lastOptions: { caseInsensitive: true },
        },
        loadedRecords: {
            file1: 100,
        },
    },
    api: {
        ...initialState.api,
    },
} as IStore;

const renderComponent = (store) =>
    render(
        <Provider store={store}>
            <AppContext.Provider value={{ apiService: mockApiService }}>
                <Filter type="FILTER" data={{}} />
            </AppContext.Provider>
        </Provider>,
    );

describe('Filter Component', () => {
    let store;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                ui: uiReducer,
                data: dataReducer,
                settings: settingsReducer,
                api: apiReducer,
            },
            preloadedState: updatedInitialState,
        });
        (mockApiService.getOpenedFileData as jest.Mock).mockReturnValue([]);
        (mockApiService.getOpenedFiles as jest.Mock).mockReturnValue([]);
        (mockApiService.getOpenedFileMetadata as jest.Mock).mockReturnValue({
            columns: [
                { name: 'column1', dataType: 'string' },
                { name: 'column2', dataType: 'integer' },
            ],
        });
    });

    it('renders correctly', () => {
        renderComponent(store);
        expect(screen.getByText('Filter Data')).toBeInTheDocument();
    });

    it('toggles input type', () => {
        renderComponent(store);
        const switchInput = screen.getByRole('checkbox', { name: /input/i });
        fireEvent.click(switchInput);
        expect(store.getState().ui.viewer.filterInputMode).toBe('manual');
    });

    it('toggles case insensitive', () => {
        renderComponent(store);
        const checkbox = screen.getByRole('checkbox', {
            name: /case insensitive/i,
        });
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('calls handleReloadData when refresh icon is clicked', () => {
        // Set a dummy filter
        store.dispatch({
            type: 'data/setFilter',
            payload: {
                filter: {
                    conditions: [
                        { variable: 'column1', operator: 'eq', value: 'test1' },
                    ],
                    connectors: [],
                },
                datasetName: 'dataset1',
            },
        });
        renderComponent(store);
        const refreshButton = screen.getByLabelText(/refresh-data/i);
        fireEvent.click(refreshButton);
        expect(store.getState().data.filterData.currentFilter).toBe(null);
    });

    it('calls handleSetFilter when apply button is clicked', () => {
        renderComponent(store);
        const applyButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(applyButton);
        expect(store.getState().data.filterData.currentFilter).toBe(null);
    });

    it('calls handleClose when cancel button is clicked', () => {
        renderComponent(store);
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);
        expect(store.getState().ui.viewer.filterInputMode).toBe('interactive');
    });

    it('calls handleResetFilter when reset button is clicked', () => {
        renderComponent(store);
        const resetButton = screen.getByRole('button', { name: /reset/i });
        fireEvent.click(resetButton);
        expect(store.getState().data.filterData.currentFilter).toBe(null);
    });
});
