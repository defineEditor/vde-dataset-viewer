import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { IApiStudy } from 'interfaces/common';

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
    label: {
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
    standard: {
        marginBottom: 1,
    },
    menuButton: {
        position: 'absolute',
        bottom: 24,
        right: 5,
    },
};

const StudyCard: React.FC<{
    study: IApiStudy;
    currentStudyId: string | null;
    handleSelectStudy: (study: IApiStudy) => void;
}> = ({ study, handleSelectStudy, currentStudyId }) => {
    const selected = currentStudyId === study.studyOID;
    return (
        <Card sx={selected ? styles.cardSelected : styles.card}>
            <CardContent onClick={() => handleSelectStudy(study)}>
                <Typography gutterBottom sx={styles.label}>
                    {study.label}
                </Typography>
                <Typography variant="h5" component="div" sx={styles.name}>
                    {study.name}
                </Typography>
                <Typography
                    variant="caption"
                    component="div"
                    sx={styles.standard}
                >
                    {study.standards}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default StudyCard;
