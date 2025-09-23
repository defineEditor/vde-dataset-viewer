import React, { useState, useContext } from 'react';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AppContext from 'renderer/utils/AppContext';
import { ApiOpenedFileWithMetadata } from 'interfaces/api';

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
    label: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 14,
        height: 21,
    },
    typeXpt: {
        display: 'inline-block',
        height: 20,
        backgroundColor: 'warning.dark',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: 'grey.300',
        borderRadius: 8,
        pl: 1,
        pr: 1,
        mb: 1,
    },
    typeOther: {
        display: 'inline-block',
        backgroundColor: 'primary.main',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: 'grey.300',
        borderRadius: 8,
        height: 20,
        pl: 1,
        pr: 1,
        mb: 1,
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
    file: ApiOpenedFileWithMetadata;
    handleSelectFileClick: (_file: { fileId: string }) => void;
    handleDatasetClose: (_fileId: string) => void;
}> = ({ file, handleSelectFileClick, handleDatasetClose }) => {
    const { fileId, name, label, nCols, records, type } = file;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const typeStyle = type === 'xpt' ? styles.typeXpt : styles.typeOther;
    const { apiService } = useContext(AppContext);

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

    const handleOpenInNewWindowClick = (
        event: React.MouseEvent<HTMLElement>,
    ) => {
        event.stopPropagation();
        // Close the dataset in the current window
        handleDatasetClose(fileId);
        // Open the dataset in a new window
        apiService.openInNewWindow(file.path);
        handleMenuClose();
    };

    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleSelectFileClick({ fileId })}>
                <Typography gutterBottom sx={styles.label}>
                    {label}
                </Typography>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h5" component="div" sx={styles.name}>
                        {name}
                    </Typography>
                    <Typography variant="body2" sx={typeStyle}>
                        {type.toUpperCase()}
                    </Typography>
                </Stack>
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
                    <MenuItem onClick={handleOpenInNewWindowClick}>
                        <OpenInNewIcon
                            fontSize="small"
                            sx={{ marginRight: 1 }}
                        />
                        Open in New Window
                    </MenuItem>
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
