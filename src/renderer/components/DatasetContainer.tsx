import React, { useState, useEffect, useCallback, useContext } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { IHeaderCell, ITableData, IMask } from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import ContextMenu from 'renderer/components/DatasetView/ContextMenu';
import AppContext from 'renderer/utils/AppContext';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    openSnackbar,
    setPage,
    closeDataset,
    toggleSidebar,
} from 'renderer/redux/slices/ui';
import { getData } from 'renderer/utils/readData';
import estimateWidth from 'renderer/utils/estimateWidth';
import deepEqual from 'renderer/utils/deepEqual';
import DatasetSidebar from 'renderer/components/DatasetView/Sidebar';

const styles = {
    main: {
        flex: '1 1 auto',
    },
    table: {
        height: '100%',
    },
    pagination: {
        display: 'flex',
        flex: '0 1 1%',
        justifyContent: 'flex-end',
    },
};

const updateWidth = (
    data: ITableData,
    estimateWidthRows: number,
    maxColWidth: number,
    showTypeIcons: boolean = false,
) => {
    const widths = estimateWidth(
        data,
        estimateWidthRows,
        maxColWidth,
        showTypeIcons,
    );
    // Update column style with default width
    return data.header.map((col) => {
        // 9px per character + 18px padding
        return {
            ...col,
            size: widths[col.id] * 9 + 18,
        };
    });
};

const DatasetContainer: React.FC = () => {
    const dispatch = useAppDispatch();

    const fileId = useAppSelector((state) => state.ui.currentFileId);
    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);
    const settings = useAppSelector((state) => state.settings);
    const sidebarOpen = useAppSelector((state) => state.ui.viewer.sidebarOpen);
    const currentMask = useAppSelector<IMask | null>(
        (state) => state.data.maskData.currentMask,
    );

    const { apiService } = useContext(AppContext);

    const [isLoading, setIsLoading] = useState(true);
    const [table, setTable] = useState<ITableData | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter,
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
        (event: React.MouseEvent, rowIndex: number, columnIndex: number) => {
            event.preventDefault();
            if (columnIndex === 0 || !table) return; // Ignore row number column

            const rows = table.data;
            // In case mask is used, we need to get the index of the column with mask applied
            let updatedColumnIndex = columnIndex;
            if (currentMask !== null && currentMask.columns.length > 0) {
                const originalId = table.header[columnIndex - 1].id;
                updatedColumnIndex =
                    table.header.findIndex((item) => item.id === originalId) +
                    1;
            }

            const header = table.header[updatedColumnIndex - 1];
            const value = rowIndex === -1 ? '' : rows[rowIndex][header.id];

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header,
                open: true,
                isHeader: rowIndex === -1,
            });
        },
        [table, currentMask],
    );

    const handleCloseContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    };

    const handleCloseSidebar = () => {
        dispatch(toggleSidebar());
    };

    // Load initial data
    useEffect(() => {
        setTable(null);
        const readDataset = async () => {
            if (fileId === '' || apiService === null) {
                return;
            }

            setIsLoading(true);
            let newData: ITableData | null = null;
            try {
                newData = await getData(
                    apiService,
                    fileId,
                    0,
                    pageSize,
                    settings,
                );
            } catch (error) {
                // Remove current fileId as something is wrong with itj
                dispatch(
                    closeDataset({
                        fileId,
                    }),
                );
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: (error as Error).message,
                    }),
                );
            }
            // Get width estimation for columns
            if (newData !== null) {
                newData.header = updateWidth(
                    newData,
                    settings.viewer.estimateWidthRows,
                    settings.viewer.maxColWidth,
                    settings.viewer.showTypeIcons,
                );
                setTotalRecords(newData.metadata.records);
                setTable(newData);
                setIsLoading(false);
            }
        };

        readDataset();
    }, [dispatch, fileId, pageSize, apiService, settings]);

    // Pagination
    const page = useAppSelector((state) => state.ui.currentPage);

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
                    fileId,
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
                    );
                    setTable(newData);
                    dispatch(setPage(newPage));
                    setIsLoading(false);
                }
            };

            readNext((newPage as number) * pageSize);
        },
        [fileId, pageSize, table, dispatch, apiService, settings],
    );

    // Filter change
    useEffect(() => {
        if (table === null || apiService === null) {
            return;
        }
        // Check if filter is already applied
        if (deepEqual(currentFilter, table.appliedFilter)) {
            return;
        }
        // Reset page to 0 when filter changes
        if (page !== 0) {
            dispatch(setPage(0));
        }

        setIsLoading(true);
        const readDataset = async () => {
            const newData = await getData(
                apiService,
                fileId,
                0,
                pageSize,
                settings,
                undefined,
                currentFilter === null ? undefined : currentFilter,
            );
            if (newData !== null) {
                newData.header = updateWidth(
                    newData,
                    settings.viewer.estimateWidthRows,
                    settings.viewer.maxColWidth,
                    settings.viewer.showTypeIcons,
                );
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
                if (currentFilter !== null) {
                    dispatch(
                        openSnackbar({
                            type: 'success',
                            message: `${newData.data.length} record${newData.data.length === 1 ? '' : 's'} filtered.`,
                        }),
                    );
                }
                setTable(newData);
                setIsLoading(false);
            }
        };
        readDataset();
    }, [
        dispatch,
        fileId,
        pageSize,
        table,
        currentFilter,
        page,
        apiService,
        settings,
    ]);

    // GoTo control
    const goToRow = useAppSelector((state) => state.ui.control.goTo.row);

    useEffect(() => {
        if (goToRow !== null) {
            const newPage = Math.floor(Math.max(goToRow - 1, 0) / pageSize);
            if (newPage !== page) {
                handleChangePage(null, newPage);
            }
        }
    }, [goToRow, page, pageSize, handleChangePage]);

    if (table === null) {
        return null;
    }

    return (
        <>
            <Stack sx={styles.main}>
                <Paper sx={styles.table}>
                    <DatasetView
                        key={`${fileId}:${page}`} // Add key prop to force unmount/remount
                        tableData={table}
                        isLoading={isLoading}
                        handleContextMenu={handleContextMenu}
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
                {pageSize < table.metadata.records && (
                    <Paper sx={styles.pagination}>
                        <TablePagination
                            sx={{ mr: 2, borderRadius: 0 }}
                            component="div"
                            count={totalRecords}
                            page={page}
                            disabled={currentFilter !== null}
                            onPageChange={handleChangePage}
                            rowsPerPage={pageSize}
                            rowsPerPageOptions={[-1]}
                        />
                    </Paper>
                )}
            </Stack>
            <DatasetSidebar open={sidebarOpen} onClose={handleCloseSidebar} />
        </>
    );
};

export default DatasetContainer;
