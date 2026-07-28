import React from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import Box from '@mui/material/Box';
import DialogTitle, { DialogTitleProps } from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Stack } from '@mui/material';
import { useAppDispatch } from '@redux/hooks';
import { openModal } from '@redux/slices/ui';
import { HelpModalId } from '@interfaces/common';
import { modals } from '@/misc/constants';

const styles = {
    layout: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
    },
    title: {
        flex: 1,
        minWidth: 0,
    },
    button: {
        color: 'inherit',
    },
};

interface ModalTitleProps extends DialogTitleProps {
    title: string;
    onClose: () => void;
    helpId?: HelpModalId | null;
}

const ModalTitle: React.FC<ModalTitleProps> = ({
    title,
    onClose,
    helpId = null,
    ...dialogTitleProps
}) => {
    const dispatch = useAppDispatch();

    const handleOpenHelp = () => {
        if (!helpId) {
            return;
        }
        dispatch(
            openModal({
                type: modals.HELP,
                data: { helpId },
            }),
        );
    };

    return (
        <DialogTitle {...dialogTitleProps}>
            <Box sx={styles.layout}>
                <Box sx={styles.title}>{title}</Box>
                <Stack direction="row" spacing={1}>
                    {helpId && (
                        <Tooltip title="Open help">
                            <IconButton
                                aria-label="Open help"
                                onClick={handleOpenHelp}
                                sx={styles.button}
                            >
                                <HelpOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Close">
                        <IconButton
                            aria-label="Close"
                            onClick={onClose}
                            sx={styles.button}
                        >
                            <CloseOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
        </DialogTitle>
    );
};

export default ModalTitle;
