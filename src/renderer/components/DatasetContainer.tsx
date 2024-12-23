import React, { useState, useEffect, useCallback } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { ITableData } from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import ApiService from 'renderer/services/ApiService';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { setPage } from 'renderer/redux/slices/ui';
import { getData } from 'renderer/utils/readData';
import estimateWidth from 'renderer/utils/estimateWidth';

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

const apiService = new ApiService('local');

const DatasetContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const fileId = useAppSelector((state) => state.ui.currentFileId);

    const estimateWidthRows = useAppSelector(
        (state) => state.settings.viewer.estimateWidthRows,
    );
    const name = useAppSelector(
        (state) => state.data.openedFileIds[fileId]?.name,
    );
    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);

    const [isLoading, setIsLoading] = useState(true);
    const [table, setTable] = useState<ITableData | null>(null);

    useEffect(() => {
        setTable(null);
        const readDataset = async () => {
            if (fileId === '') {
                return;
            }

            setIsLoading(true);
            const newData = await getData(apiService, fileId, 0, pageSize);
            // Get width estimation for columns
            if (newData !== null) {
                const widths = estimateWidth(newData, estimateWidthRows);
                // Update column style with default width
                const header = newData.header.map((col) => {
                    const cssWidth = `${Math.max(widths[col.id]) * 16}px`;
                    return {
                        ...col,
                        style: { width: cssWidth },
                    };
                });
                newData.header = header;
                setTable(newData);
                setIsLoading(false);
            }
        };

        readDataset();
    }, [name, dispatch, fileId, pageSize, estimateWidthRows]);

    // Pagination
    const page = useAppSelector((state) => state.ui.currentPage);

    const handleChangePage = useCallback(
        (_event: any, newPage: number) => {
            if (table === null) {
                return;
            }

            if (table.data.length === 0) {
                // Do nothing, as data is loaded;
                return;
            }
            setTable({ ...table, data: [] });
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
        [fileId, pageSize, table, dispatch],
    );

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
                        count={table.metadata.records}
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
