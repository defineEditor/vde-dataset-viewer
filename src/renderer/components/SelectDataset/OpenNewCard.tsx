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
    stackCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
};

const OpenNewCard: React.FC<{
    handleOpenLocal: () => void;
}> = ({ handleOpenLocal }) => {
    return (
        <Card sx={styles.card}>
            <CardContent onClick={() => handleOpenLocal()}>
                <Stack spacing={2} direction="column" sx={styles.stackCenter}>
                    <Typography variant="h3" sx={styles.cardContent}>
                        Open New File
                    </Typography>
                    <AddIcon sx={styles.cardIcon} />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default OpenNewCard;
