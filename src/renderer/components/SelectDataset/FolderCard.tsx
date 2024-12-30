import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

const styles = {
    card: (theme) => ({
        width: 200,
        height: 150,
        backgroundColor: 'grey.200',
        transition: 'background-color 0.3s',
        '&:hover': {
            backgroundColor: `${theme.palette.primary.main}10`,
        },
    }),
    path: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        textAlign: 'left',
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
    tooltip: {
        fontSize: 14,
    },
    label: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 14,
    },
};

const FileCard: React.FC<{
    path: string;
    handleRecentFolderClick: (_path: string) => void;
}> = ({ path, handleRecentFolderClick }) => {
    // Get folder name
    const delimiter = window.electron.isWindows ? '\\' : '/';

    const name = path.split(delimiter).pop();
    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleRecentFolderClick(path)}>
                <Typography variant="h5" component="div" sx={styles.name}>
                    {name}
                </Typography>
                <Tooltip title={path} sx={styles.tooltip}>
                    <Typography gutterBottom sx={styles.path}>
                        {path}
                    </Typography>
                </Tooltip>
            </CardContent>
        </Card>
    );
};

export default FileCard;
