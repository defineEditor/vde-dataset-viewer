import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { DefineXmlContent } from 'interfaces/defineXml';
import { getAnalysisResultDisplays } from '../utils/defineXmlHelpers';

interface AnalysisResultsProps {
    content: DefineXmlContent;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ content }) => {
    const analysisResults = getAnalysisResultDisplays(content);

    if (!content.arm || analysisResults.length === 0) {
        return null;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Analysis Results Metadata ({analysisResults.length})
            </Typography>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Analysis Results Metadata (ARM) implementation in
                    progress...
                </Typography>
            </Paper>
        </Box>
    );
};

export default AnalysisResults;
