import React from 'react';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

const styles = {
    card: {
        width: 200,
        height: 150,
        transition: 'background-color 0.3s',
        backgroundColor: 'primary.main',
        '&:hover': {
            backgroundColor: `primary.dark`,
        },
    },
    cardContent: {
        color: 'grey.100',
        fontSize: 20,
    },
    cardIcon: {
        color: 'grey.100',
        fontSize: 50,
    },
};

const OpenNewCard: React.FC<{
    handleNewApi: () => void;
}> = ({ handleNewApi }) => {
    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleNewApi()}>
                <Stack
                    spacing={2}
                    justifyContent="center"
                    direction="column"
                    alignItems="center"
                >
                    <Typography variant="h3" sx={styles.cardContent}>
                        Add New API
                    </Typography>
                    <AddIcon sx={styles.cardIcon} />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default OpenNewCard;
