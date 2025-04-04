import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openModal, setSelect } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';

interface HeaderContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: () => void;
    columnId: string;
}

const HeaderCellContextMenu: React.FC<HeaderContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    columnId,
}) => {
    const dispatch = useAppDispatch();

    const handleShowInfo = () => {
        dispatch(openModal({ type: modals.VARIABLEINFO, data: { columnId } }));
    };

    const handleSelect = () => {
        dispatch(setSelect({ column: columnId }));
    };

    return (
        <Menu
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
        >
            <MenuItem
                onClick={() => {
                    handleShowInfo();
                    onClose();
                }}
            >
                Variable Info
            </MenuItem>
            <MenuItem
                onClick={() => {
                    handleSelect();
                    onClose();
                }}
            >
                Select Column
            </MenuItem>
        </Menu>
    );
};

export default HeaderCellContextMenu;
