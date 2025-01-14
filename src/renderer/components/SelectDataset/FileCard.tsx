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
        height: 21,
    },
    extensionXpt: {
        display: 'inline-block',
        backgroundColor: 'warning.dark',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: 'grey.300',
        borderRadius: 8,
        pl: 1,
        pr: 1,
    },
    extensionOther: {
        display: 'inline-block',
        backgroundColor: 'primary.main',
        fontFamily: 'monospace',
        fontWeight: '500',
        color: 'grey.300',
        borderRadius: 8,
        pl: 1,
        pr: 1,
    },
};

const FileCard: React.FC<{
    path: string;
    name: string;
    label: string;
    handleRecentFileClick: (_file: {
        name: string;
        path: string;
        label: string;
    }) => void;
}> = ({ name, path, label, handleRecentFileClick }) => {
    const extension = path.split('.').pop()?.toUpperCase();
    const extensionStyle =
        extension === 'XPT' ? styles.extensionXpt : styles.extensionOther;

    return (
        <Card sx={styles.card}>
            <CardContent
                onClick={() => handleRecentFileClick({ name, path, label })}
            >
                <Typography gutterBottom sx={styles.label}>
                    {label}
                </Typography>
                <Typography variant="h5" component="div" sx={styles.name}>
                    {name}
                </Typography>
                <Tooltip title={path} sx={styles.tooltip}>
                    <Typography gutterBottom sx={styles.path}>
                        {path}
                    </Typography>
                </Tooltip>
                <Typography variant="body2" sx={extensionStyle}>
                    {extension}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default FileCard;
