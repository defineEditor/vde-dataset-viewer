import React from 'react';
import { Box, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const UnderConstruction: React.FC = () => (
    <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        height="100%"
    >
        <ConstructionIcon
            sx={{ fontSize: 70, marginBottom: 2, color: 'grey.600' }}
        />
        <Typography variant="h6" sx={{ color: 'grey.700' }}>
            This functionality is in development
        </Typography>
    </Box>
);

export default UnderConstruction;
