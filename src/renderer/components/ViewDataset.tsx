import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { ITableData } from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import ApiService from 'renderer/services/ApiService';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { getData } from 'renderer/utils/readData';
import estimateWidth from 'renderer/utils/estimateWidth';

const styles = {
    main: {
        display: 'flex',
        flex: '1 1 auto',
    },
    table: {
        height: '100%',
        paddingTop: '65px',
    },
    pagination: {
        display: 'flex',
        flex: '0 1 1%',
        justifyContent: 'flex-end',
    },
};

const apiService = new ApiService('local');

const blankTable = {
    header: [],
    metadata: { name: '', label: '', records: 0 },
    data: [],
};

const ViewDataset: React.FC = () => {
    const dispatch = useAppDispatch();
    const fileId = useAppSelector((state) => state.ui.currentFileId);
    const estimateWidthRows = useAppSelector(
        (state) => state.settings.estimateWidthRows
    );
    const name = useAppSelector(
        (state) => state.data.openedFileIds[fileId]?.name
    );
    const pageSize = useAppSelector((state) => state.settings.pageSize);

    const [table, setTable] = useState<ITableData>(blankTable);

    useEffect(() => {
        setTable(blankTable);
        const readDataset = async () => {
            if (fileId === '') {
                return;
            }

            const newData = await getData(apiService, fileId, 0, pageSize + 1);
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
            }
        };

        readDataset();
    }, [name, dispatch, fileId, pageSize, estimateWidthRows]);

    // Pagination
    const [page, setPage] = useState(0);

    const handleChangePage = (
        _event: any,
        newPage: React.SetStateAction<number>
    ) => {
        if (table.data.length === 0) {
            // Do nothing, as data is loaded;
            return;
        }
        setTable({ ...table, data: [] });
        setPage(newPage);
        const readNext = async (start: number) => {
            const newData = await getData(apiService, fileId, start, pageSize);
            if (newData !== null) {
                setTable(newData);
            }
        };

        readNext((newPage as number) * pageSize + 1);
    };

    if (table.header.length === 0) {
        return null;
    }

    return (
        <Stack sx={styles.main}>
            <Paper sx={styles.table}>
                <DatasetView tableData={table}/>
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

export default ViewDataset;
