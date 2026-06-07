import React, {
    useState,
    useEffect,
    useCallback,
    useContext,
    useMemo,
} from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Filter from 'js-array-filter';
import {
    IHeaderCell,
    ITableData,
    IMask,
    ParsedValidationReport,
    IUiControl,
    TableRowValue,
    ISettings,
    BasicFilter,
} from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import ContextMenu from 'renderer/components/DatasetView/ContextMenu';
import AppContext from 'renderer/utils/AppContext';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setPage,
    closeDataset,
    toggleSidebar,
    setGoTo,
    setSelect,
    setReloadRequested,
} from 'renderer/redux/slices/ui';
import { resetFilter } from 'renderer/redux/slices/data';
import { getData } from 'renderer/utils/readData';
import estimateWidth from 'renderer/utils/estimateWidth';
import deepEqual from 'renderer/utils/deepEqual';
import DatasetSidebar from 'renderer/components/DatasetView/Sidebar';
import getIssueAnnotations from 'renderer/utils/getIssueAnnotations';
import BottomToolbar from 'renderer/components/ViewDataset/BottomToolbar';
import ApiService from 'renderer/services/ApiService';

const styles = {
    main: {
        flex: '1 1 auto',
    },
    table: {
        height: '100%',
    },
};

const updateWidth = (
    data: ITableData,
    estimateWidthRows: number,
    maxColWidth: number,
    showTypeIcons: boolean = false,
    showLabels: boolean = false,
    compactMode: boolean = false,
) => {
    const widths = estimateWidth(
        data,
        estimateWidthRows,
        maxColWidth,
        showTypeIcons,
        false,
        showLabels,
    );
    // Update column style with default width
    return data.header.map((col) => {
        if (compactMode) {
            return {
                ...col,
                size: Math.ceil(widths[col.id] * 7.5) + 6,
            };
        }
        // 9px per character + 18px padding
        return {
            ...col,
            size: widths[col.id] * 9 + 18,
        };
    });
};

const readDataset = async (
    apiService: ApiService,
    currentFileId: string,
    page: number,
    pageSize: number,
    settings: ISettings,
    currentFilter: BasicFilter | null,
    showLabels: boolean,
    requestReason: 'initial' | 'filterChange' | 'reload',
    setTable: React.Dispatch<React.SetStateAction<ITableData | null>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setTotalRecords: React.Dispatch<React.SetStateAction<number>>,
    dispatch: ReturnType<typeof useAppDispatch>,
) => {
    if (currentFileId === '' || apiService === null) {
        setTable(null);
        return;
    }
    setIsLoading(true);
    let newData: ITableData | null = null;
    const startTime = performance.now();
    const filterIsActive = currentFilter !== null;
    // TODO: Implement loading filtered data beyound the first page. For now, only load the first page for filtered data.
    const start = filterIsActive ? 0 : page * pageSize;
    try {
        newData = await getData(
            apiService,
            currentFileId,
            start,
            pageSize,
            settings,
            undefined,
            currentFilter === null ? undefined : currentFilter,
        );
    } catch (error) {
        // Remove current fileId as something is wrong with itj
        dispatch(
            closeDataset({
                fileId: currentFileId,
            }),
        );
        dispatch(
            openSnackbar({
                type: 'error',
                message: (error as Error).message,
            }),
        );
    }
    if (newData !== null) {
        newData.header = updateWidth(
            newData,
            settings.viewer.estimateWidthRows,
            settings.viewer.maxColWidth,
            settings.viewer.showTypeIcons,
            showLabels,
            settings.other.compactMode,
        );
        if (requestReason === 'filterChange') {
            // Mark filtered columns
            if (currentFilter !== null) {
                const filtertedColumns = currentFilter.conditions.map(
                    (c) => c.variable,
                );
                newData.header = newData.header.map((col) => {
                    return {
                        ...col,
                        isFiltered: filtertedColumns.includes(col.id),
                    };
                });
            }
            if (currentFilter !== null && newData.data.length < pageSize) {
                setTotalRecords(newData.data.length);
            } else {
                setTotalRecords(newData.metadata.records);
            }
        }
        const endTime = performance.now();
        const timeLapsed = ((endTime - startTime) / 1000).toFixed(2);
        dispatch(
            openSnackbar({
                type: 'success',
                message: `${newData.data.length} record${newData.data.length === 1 ? '' : 's'} ${requestReason === 'filterChange' ? 'filtered' : 'loaded'}. (${timeLapsed}s)`,
            }),
        );
        if (['reload', 'initial'].includes(requestReason)) {
            setTotalRecords(newData.metadata.records);
        }
        setTable(newData);
        setIsLoading(false);
    }
};

