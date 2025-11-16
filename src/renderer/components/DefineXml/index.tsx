import React, { useContext, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { DefineXmlContent } from 'interfaces/defineXml';
import { useAppSelector } from 'renderer/redux/hooks';
import DefineViewerLayout from 'renderer/components/DefineXml/DefineViewerLayout';

const DefineXml: React.FC = () => {
    const { apiService } = useContext(AppContext);

    const [content, setContent] = useState<DefineXmlContent | null>(null);

    const currentFileId = useAppSelector(
        (state) => state.ui.define.currentFileId,
    );

    useEffect(() => {
        const fetchDefineContent = async () => {
            if (currentFileId) {
                const defineContent =
                    await apiService.getDefineXmlContent(currentFileId);
                setContent(defineContent);
            }
        };

        fetchDefineContent();
    }, [currentFileId, apiService]);

    if (!content) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
            >
                No Define-XML content loaded
            </Box>
        );
    }

    return <DefineViewerLayout content={content} />;
};

export default DefineXml;
