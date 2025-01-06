import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IApiStudyDataset } from 'interfaces/api';

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
    dataset: IApiStudyDataset;
    handleSelectDataset: (dataset: IApiStudyDataset) => void;
}> = ({ dataset, handleSelectDataset }) => {
    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleSelectDataset(dataset)}>
                <Typography gutterBottom sx={styles.cardContent}>
                    {dataset.label}
                </Typography>
                <Typography variant="h5" component="div" sx={styles.name}>
                    {dataset.name}
                </Typography>
                <Typography variant="body2" sx={styles.attrs}>
                    {dataset.records} records
                </Typography>
            </CardContent>
        </Card>
    );
};

export default DatasetCard;
