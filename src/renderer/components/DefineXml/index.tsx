import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

const DefineXml = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            padding={3}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    textAlign: 'center',
                    maxWidth: 600,
                }}
            >
                <DescriptionIcon
                    sx={{
                        fontSize: 64,
                        color: 'primary.main',
                        marginBottom: 2,
                    }}
                />
                <Typography variant="h4" gutterBottom>
                    Define-XML Viewer
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    CDISC Define-XML 2.0 and 2.1 support coming soon.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    This section will allow you to view Define-XML metadata
                    files including study structure, dataset definitions,
                    variable definitions, code lists, and methods.
                </Typography>
            </Paper>
        </Box>
    );
};

export default DefineXml;