const DatasetContainer: React.FC = () => {
    const dispatch = useAppDispatch();

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);
    const settings = useAppSelector((state) => state.settings);
    const sidebarOpen = useAppSelector((state) => state.ui.viewer.sidebarOpen);
    const currentMask = useAppSelector<IMask | null>(
        (state) => state.ui.control[currentFileId]?.mask ?? null,
    );

    const { apiService } = useContext(AppContext);

    const [isLoading, setIsLoading] = useState(true);
    const [table, setTable] = useState<ITableData | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter[currentFileId] || null,
    );

    const [contextMenu, setContextMenu] = useState<{
        position: { top: number; left: number };
        value: string | number | boolean | null;
        header: IHeaderCell;
        open: boolean;
        isHeader: boolean;
    }>({
        position: { top: 0, left: 0 },
        value: null,
        header: { id: '', label: '' },
        open: false,
        isHeader: false,
    });

    const handleContextMenu = useCallback(
        (
            event: React.MouseEvent,
            columnId: string,
            value: TableRowValue,
            isHeader?: boolean,
        ) => {
            event.preventDefault();
            if (columnId === '#' || !table?.header) return; // Ignore row number column

            const header = table.header.find((col) => col.id === columnId);

            if (!header) return;

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header,
                open: true,
                isHeader: isHeader || false,
            });
        },
        [table?.header],
    );

    const handleCloseContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    };

    const handleCloseSidebar = () => {
        dispatch(toggleSidebar());
    };

    const page = useAppSelector((state) =>
        state.ui.control[currentFileId]
            ? state.ui.control[currentFileId].currentPage
            : 0,
    );

    const showLabels = useAppSelector(
        (state) =>
            state.ui.control[currentFileId]?.showLabels ??
            state.settings.viewer.showLabels,
    );

    // Load initial data
    useEffect(() => {
        if (table?.fileId === currentFileId) {
            // If table is already loaded for the current fileId, do not reload
            return;
        }

        readDataset(
            apiService,
            currentFileId,
            page,
            pageSize,
            settings,
            currentFilter,
            showLabels,
            'initial',
            setTable,
            setIsLoading,
            setTotalRecords,
            dispatch,
        );
    }, [
        dispatch,
        currentFileId,
        page,
        pageSize,
        apiService,
        settings,
        currentFilter,
        table?.fileId,
        showLabels,
    ]);

    const reloadRequested = useAppSelector((state) => state.ui.reloadRequested);
    // Reload data when reloadRequested is toggled
    useEffect(() => {
        const reloadData = async () => {
            if (!reloadRequested) {
                return;
            }
            // If validateFilters is true, we need to check the filter is valid before loading the data;
            if (currentFilter !== null) {
                const fullMetadata =
                    await apiService.getMetadata(currentFileId);
                let isFilterValid = false;
                if (!fullMetadata) {
                    dispatch(
                        openSnackbar({
                            type: 'error',
                            message:
                                'Failed to reload dataset: unable to retrieve metadata.',
                        }),
                    );
                    return;
                }
                try {
                    const existingFilter = new Filter(
                        'dataset-json1.1',
                        fullMetadata.columns,
                        currentFilter,
                    );
                    const filterString = existingFilter.toString();
                    const filterForValidation = new Filter(
                        'dataset-json1.1',
                        fullMetadata.columns,
                        '',
                    );
                    isFilterValid =
                        filterForValidation.validateFilterString(filterString);
                } catch (error) {
                    isFilterValid = false;
                }

                if (!isFilterValid) {
                    // The reload of data will be done by filter branch
                    dispatch(setReloadRequested(false));
                    // We need to disable filter as it is not valid for the new data
                    dispatch(resetFilter({ fileId: currentFileId }));
                    dispatch(
                        openSnackbar({
                            type: 'error',
                            message:
                                'Filter cannot be applied to the new dataset.',
                        }),
                    );
                    return;
                }
            }

            await readDataset(
                apiService,
                currentFileId,
                page,
                pageSize,
                settings,
                currentFilter,
                showLabels,
                'reload',
                setTable,
                setIsLoading,
                setTotalRecords,
                dispatch,
            );

            dispatch(setReloadRequested(false));
        };
        reloadData();
    }, [
        dispatch,
        currentFileId,
        page,
        pageSize,
        apiService,
        settings,
        currentFilter,
        table?.fileId,
        showLabels,
        reloadRequested,
    ]);

    useEffect(() => {
        // Update header widths if showLabels was toggled
        setTable((prevTable) => {
            if (prevTable === null) return null;
            return {
                ...prevTable,
                header: updateWidth(
                    prevTable,
                    settings.viewer.estimateWidthRows,
                    settings.viewer.maxColWidth,
                    settings.viewer.showTypeIcons,
                    showLabels,
                    settings.other.compactMode,
                ),
            };
        });
    }, [settings, showLabels]);

    // Pagination
    const handleChangePage = useCallback(
        (_event, newPage: number) => {
            if (table === null || apiService === null) {
                return;
            }

            if (table.data.length === 0) {
                // Do nothing, as data is loaded;
                return;
            }
            setIsLoading(true);
            const readNext = async (start: number) => {
                const newData = await getData(
                    apiService,
                    currentFileId,
                    start,
                    pageSize,
                    settings,
                );
                if (newData !== null) {
                    newData.header = updateWidth(
                        newData,
                        settings.viewer.estimateWidthRows,
                        settings.viewer.maxColWidth,
                        settings.viewer.showTypeIcons,
                        showLabels,
                        settings.other.compactMode,
                    );
                    setTable(newData);
                    dispatch(setPage({ fileId: currentFileId, page: newPage }));
                    setIsLoading(false);
                }
            };

            readNext((newPage as number) * pageSize);
        },
        [
            currentFileId,
            pageSize,
            table,
            dispatch,
            apiService,
            settings,
            showLabels,
        ],
    );

    // Filter change
    useEffect(() => {
        if (table === null || apiService === null) {
            return;
        }
        // Check current table data corresponds to current file
        if (table.fileId !== currentFileId) {
            return;
        }
        // Check if filter is already applied
        if (deepEqual(currentFilter, table.appliedFilter)) {
            return;
        }
        // Reset page to 0 when filter changes
        if (page !== 0) {
            dispatch(setPage({ fileId: currentFileId, page: 0 }));
        } else {
            readDataset(
                apiService,
                currentFileId,
                0,
                pageSize,
                settings,
                currentFilter,
                showLabels,
                'filterChange',
                setTable,
                setIsLoading,
                setTotalRecords,
                dispatch,
            );
        }
    }, [
        dispatch,
        currentFileId,
        pageSize,
        table,
        currentFilter,
        page,
        apiService,
        settings,
        showLabels,
    ]);

    // GoTo control
    const goTo = useAppSelector(
        (state) => state.ui.control[currentFileId].goTo,
    );

    const goToRow = goTo?.row || null;

    useEffect(() => {
        if (goToRow !== null) {
            const newPage = Math.floor(Math.max(goToRow - 1, 0) / pageSize);
            if (newPage !== page) {
                handleChangePage(null, newPage);
            }
        }
    }, [goToRow, page, pageSize, handleChangePage]);

    const handleSetGoTo = (newGoTo: Partial<IUiControl['goTo']>) => {
        dispatch(setGoTo({ fileId: currentFileId, ...newGoTo }));
    };

    // Select control
    const select = useAppSelector(
        (state) => state.ui.control[currentFileId].select,
    );

    const handleSetSelect = (newSelect: Partial<IUiControl['select']>) => {
        dispatch(setSelect({ fileId: currentFileId, ...newSelect }));
    };

    // Report issues
    const showIssues = useAppSelector(
        (state) => state.ui.dataSettings[currentFileId]?.showIssues,
    );

    const filteredIssues = useAppSelector(
        (state) => state.ui.dataSettings[currentFileId]?.filteredIssues,
    );

    const currentReportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const reportData: ParsedValidationReport | null = useAppSelector(
        (state) =>
            state.data.validator.reportData[currentReportId || ''] || null,
    );

    const validationReport = useAppSelector(
        (state) => state.data.validator.reports[currentReportId || ''] || null,
    );

    // Check if current file is in the report
    const isCurrentFileInReport = useMemo(() => {
        // If issues are not enabled, no need to check further
        if (!showIssues || validationReport === null) {
            return false;
        }
        // Get path to the current file
        const currentFile = apiService.getOpenedFiles(currentFileId);
        const path = currentFile[0]?.path || '';

        if (
            validationReport &&
            path &&
            validationReport.files.map((item) => item.file).includes(path)
        ) {
            return true;
        }
        return false;
    }, [validationReport, currentFileId, apiService, showIssues]);

    // Convert report into annotation map
    const issueAnnotations = useMemo(() => {
        if (!isCurrentFileInReport || currentFilter !== null) {
            return null;
        }
        const currentFile = apiService.getOpenedFiles(currentFileId);
        const path = currentFile[0]?.path || '';
        return getIssueAnnotations(
            reportData,
            table,
            currentMask,
            filteredIssues,
            path,
        );
    }, [
        reportData,
        table,
        apiService,
        currentFileId,
        currentMask,
        isCurrentFileInReport,
        filteredIssues,
        currentFilter,
    ]);

    if (table === null || currentFileId !== table.fileId) {
        return null;
    }

    return (
        <>
            <Stack sx={styles.main}>
                <Paper sx={styles.table}>
                    <DatasetView
                        key={`${currentFileId}:${page}`} // Add key prop to force unmount/remount
                        tableData={table}
                        settings={settings.viewer}
                        isLoading={isLoading}
                        handleContextMenu={handleContextMenu}
                        currentPage={page}
                        currentMask={currentMask}
                        annotatedCells={issueAnnotations?.annotations || null}
                        goTo={goTo}
                        onSetGoTo={handleSetGoTo}
                        select={select}
                        onSetSelect={handleSetSelect}
                    />
                    <ContextMenu
                        open={contextMenu.open}
                        anchorPosition={contextMenu.position}
                        onClose={handleCloseContextMenu}
                        value={contextMenu.value}
                        metadata={table.metadata}
                        header={contextMenu.header}
                        isHeader={contextMenu.isHeader}
                    />
                </Paper>
                <BottomToolbar
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    records={table.metadata.records}
                    onPageChange={handleChangePage}
                    disablePagination={currentFilter !== null}
                    issuesByRow={issueAnnotations?.byRow || null}
                    showIssues={showIssues}
                />
            </Stack>
            <DatasetSidebar open={sidebarOpen} onClose={handleCloseSidebar} />
        </>
    );
};

export default DatasetContainer;
