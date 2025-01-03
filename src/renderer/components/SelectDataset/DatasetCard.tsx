import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';

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

const DatasetCard: React.FC<{
    fileId: string;
    name: string;
    label: string;
    nCols: number;
    records: number;
    handleSelectFileClick: (_file: { fileId: string }) => void;
    handleDatasetClose: (_fileId: string) => void;
}> = ({
    fileId,
    name,
    label,
    nCols,
    records,
    handleSelectFileClick,
    handleDatasetClose,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCloseClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        handleDatasetClose(fileId);
        handleMenuClose();
    };

    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleSelectFileClick({ fileId })}>
                <Typography gutterBottom sx={styles.cardContent}>
                    {label}
                </Typography>
                <Typography variant="h5" component="div" sx={styles.name}>
                    {name}
                </Typography>
                <Typography variant="body2" sx={styles.attrs}>
                    {nCols} columns
                </Typography>
                <Typography variant="body2" sx={styles.attrs}>
                    {records} records
                </Typography>
                <IconButton sx={styles.menuButton} onClick={handleMenuOpen}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleCloseClick}>
                        <CloseIcon fontSize="small" sx={{ marginRight: 1 }} />
                        Close
                    </MenuItem>
                </Menu>
            </CardContent>
        </Card>
    );
};

export default DatasetCard;
