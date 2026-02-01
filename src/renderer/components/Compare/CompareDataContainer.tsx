import React, { useState, useCallback } from 'react';
import DatasetView from 'renderer/components/DatasetView';
import ContextMenu from 'renderer/components/DatasetView/ContextMenu';
import {
    IHeaderCell,
    ITableData,
    IUiControl,
    SettingsViewer,
} from 'interfaces/common';

interface CompareDataContainerProps {
    tableData: ITableData | null;
    isLoading?: boolean;
    settings: SettingsViewer;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    annotatedCells: Map<
        string,
        {
            text: string | React.ReactElement;
            color: string;
        }
    > | null;
    currentPage: number;

    goTo?: {
        row: number | null;
        column: string | null;
        cellSelection: boolean;
    };
    onSetGoTo?: (newGoTo: Partial<IUiControl['goTo']>) => void;
}

const CompareDataContainer: React.FC<CompareDataContainerProps> = ({
    tableData,
    isLoading = false,
    settings,
    containerRef,
    onScroll,
    annotatedCells,
    currentPage,
    goTo = undefined,
    onSetGoTo = undefined,
}) => {
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
            if (columnIndex === 0 || !tableData) return; // Ignore row number column

            const rows = tableData.data;
            const header = tableData.header[columnIndex - 1];
            const value = rowIndex === -1 ? '' : rows[rowIndex][header.id];

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header,
                open: true,
                isHeader: rowIndex === -1,
            });
        },
        [tableData],
    );

    const handleCloseContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    };

    if (!tableData) return null;

    return (
        <>
            <DatasetView
                tableData={tableData}
                isLoading={isLoading}
                handleContextMenu={handleContextMenu}
                settings={settings}
                containerRef={containerRef}
                onScroll={onScroll}
                goTo={goTo}
                onSetGoTo={onSetGoTo}
                currentPage={currentPage}
                annotatedCells={annotatedCells}
            />
            <ContextMenu
                open={contextMenu.open}
                anchorPosition={contextMenu.position}
                onClose={handleCloseContextMenu}
                value={contextMenu.value}
                metadata={tableData.metadata}
                header={contextMenu.header}
                isHeader={contextMenu.isHeader}
                isCompare
            />
        </>
    );
};

export default CompareDataContainer;
