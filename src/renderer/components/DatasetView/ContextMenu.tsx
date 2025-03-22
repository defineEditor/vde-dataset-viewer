import React from 'react';
import { DatasetJsonMetadata } from 'interfaces/common';
import CellContextMenu from 'renderer/components/DatasetView/CellContextMenu';
import HeaderContextMenu from 'renderer/components/DatasetView/HeaderContextMenu';

interface ContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: () => void;
    value: string | number | boolean | null;
    columnId: string;
    metadata: DatasetJsonMetadata;
    isHeader?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    value,
    columnId,
    metadata,
    isHeader = false,
}) => {
    if (isHeader) {
        return (
            <HeaderContextMenu
                open={open}
                anchorPosition={anchorPosition}
                onClose={onClose}
                columnId={columnId}
            />
        );
    }
    return (
        <CellContextMenu
            open={open}
            anchorPosition={anchorPosition}
            onClose={onClose}
            value={value}
            columnId={columnId}
            metadata={metadata}
        />
    );
};

export default ContextMenu;
