import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import DatasetView from 'renderer/components/DatasetView';
import AppContext from 'renderer/utils/AppContext';
import { ITableData } from 'interfaces/common';
import { getData } from 'renderer/utils/readData';
import { diffChars } from 'diff';
import { openSnackbar, setComparePage } from 'renderer/redux/slices/ui';
import BottomToolbar from 'renderer/components/Compare/BottomToolbar';

const styles = {
    container: {
        height: '100%',
        overflow: 'hidden',
        flex: '1 1 auto',
    },
    splitView: {
        display: 'flex',
        flex: '1 1 auto',
        overflow: 'hidden',
    },
    horizontal: {
        flexDirection: 'row',
    },
    vertical: {
        flexDirection: 'column',
    },
    pane: {
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e0e0e0',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    header: {
        p: 1,
        backgroundColor: 'grey.100',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 'bold',
    },
};

const emptyArray = [];

const Data: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const pageSize = useAppSelector((state) => state.settings.viewer.pageSize);
    const page = useAppSelector(
        (state) => state.ui.compare.currentComparePage || 0,
    );
    const dispatch = useAppDispatch();
    const fileBase = useAppSelector((state) => state.data.compare.fileBase);
    const fileComp = useAppSelector((state) => state.data.compare.fileComp);
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.datasetDiff,
    );
    const commonCols = datasetDiff?.metadata.commonCols || emptyArray;
    const view = useAppSelector((state) => state.ui.compare.view);
    const settings = useAppSelector((state) => state.settings);

    const [baseData, setBaseData] = useState<ITableData | null>(null);
    const [compData, setCompData] = useState<ITableData | null>(null);
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
    const colIndices = useMemo(() => {
        const map = new Map<string, number>();
        if (baseData?.header) {
            baseData.header.forEach((col, index) => {
                map.set(col.id, index);
            });
        }
        return map;
    }, [baseData?.header]);

    const handleChangePage = (_event, newPage: number) => {
        dispatch(setComparePage(newPage));
    };

    const { baseAnnotations, compAnnotations } = useMemo(() => {
        if (colIndices.size === 0 || !datasetDiff) {
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

        datasetDiff?.data.modifiedRows.forEach((diffRow) => {
            const { rowBase, rowCompare, diff } = diffRow;
            if (diff) {
                Object.keys(diff).forEach((colId) => {
                    const baseColIndex = colIndices.get(colId);
                    const compColIndex = colIndices.get(colId);
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

                        // Add annotation to base
                        // Note: DatasetView uses 1-based index for columns (0 is row number)
                        baseMap.set(`${rowBase}#${baseColIndex + 1}`, {
                            text: diffElement,
                            color: '',
                        });

                        // Add annotation to comp
                        compMap.set(`${rowCompare}#${compColIndex + 1}`, {
                            text: diffElement,
                            color: '',
                        });
                    }
                });
            }
        });

        return { baseAnnotations: baseMap, compAnnotations: compMap };
    }, [datasetDiff, colIndices]);

    useEffect(() => {
        const loadData = async () => {
            if (!fileBase || !fileComp) return;

            setLoading(true);
            try {
                // Load base file
                const fileBaseInfo = await apiService.openFile(
                    'local',
                    fileBase,
                );
                const newBaseData = await getData(
                    apiService,
                    fileBaseInfo.fileId,
                    page * pageSize,
                    pageSize,
                    settings,
                    commonCols,
                );
                setBaseData(newBaseData);

                // Load compare file
                const fileCompInfo = await apiService.openFile(
                    'local',
                    fileComp,
                );
                const newCompData = await getData(
                    apiService,
                    fileCompInfo.fileId,
                    page * pageSize,
                    pageSize,
                    settings,
                    commonCols,
                );
                setCompData(newCompData);
            } catch (error) {
                dispatch(
                    openSnackbar({
                        message: `Error loading comparison data: ${error}`,
                        type: 'error',
                    }),
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [
        fileBase,
        fileComp,
        apiService,
        settings,
        dispatch,
        commonCols,
        page,
        pageSize,
    ]);

    if (loading) {
        return (
            <Box sx={styles.loading}>
                <CircularProgress />
            </Box>
        );
    }

    if (!baseData || !compData) {
        return (
            <Box sx={styles.loading}>
                <Typography>No data available</Typography>
            </Box>
        );
    }

    return (
        <Stack sx={styles.container}>
            <Box
                sx={{
                    ...styles.splitView,
                    ...(view === 'horizontal'
                        ? styles.horizontal
                        : styles.vertical),
                }}
            >
                <Box sx={styles.pane}>
                    <Box sx={styles.header}>Base: {fileBase}</Box>
                    <DatasetView
                        tableData={baseData}
                        isLoading={false}
                        handleContextMenu={() => {}}
                        settings={settings.viewer}
                        containerRef={baseRef}
                        onScroll={handleScroll('base')}
                        annotatedCells={baseAnnotations}
                    />
                </Box>
                <Box sx={styles.pane}>
                    <Box sx={styles.header}>Compare: {fileComp}</Box>
                    <DatasetView
                        tableData={compData}
                        isLoading={false}
                        handleContextMenu={() => {}}
                        settings={settings.viewer}
                        containerRef={compRef}
                        onScroll={handleScroll('comp')}
                        annotatedCells={compAnnotations}
                    />
                </Box>
            </Box>
            <BottomToolbar
                totalRecords={Math.min(
                    baseData.metadata.records,
                    compData.metadata.records,
                )}
                page={page}
                pageSize={pageSize}
                records={baseData.metadata.records}
                onPageChange={handleChangePage}
                issuesByRow={null}
            />
        </Stack>
    );
};

export default Data;
