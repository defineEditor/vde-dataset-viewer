import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { IApiRecord } from 'interfaces/store';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

const styles = {
    card: (theme) => ({
        width: 200,
        height: 150,
        backgroundColor: 'grey.200',
        transition: 'background-color 0.3s',
        '&:hover': {
            backgroundColor: `${theme.palette.primary.main}10`,
        },
        position: 'relative',
    }),
    cardSelected: (theme) => ({
        width: 200,
        height: 150,
        backgroundColor: `${theme.palette.primary.main}50`,
        transition: 'background-color 0.3s',
        '&:hover': {
            backgroundColor: `${theme.palette.primary.main}10`,
        },
        position: 'relative',
    }),
    cardContent: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 14,
    },
    cardTitle: {
        color: 'text.secondary',
        mb: 1.5,
    },
    attrs: {
        color: 'grey.700',
    },
    name: {
        marginBottom: 1,
    },
    menuButton: {
        position: 'absolute',
        bottom: 24,
        right: 5,
    },
};

const ApiCard: React.FC<{
    api: IApiRecord;
    selected: boolean;
    handleEditApi: (apiId: string) => void;
    handleDeleteApi: (apiId: string) => void;
    handleSelectApi: (apiId: string) => void;
}> = ({ api, selected, handleEditApi, handleDeleteApi, handleSelectApi }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setConfirmOpen(true);
        handleMenuClose();
    };

    const handleConfirmClose = () => {
        setConfirmOpen(false);
    };

    const handleConfirmDelete = () => {
        handleDeleteApi(api.id);
        setConfirmOpen(false);
    };

    const handleEditClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        handleEditApi(api.id);
        handleMenuClose();
    };

    const handleSelectClick = (_event: React.MouseEvent<HTMLElement>) => {
        handleSelectApi(api.id);
    };

    return (
        <>
            <Card sx={selected ? styles.cardSelected : styles.card}>
                <CardContent onClick={handleSelectClick}>
                    <Typography variant="h5" component="div" sx={styles.name}>
                        {api.name}
                    </Typography>
                    <Typography gutterBottom sx={styles.cardContent}>
                        {api.address}
                    </Typography>
                    <IconButton sx={styles.menuButton} onClick={handleMenuOpen}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleEditClick}>
                            <EditIcon
                                fontSize="small"
                                sx={{ marginRight: 1 }}
                            />
                            Edit
                        </MenuItem>
                        <MenuItem onClick={handleDeleteClick}>
                            <CloseIcon
                                fontSize="small"
                                sx={{ marginRight: 1 }}
                            />
                            Delete
                        </MenuItem>
                    </Menu>
                </CardContent>
            </Card>
            <Dialog open={confirmOpen} onClose={handleConfirmClose}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this API record?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmClose} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="primary"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ApiCard;
