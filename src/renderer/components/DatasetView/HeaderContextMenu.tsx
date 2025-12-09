import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openModal, setSelect } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import { IHeaderCell } from 'interfaces/common';

interface HeaderContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: (
        event: {},
        reason: 'backdropClick' | 'escapeKeyDown' | 'action',
    ) => void;
    header: IHeaderCell;
}

const HeaderCellContextMenu: React.FC<HeaderContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    header,
}) => {
    const dispatch = useAppDispatch();
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const handleShowInfo = () => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: header.id },
            }),
        );
    };

    const handleSelect = () => {
        dispatch(setSelect({ fileId: currentFileId, column: header.id }));
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
                    onClose({}, 'action');
                }}
            >
                Column Info
            </MenuItem>
            <MenuItem
                onClick={() => {
                    handleSelect();
                    onClose({}, 'action');
                }}
            >
                Select Column
            </MenuItem>
        </Menu>
    );
};

export default HeaderCellContextMenu;
