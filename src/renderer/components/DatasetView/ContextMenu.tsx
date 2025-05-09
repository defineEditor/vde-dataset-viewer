import React from 'react';
import { DatasetJsonMetadata, IHeaderCell } from 'interfaces/common';
import CellContextMenu from 'renderer/components/DatasetView/CellContextMenu';
import HeaderContextMenu from 'renderer/components/DatasetView/HeaderContextMenu';

interface ContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: () => void;
    value: string | number | boolean | null;
    metadata: DatasetJsonMetadata;
    header: IHeaderCell;
    isHeader?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    value,
    metadata,
    header,
    isHeader = false,
}) => {
    if (isHeader) {
        return (
            <HeaderContextMenu
                open={open}
                anchorPosition={anchorPosition}
                onClose={onClose}
                header={header}
            />
        );
    }
    return (
        <CellContextMenu
            open={open}
            anchorPosition={anchorPosition}
            onClose={onClose}
            value={value}
            metadata={metadata}
            header={header}
        />
    );
};

export default ContextMenu;
