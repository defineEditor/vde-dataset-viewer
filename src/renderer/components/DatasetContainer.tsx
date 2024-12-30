import React, { useState, useEffect, useCallback, useContext } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { ITableData } from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import AppContext from 'renderer/utils/AppContext';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar, setPage, setPathname } from 'renderer/redux/slices/ui';
import { getData } from 'renderer/utils/readData';
import estimateWidth from 'renderer/utils/estimateWidth';
import deepEqual from 'renderer/utils/deepEqual';

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

const DatasetContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const fileId = useAppSelector((state) => state.ui.currentFileId);
    const { apiService } = useContext(AppContext);

    const estimateWidthRows = useAppSelector(
        (state) => state.settings.viewer.estimateWidthRows,
    );
    const maxColWidth = useAppSelector(
        (state) => state.settings.viewer.maxColWidth,
    );
    const name = useAppSelector(
        (state) => state.data.openedFileIds[fileId]?.name,
    );
    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);

    const [isLoading, setIsLoading] = useState(true);
    const [table, setTable] = useState<ITableData | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter,
    );

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
                newData = await getData(apiService, fileId, 0, pageSize);
            } catch (error) {
                // Remove current fileId as something is wrong with itj
                dispatch(
                    setPathname({
                        pathname: '/select',
                        currentFileId: '',
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
                const widths = estimateWidth(
                    newData,
                    estimateWidthRows,
                    maxColWidth,
                );
                // Update column style with default width
                const header = newData.header.map((col) => {
                    return {
                        ...col,
                        size: widths[col.id] * 9 + 18,
                    };
                });
                newData.header = header;
                setTotalRecords(newData.metadata.records);
                setTable(newData);
                setIsLoading(false);
            }
        };

        readDataset();
    }, [
        name,
        dispatch,
        fileId,
        pageSize,
        estimateWidthRows,
        maxColWidth,
        apiService,
    ]);

    // Pagination
    const page = useAppSelector((state) => state.ui.currentPage);

    const handleChangePage = useCallback(
        (_event: any, newPage: number) => {
            if (table === null || apiService === null) {
                return;
            }

            if (table.data.length === 0) {
                // Do nothing, as data is loaded;
                return;
            }
            setIsLoading(true);
            dispatch(setPage(newPage));
            const readNext = async (start: number) => {
                const newData = await getData(
                    apiService,
                    fileId,
                    start,
                    pageSize,
                );
                if (newData !== null) {
                    setTable(newData);
                    setIsLoading(false);
                }
            };

            readNext((newPage as number) * pageSize);
        },
        [fileId, pageSize, table, dispatch, apiService],
    );

    // Filter change
    useEffect(() => {
        // Reset page to 0 when filter changes
        if (page !== 0) {
            dispatch(setPage(0));
        }
        if (table === null || apiService === null) {
            return;
        }
        // Check if filter is already applied
        if (deepEqual(currentFilter, table.appliedFilter)) {
            return;
        }

        setIsLoading(true);
        const readDataset = async () => {
            const newData = await getData(
                apiService,
                fileId,
                0,
                pageSize,
                undefined,
                currentFilter === null ? undefined : currentFilter,
            );
            if (newData !== null) {
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
    }, [dispatch, fileId, pageSize, table, currentFilter, page, apiService]);

    // GoTo control
    const goToRow = useAppSelector((state) => state.ui.control.goTo.row);

    useEffect(() => {
        if (goToRow !== null) {
            const newPage = Math.floor(goToRow / pageSize);
            if (newPage !== page) {
                handleChangePage(null, newPage);
            }
        }
    }, [goToRow, page, pageSize, handleChangePage]);

    if (table === null) {
        return null;
    }

    return (
        <Stack sx={styles.main}>
            <Paper sx={styles.table}>
                <DatasetView
                    key={`${fileId}:${page}`} // Add key prop to force unmount/remount
                    tableData={table}
                    isLoading={isLoading}
                />
            </Paper>
            {pageSize < table.metadata.records && (
                <Paper sx={styles.pagination}>
                    <TablePagination
                        sx={{ mr: 2, borderRadius: 0 }}
                        component="div"
                        count={totalRecords}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={pageSize}
                        rowsPerPageOptions={[-1]}
                    />
                </Paper>
            )}
        </Stack>
    );
};

export default DatasetContainer;
