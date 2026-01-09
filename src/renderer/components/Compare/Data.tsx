import React, {
    useEffect,
    useState,
    useContext,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import DatasetView from 'renderer/components/DatasetView';
import AppContext from 'renderer/utils/AppContext';
import {
    DatasetDiff,
    ITableData,
    ItemDataArray,
    IUiControl,
} from 'interfaces/common';
import { getData } from 'renderer/utils/readData';
import { diffChars } from 'diff';
import {
    openSnackbar,
    setCompareFileIds,
    setComparePage,
} from 'renderer/redux/slices/ui';
import BottomToolbar from 'renderer/components/Compare/BottomToolbar';
import ApiService from 'renderer/services/ApiService';
import DifferencesModal from 'renderer/components/Compare/DifferencesModal';
import { clearLoadedRecords } from 'renderer/redux/slices/data';

const styles = {
    containerVertical: {
        overflow: 'hidden',
        height: 'calc(100%)',
    },
    containerHorizontal: {
        overflow: 'hidden',
        height: '100%',
    },
    splitViewHorizontal: {
        height: '100%',
    },
    splitViewVertical: {
        height: 'calc(100% - 52px)',
    },
    paneHorizontal: {
        flex: 1,
        position: 'relative',
        border: '1px solid #e0e0e0',
        width: '50%',
    },
    paneVertical: {
        flex: 1,
        position: 'relative',
        border: '1px solid #e0e0e0',
        height: '50%',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    header: {
        mx: 1,
        overflow: 'hidden',
        width: '100%',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

const emptyArray = [];

const closeCompareFiles = (compareId: string, apiService: ApiService) => {
    const openedCompareFiles = apiService
        .getOpenedFiles()
        .filter((file) => file.compareId === compareId);
    const fileIds = openedCompareFiles.map((file) => file.fileId);
    openedCompareFiles.forEach((file) => {
        apiService.close(file.fileId);
    });
    return fileIds;
};

const Data: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);
    const ignoreColumnCase = useAppSelector(
        (state) => state.settings.compare.ignoreColumnCase,
    );
    const reorderCompareColumns = useAppSelector(
        (state) => state.settings.compare.reorderCompareColumns,
    );
    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );
    const currentFilter = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentCompareId] || undefined,
    );
    const page = useAppSelector(
        (state) =>
            state.ui.compare.info[currentCompareId]?.currentComparePage || 0,
    );
    const fileBase = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileBase,
    );
    const fileComp = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileComp,
    );
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.datasetDiff,
    );
    const commonCols = datasetDiff?.metadata.commonCols || emptyArray;
    const view = useAppSelector((state) => state.ui.compare.view);
    const settings = useAppSelector((state) => state.settings);
    const viewerSettings = {
        ...settings.viewer,
        denseHeader: true,
        disableSorting: true,
    };

    const [data, setData] = useState<{
        base: ITableData | null;
        comp: ITableData | null;
    }>({ base: null, comp: null });
    const [loading, setLoading] = useState(false);

    const baseRef = useRef<HTMLDivElement>(null);
    const compRef = useRef<HTMLDivElement>(null);

    const handleScroll =
        (source: 'base' | 'comp') => (e: React.UIEvent<HTMLDivElement>) => {
            const target =
                source === 'base' ? compRef.current : baseRef.current;
            if (target) {
                target.scrollTop = e.currentTarget.scrollTop;
                target.scrollLeft = e.currentTarget.scrollLeft;
            }
        };

    // Map column IDs to indices for quick lookup
    const colIndicesBase = useMemo(() => {
        const map = new Map<string, number>();
        if (data.base?.header) {
            data.base.header.forEach((col, index) => {
                map.set(col.id, index);
            });
        }
        return map;
    }, [data.base?.header]);

    const colIndicesComp = useMemo(() => {
        const map = new Map<string, number>();
        if (data.comp?.header) {
            data.comp.header.forEach((col, index) => {
                map.set(col.id, index);
            });
        }
        return map;
    }, [data.comp?.header]);

    const [goTo, setGoTo] = useState<{
        row: number | null;
        column: string | null;
        cellSelection: boolean;
    }>({ row: null, column: null, cellSelection: false });

    const handleSetGoTo = useCallback(
        (newGoTo: Partial<IUiControl['goTo']>) => {
            // Detect if page change is needed
            if (
                newGoTo.row !== null &&
                newGoTo.row !== undefined &&
                (newGoTo.row > pageSize * (page + 1) ||
                    newGoTo.row <= pageSize * page)
            ) {
                const newPage = newGoTo.row
                    ? Math.floor((newGoTo.row - 1) / pageSize)
                    : 0;
                dispatch(
                    setComparePage({
                        compareId: currentCompareId,
                        page: newPage,
                    }),
                );
            }
            setGoTo((prevGoTo) => ({
                ...prevGoTo,
                ...newGoTo,
            }));
        },
        [pageSize, page, dispatch, currentCompareId],
    );

    // Keep track of the last datasetDiff to avoid resetting goTo on unrelated updates
    const lastDatasetDiffRef = useRef<DatasetDiff | null>(null);
    // Set goTo to the first difference when diffs are available
    useEffect(() => {
        if (
            datasetDiff &&
            datasetDiff !== lastDatasetDiffRef.current &&
            datasetDiff.data.modifiedRows.length > 0
        ) {
            const firstDiffRow = datasetDiff.data.modifiedRows[0];
            if (Math.floor((firstDiffRow.rowBase || 0) / pageSize) !== page) {
                const newPage = Math.floor(
                    (firstDiffRow.rowBase || 0) / pageSize,
                );
                dispatch(
                    setComparePage({
                        compareId: currentCompareId,
                        page: newPage,
                    }),
                );
            }
            lastDatasetDiffRef.current = datasetDiff;
            // Column name here is base column name, so it will work correctly as navigation is handled by base dataset
            handleSetGoTo({
                row: (firstDiffRow.rowBase || 0) + 1,
                column: Object.keys(firstDiffRow.diff || {})[0] || null,
                cellSelection: true,
            });
        }
    }, [
        datasetDiff,
        handleSetGoTo,
        page,
        pageSize,
        dispatch,
        currentCompareId,
    ]);

    const handleChangePage = (_event, newPage: number) => {
        dispatch(
            setComparePage({ compareId: currentCompareId, page: newPage }),
        );
    };

    const { baseAnnotations, compAnnotations, baseDiffs } = useMemo(() => {
        if (colIndicesBase.size === 0 || !datasetDiff) {
            return { baseAnnotations: null, compAnnotations: null };
        }

        const baseMap = new Map<
            string,
            {
                text: string | React.ReactElement;
                color: string;
            }
        >();
        const compMap = new Map<
            string,
            {
                text: string | React.ReactElement;
                color: string;
            }
        >();

        const baseDiffsMap = new Map<
            number,
            {
                [colId: string]: {
                    baseVal: ItemDataArray[number];
                    compVal: ItemDataArray[number];
                    diff: React.ReactElement;
                };
            }
        >();

        datasetDiff?.data.modifiedRows.forEach((diffRow) => {
            const { rowBase, rowCompare, diff } = diffRow;
            if (diff) {
                // Add annotation for row
                baseMap.set(`${rowBase}`, {
                    text: `${Object.keys(diff).length} diffs`,
                    color: '',
                });
                const baseDiffsRow = {};
                Object.keys(diff).forEach((colId) => {
                    const baseColIndex = colIndicesBase.get(colId);
                    let compColIndex = colIndicesComp.get(colId);
                    if (ignoreColumnCase && compColIndex === undefined) {
                        // ColId is using base column names, so for the compare we need to get the corresponding index
                        // Try to find case-insensitive match
                        for (const [compColId, index] of colIndicesComp) {
                            if (
                                compColId.toLowerCase() === colId.toLowerCase()
                            ) {
                                compColIndex = index;
                                break;
                            }
                        }
                    }
                    if (
                        baseColIndex !== undefined &&
                        compColIndex !== undefined
                    ) {
                        const [baseVal, compVal] = diff[colId];
                        const diffParts = diffChars(
                            String(baseVal),
                            String(compVal),
                        );
                        const diffElement = (
                            <span>
                                {diffParts.map((part) => {
                                    const style = {
                                        backgroundColor: part.added
                                            ? 'lightgreen'
                                            : part.removed
                                              ? 'salmon'
                                              : 'transparent',
                                    };
                                    return (
                                        <span style={style}>{part.value}</span>
                                    );
                                })}
                            </span>
                        );

                        const diffElementBase = (
                            <Stack spacing={0} sx={{ flexWrap: 'wrap' }}>
                                <Typography variant="caption">
                                    {`Compare: ${String(compVal)}`}
                                </Typography>
                                {diffElement}
                            </Stack>
                        );
                        const diffElementComp = (
                            <Stack spacing={0} sx={{ flexWrap: 'wrap' }}>
                                <Typography variant="caption">
                                    {`Base: ${String(baseVal)}`}
                                </Typography>
                                {diffElement}
                            </Stack>
                        );

                        // Add annotation to base
                        // Note: DatasetView uses 1-based index for columns (0 is row number)
                        baseMap.set(`${rowBase}#${baseColIndex + 1}`, {
                            text: diffElementBase,
                            color: '',
                        });

                        // Add annotation to comp
                        compMap.set(`${rowCompare}#${compColIndex + 1}`, {
                            text: diffElementComp,
                            color: '',
                        });

                        // Add item to baseDiffs
                        baseDiffsRow[colId] = {
                            baseVal,
                            compVal,
                            diff: diffElement,
                        };
                    }
                });
                if (rowBase !== null) {
                    baseDiffsMap.set(rowBase, baseDiffsRow);
                }
            }
        });

        return {
            baseAnnotations: baseMap,
            compAnnotations: compMap,
            baseDiffs: baseDiffsMap,
        };
    }, [datasetDiff, colIndicesBase, colIndicesComp, ignoreColumnCase]);

    const currentlyLoading = useRef(false);

    useEffect(() => {
        const loadData = async () => {
            if (!fileBase || !fileComp || commonCols.length === 0) return;

            currentlyLoading.current = true;
            setLoading(true);
            try {
                // Close any previously opened compare files
                const closedFileIds = closeCompareFiles(
                    currentCompareId,
                    apiService,
                );
                if (closedFileIds.length > 0) {
                    dispatch(clearLoadedRecords({ fileIds: closedFileIds }));
                }
                // Load base file
                const fileBaseInfo = await apiService.openFile({
                    mode: 'local',
                    filePath: fileBase,
                    compareId: currentCompareId,
                    filterColumns: commonCols,
                });
                const newBaseData = await getData(
                    apiService,
                    fileBaseInfo.fileId,
                    page * pageSize,
                    pageSize,
                    settings,
                    commonCols,
                    currentFilter,
                );

                // Load compare file
                const fileCompInfo = await apiService.openFile({
                    mode: 'local',
                    filePath: fileComp,
                    compareId: currentCompareId,
                    filterColumns: commonCols,
                });
                const newCompData = await getData(
                    apiService,
                    fileCompInfo.fileId,
                    page * pageSize,
                    pageSize,
                    settings,
                    commonCols,
                    currentFilter,
                    true,
                );
                // Reorder columns to match data.base order
                if (reorderCompareColumns && newBaseData && newCompData) {
                    const baseColOrder = newBaseData.header.map((col) =>
                        col.id.toLowerCase(),
                    );
                    newCompData.header.sort(
                        (a, b) =>
                            baseColOrder.indexOf(a.id.toLowerCase()) -
                            baseColOrder.indexOf(b.id.toLowerCase()),
                    );
                }
                setData({ base: newBaseData, comp: newCompData });
                dispatch(
                    setCompareFileIds({
                        compareId: currentCompareId,
                        fileBaseId: fileBaseInfo.fileId,
                        fileCompId: fileCompInfo.fileId,
                    }),
                );
            } catch (error) {
                dispatch(
                    openSnackbar({
                        message: `Error loading comparison data: ${error}`,
                        type: 'error',
                    }),
                );
            } finally {
                currentlyLoading.current = false;
                setLoading(false);
            }
        };

        if (!currentlyLoading.current) {
            loadData();
            return () => {};
        }
        // If a load is already in progress, add a loop to wait and retry
        const interval = setInterval(() => {
            if (!currentlyLoading.current) {
                loadData();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [
        fileBase,
        fileComp,
        apiService,
        settings,
        dispatch,
        commonCols,
        page,
        pageSize,
        currentCompareId,
        currentFilter,
        reorderCompareColumns,
    ]);

    if (loading) {
        return (
            <Box sx={styles.loading}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data.base || !data.comp) {
        if (commonCols.length === 0) {
            return (
                <Box sx={styles.loading}>
                    <Typography>
                        No common columns to compare in the datasets.
                    </Typography>
                </Box>
            );
        }
        return (
            <Box sx={styles.loading}>
                <Typography>No data available</Typography>
            </Box>
        );
    }

    return (
        <Stack
            sx={
                view === 'horizontal'
                    ? styles.containerHorizontal
                    : styles.containerVertical
            }
        >
            <Stack
                sx={
                    view === 'horizontal'
                        ? styles.splitViewHorizontal
                        : styles.splitViewVertical
                }
                direction={view === 'horizontal' ? 'row' : 'column'}
            >
                <Box
                    sx={
                        view === 'horizontal'
                            ? styles.paneHorizontal
                            : styles.paneVertical
                    }
                >
                    <DatasetView
                        tableData={data.base}
                        isLoading={false}
                        key={`base-${view}`}
                        handleContextMenu={() => {}}
                        settings={viewerSettings}
                        containerRef={baseRef}
                        onScroll={handleScroll('base')}
                        goTo={goTo}
                        onSetGoTo={handleSetGoTo}
                        currentPage={page}
                        annotatedCells={baseAnnotations}
                    />
                </Box>
                <Box
                    sx={
                        view === 'horizontal'
                            ? styles.paneHorizontal
                            : styles.paneVertical
                    }
                >
                    <DatasetView
                        tableData={data.comp}
                        isLoading={false}
                        key={`comp-${view}`}
                        handleContextMenu={() => {}}
                        settings={viewerSettings}
                        containerRef={compRef}
                        onScroll={handleScroll('comp')}
                        annotatedCells={compAnnotations}
                        currentPage={page}
                    />
                </Box>
            </Stack>
            <BottomToolbar
                totalRecords={Math.min(
                    data.base.metadata.records,
                    data.comp.metadata.records,
                )}
                page={page}
                pageSize={pageSize}
                records={data.base.metadata.records}
                onPageChange={handleChangePage}
                diffs={baseDiffs || new Map()}
                onSetGoTo={handleSetGoTo}
            />
            <DifferencesModal
                datasetDiff={datasetDiff}
                handleSetGoTo={handleSetGoTo}
            />
        </Stack>
    );
};

export default Data;
