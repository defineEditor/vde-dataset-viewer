import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { Box } from '@mui/material';
import { setGoTo, openModal } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import { DatasetJsonMetadata } from 'interfaces/common';
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

    const handleGoToClick = (column: string) => {
        dispatch(setGoTo({ column }));
        onClose();
    };

    const handleShowInfo = (id: string) => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: id },
            }),
        );
    };

    const containerRef = useRef<HTMLDivElement | null>(null);
    const containerWidth = useWidth(containerRef);
    const scrollbarWidth = useScrollbarWidth();

    const columnsData = convertMetadataToDataset(
        metadata,
        handleGoToClick,
        handleShowInfo,
        searchTerm,
        containerWidth - scrollbarWidth,
    );

    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        dynamicRowHeight: true,
        hideRowNumbers: true,
        showLabel: true,
    };

    return (
        <Box sx={styles.container} ref={containerRef}>
            <DatasetView
                key="report"
                tableData={columnsData}
                isLoading={false}
                settings={updatedSettings}
                handleContextMenu={() => {}}
                currentPage={0}
                currentMask={null}
            />
        </Box>
    );
};

export default ColumnsInfo;
