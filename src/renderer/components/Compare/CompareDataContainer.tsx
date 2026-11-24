import React, { useState, useCallback } from 'react';
import DatasetView from '@components/DatasetView';
import ContextMenu from '@components/DatasetView/ContextMenu';
import GroupedCompareTable from '@components/Compare/GroupedTable';
import {
    GroupedCompareRow,
    GroupMeta,
} from '@components/Compare/GroupedTable/alignGroups';
import {
    IHeaderCell,
    ITableData,
    IUiControl,
    SettingsViewer,
    TableRowValue,
} from '@interfaces/common';

interface GroupedCompareProps {
    alignedRows: GroupedCompareRow[];
    groupColIds: string[];
    groupMetaByKey: Map<string, GroupMeta>;
    side: 'base' | 'comp';
    expandedGroupKeys: Record<string, boolean>;
    onExpandedGroupKeysChange: (next: Record<string, boolean>) => void;
}

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
    grouped?: GroupedCompareProps | null;

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
    grouped = null,
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
        (
            event: React.MouseEvent,
            columnId: string,
            value: TableRowValue,
            isHeader?: boolean,
        ) => {
            event.preventDefault();
            if (columnId === '#' || !tableData?.header) return; // Ignore row number column

            const header = tableData.header.find((col) => col.id === columnId);

            if (!header) return;

            setContextMenu({
                position: { top: event.clientY, left: event.clientX },
                value,
                header,
                open: true,
                isHeader: isHeader || false,
            });
        },
        [tableData?.header],
    );

    const handleCloseContextMenu = () => {
        setContextMenu((prev) => ({ ...prev, open: false }));
    };

    if (!tableData) return null;

    const useGroupedView = grouped !== null && grouped.groupColIds.length > 0;

    return (
        <>
            {useGroupedView ? (
                <GroupedCompareTable
                    tableData={tableData}
                    alignedRows={grouped.alignedRows}
                    groupColIds={grouped.groupColIds}
                    groupMetaByKey={grouped.groupMetaByKey}
                    side={grouped.side}
                    expandedGroupKeys={grouped.expandedGroupKeys}
                    onExpandedGroupKeysChange={
                        grouped.onExpandedGroupKeysChange
                    }
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
            ) : (
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
            )}
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
