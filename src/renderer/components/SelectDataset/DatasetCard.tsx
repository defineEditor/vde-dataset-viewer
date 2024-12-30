import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

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
};

const DatasetCard: React.FC<{
    fileId: string;
    name: string;
    label: string;
    nCols: number;
    records: number;
    handleSelectFileClick: (_file: { fileId: string }) => void;
}> = ({ fileId, name, label, nCols, records, handleSelectFileClick }) => {
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
            </CardContent>
        </Card>
    );
};

export default DatasetCard;
