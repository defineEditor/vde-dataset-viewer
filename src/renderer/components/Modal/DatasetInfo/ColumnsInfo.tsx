import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { Box } from '@mui/material';
import { setGoTo, openModal } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import { DatasetJsonMetadata, ITableData, ITableRow } from 'interfaces/common';
import DatasetView from 'renderer/components/DatasetView';
import convertMetadataToDataset from 'renderer/components/Modal/DatasetInfo/convertMetadataToDataset';
import useWidth from 'renderer/components/hooks/useWidth';
import useScrollbarWidth from 'renderer/components/hooks/useScrollbarWidth';

const styles = {
    container: {
        height: '100%',
    },
};

const ColumnsInfo: React.FC<{
    metadata: DatasetJsonMetadata;
    onClose: () => void;
    searchTerm: string;
}> = ({ metadata, onClose, searchTerm }) => {
    const dispatch = useAppDispatch();
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    // Get width for the table
    const containerRef = useRef<HTMLDivElement | null>(null);
    const containerWidth = useWidth(containerRef);
    const scrollbarWidth = useScrollbarWidth();

    const [columnsData, setColumnsData] = useState<ITableData | null>(null);

    const handleGoToClick = useCallback(
        (column: string) => {
            dispatch(setGoTo({ fileId: currentFileId, column }));
            onClose();
        },
        [dispatch, onClose, currentFileId],
    );

    const handleShowInfo = useCallback(
        (id: string) => {
            dispatch(
                openModal({
                    type: modals.VARIABLEINFO,
                    data: { columnId: id },
                }),
            );
        },
        [dispatch],
    );

    useEffect(() => {
        setColumnsData(
            convertMetadataToDataset(
                metadata,
                handleGoToClick,
                handleShowInfo,
                containerWidth - scrollbarWidth,
            ),
        );
    }, [
        metadata,
        handleGoToClick,
        handleShowInfo,
        containerWidth,
        scrollbarWidth,
    ]);

    // Search update
    useEffect(() => {
        if (!columnsData?.header) return;

        const filteredData: ITableRow[] = metadata.columns
            .map(
                (column, index) =>
                    ({ '#': index + 1, ...column }) as unknown as ITableRow,
            )
            .filter((column) => {
                if (!searchTerm) {
                    return true;
                }

                const searchTermLower = searchTerm.toLowerCase();
                return columnsData?.header.some((item) => {
                    const value = column[item.id];
                    return (
                        value !== null &&
                        value !== undefined &&
                        String(value).toLowerCase().includes(searchTermLower)
                    );
                });
            });
        setColumnsData((prev) =>
            prev ? { ...prev, data: filteredData } : null,
        );
    }, [metadata.columns, searchTerm, columnsData?.header]);

    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        dynamicRowHeight: true,
        hideRowNumbers: false,
        showLabel: true,
    };

    return (
        <Box sx={styles.container} ref={containerRef}>
            {columnsData !== null && containerWidth !== 0 && (
                <DatasetView
                    key="report"
                    tableData={columnsData}
                    isLoading={false}
                    settings={updatedSettings}
                    handleContextMenu={() => {}}
                    currentPage={0}
                    currentMask={null}
                />
            )}
        </Box>
    );
};

export default ColumnsInfo;
