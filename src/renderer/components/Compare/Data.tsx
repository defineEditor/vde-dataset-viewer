import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import DatasetView from 'renderer/components/DatasetView';
import AppContext from 'renderer/utils/AppContext';
import { ITableData } from 'interfaces/common';
import { getData } from 'renderer/utils/readData';
import { diffChars } from 'diff';
import { openSnackbar } from 'renderer/redux/slices/ui';

const styles = {
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    splitView: {
        display: 'flex',
        flex: 1,
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

const Data: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();
    const fileBase = useAppSelector((state) => state.data.compare.fileBase);
    const fileComp = useAppSelector((state) => state.data.compare.fileComp);
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

    const { baseAnnotations, compAnnotations } = useMemo(() => {
        if (!baseData || !compData) {
            return { baseAnnotations: null, compAnnotations: null };
        }

        const baseMap = new Map<
            string,
            {
                text: string | React.ReactElement;
                color: string;
                showInCell?: boolean;
            }
        >();
        const compMap = new Map<
            string,
            {
                text: string | React.ReactElement;
                color: string;
                showInCell?: boolean;
            }
        >();

        // Map column IDs to indices for quick lookup
        const baseColIndices = new Map<string, number>();
        baseData.header.forEach((col, index) =>
            baseColIndices.set(col.id, index),
        );

        const compColIndices = new Map<string, number>();
        compData.header.forEach((col, index) =>
            compColIndices.set(col.id, index),
        );

        // Iterate through rows
        // Assuming rows are aligned by index for now
        const rowCount = Math.min(baseData.data.length, compData.data.length);

        for (let i = 0; i < rowCount; i++) {
            const baseRow = baseData.data[i];
            const compRow = compData.data[i];

            // Iterate through base columns and compare with corresponding comp columns
            baseData.header.forEach((col) => {
                const baseColIndex = baseColIndices.get(col.id);
                const compColIndex = compColIndices.get(col.id);

                if (baseColIndex !== undefined && compColIndex !== undefined) {
                    const baseVal = String(baseRow[col.id] ?? '');
                    const compVal = String(compRow[col.id] ?? '');

                    if (baseVal !== compVal) {
                        const diffParts = diffChars(baseVal, compVal);
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
                        baseMap.set(`${i}#${baseColIndex + 1}`, {
                            text: diffElement,
                            color: 'transparent', // Color is handled by diffElement
                            showInCell: true,
                        });

                        // Add annotation to comp
                        compMap.set(`${i}#${compColIndex + 1}`, {
                            text: diffElement,
                            color: 'transparent',
                            showInCell: true,
                        });
                    }
                }
            });
        }

        return { baseAnnotations: baseMap, compAnnotations: compMap };
    }, [baseData, compData]);

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
                    0,
                    1000,
                    settings,
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
                    0,
                    1000,
                    settings,
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
    }, [fileBase, fileComp, apiService, settings, dispatch]);

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
        <Box sx={styles.container}>
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
        </Box>
    );
};

export default Data;
