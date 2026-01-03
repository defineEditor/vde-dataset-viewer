import React, { useEffect, useContext, useState, useCallback } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    openModal,
    openSnackbar,
    setIsComparing,
    closeCompare,
    setNewCompareInfo,
} from 'renderer/redux/slices/ui';
import { mainTaskTypes, modals } from 'misc/constants';
import Results from 'renderer/components/Compare/Results';
import AppContext from 'renderer/utils/AppContext';
import { CompareTask, DatasetDiff, TaskProgress } from 'interfaces/common';
import { addRecentCompare, setCompareData } from 'renderer/redux/slices/data';
import CompareProgress from 'renderer/components/Compare/CompareProgress';
import { getSimpleHash } from 'renderer/utils/getHash';

const styles = {
    loadingContainer: {
        height: '100%',
        width: '100%',
        backgroundColor: '#FFF',
    },
    selectContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    loading: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        display: 'flex',
        backgroundColor: '#FFF',
        flexDirection: 'column',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
    },
    sponsored: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#888',
        textAlign: 'center',
    },
    selectButton: {
        textTransform: 'none',
        padding: 0,
        marginRight: '4px',
        minWidth: 'auto',
        lineHeight: 1,
    },
};

const Compare: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const currentFilter = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentCompareId] || null,
    );

    const settings = useAppSelector((state) => state.settings.compare);

    const fileBase = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileBase,
    );
    const fileComp = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.fileComp,
    );
    const fileBaseUi = useAppSelector((state) => state.ui.compare.fileBase);
    const fileCompUi = useAppSelector((state) => state.ui.compare.fileComp);
    const isComparing = useAppSelector(
        (state) => state.ui.compare.info[currentCompareId]?.isComparing,
    );
    const startCompare = useAppSelector(
        (state) => state.ui.compare.startCompare,
    );
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.datasetDiff,
    );
    const [progress, setProgress] = useState<number>(0);
    const [issues, setIssues] = useState<number>(0);

    const handleSelectFiles = async () => {
        dispatch(openModal({ type: modals.SELECTCOMPARE, data: {} }));
    };

    const closeCompareFiles = useCallback(() => {
        const openedCompareFiles = apiService
            .getOpenedFiles()
            .filter((file) => file.compareId !== undefined);
        openedCompareFiles.forEach((file) => {
            apiService.close(file.fileId);
        });
    }, [apiService]);

    useEffect(() => {
        // When compare is closed, close the corresponding compare files
        if (!fileBase && !fileComp) {
            closeCompareFiles();
        }
    }, [fileBase, fileComp, closeCompareFiles]);

    useEffect(() => {
        if (startCompare) {
            // Close other compare files first
            closeCompareFiles();
            // Check both files are selected
            if (!fileBaseUi || !fileCompUi) {
                dispatch(
                    openSnackbar({
                        message: 'Not enough files selected for compare',
                        type: 'error',
                    }),
                );
                return () => {};
            }
            // Initiate the compare task
            const fileNameBase = fileBaseUi.split(/\/|\\/).pop() || fileBaseUi;
            const fileNameComp = fileCompUi.split(/\/|\\/).pop() || fileCompUi;
            const compareId = `compare-${fileNameBase}-${fileNameComp}-${getSimpleHash(fileBaseUi)}-${getSimpleHash(fileCompUi)}`;
            const task: CompareTask = {
                id: compareId,
                type: mainTaskTypes.COMPARE,
                fileBase: fileBaseUi,
                fileComp: fileCompUi,
                options: settings,
                fileSettings: { encoding: 'default', bufferSize: 10000 },
                filterData: currentFilter,
            };
            // Initiate info for this compare
            dispatch(setNewCompareInfo({ compareId }));
            // Add to recent compares
            dispatch(
                addRecentCompare({
                    fileBase: fileBaseUi,
                    fileComp: fileCompUi,
                }),
            );

            const unsubscribe = apiService.subscribeToTaskProgress(
                (info: TaskProgress) => {
                    if (
                        info.type !== mainTaskTypes.COMPARE ||
                        !info.id.startsWith(task.id)
                    ) {
                        return;
                    }
                    if (info.error) {
                        dispatch(
                            openSnackbar({
                                message: info.error,
                                type: 'error',
                            }),
                        );
                        dispatch(closeCompare({ compareId }));
                    } else if (info.progress === 100) {
                        setProgress(info.progress);
                        setIssues(info.issues);
                        if (info.error) {
                            dispatch(
                                openSnackbar({
                                    message: info.error,
                                    type: 'error',
                                }),
                            );
                        } else if (
                            info.result &&
                            typeof info.result === 'object'
                        ) {
                            dispatch(
                                setCompareData({
                                    compareId,
                                    datasetDiff: info.result as DatasetDiff,
                                    fileBase: fileBaseUi,
                                    fileComp: fileCompUi,
                                }),
                            );
                        }
                        dispatch(
                            setIsComparing({ compareId, isComparing: false }),
                        );
                    } else {
                        setProgress(info.progress);
                        setIssues(info.issues);
                    }
                },
            );

            const runTask = async () => {
                const result = await apiService.startTask(task);
                if (typeof result === 'object' && 'error' in result) {
                    dispatch(
                        openSnackbar({
                            message: result.error,
                            type: 'error',
                        }),
                    );
                    dispatch(closeCompare({ compareId }));
                } else if (result === false) {
                    dispatch(
                        openSnackbar({
                            message: 'Error while initiation compare',
                            type: 'error',
                        }),
                    );
                }
            };

            runTask();

            return () => {
                try {
                    unsubscribe();
                } catch (e) {
                    apiService.cleanTaskProgressListeners();
                }
            };
        }
        setProgress(0);
        return () => {};
    }, [
        apiService,
        startCompare,
        dispatch,
        fileBaseUi,
        fileCompUi,
        closeCompareFiles,
        currentFilter,
        settings,
    ]);

    if (isComparing) {
        return <CompareProgress progress={progress} issues={issues} />;
    }

    if (datasetDiff) {
        return <Results />;
    }

    if (!fileBase || !fileComp) {
        return (
            <Box sx={styles.selectContainer}>
                <Stack direction="row" alignItems="center">
                    <Button
                        sx={styles.selectButton}
                        onClick={handleSelectFiles}
                    >
                        Select
                    </Button>
                    <Box>files to start compare</Box>
                </Stack>
            </Box>
        );
    }

    return null;
};

export default Compare;
