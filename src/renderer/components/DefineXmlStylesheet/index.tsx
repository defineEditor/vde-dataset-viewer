import React, { useContext, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { DefineXmlContent } from 'interfaces/defineXml';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import StylesheetLayout from 'renderer/components/DefineXmlStylesheet/StylesheetLayout';
import handleOpenDataset from 'renderer/utils/handleOpenDataset';
import { openSnackbar } from 'renderer/redux/slices/ui';

const DefineXml: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const dispath = useAppDispatch();

    const [content, setContent] = useState<DefineXmlContent | null>(null);

    const currentFileId = useAppSelector(
        (state) => state.ui.define.currentFileId,
    );

    const currentDatasetFileId = useAppSelector(
        (state) => state.ui.currentFileId,
    );

    const handleOpenFile = async (
        event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ) => {
        event.preventDefault();
        // Get path of the current define file.
        const currentFile = apiService
            .getOpenedDefineFiles()
            .filter((file) => file.fileId === currentFileId);

        if (currentFile.length !== 1) {
            // Should be impossible
            return;
        }

        const definePath = currentFile[0].folder;
        const linkRelativePath = event.currentTarget.getAttribute('href');
        const delimiter = window.electron.isWindows ? '\\' : '/';

        const filePath = `${definePath}${delimiter}${linkRelativePath}`;

        // If it is a dataset, open it in the viewer
        if (
            filePath.toLowerCase().endsWith('.json') ||
            filePath.toLowerCase().endsWith('.ndjson') ||
            filePath.toLowerCase().endsWith('.dsjc') ||
            filePath.toLowerCase().endsWith('.xpt')
        ) {
            handleOpenDataset(
                filePath,
                currentDatasetFileId,
                dispath,
                apiService,
            );
        }
        // If it is a file, open it in the default application
        else {
            const result = await apiService.openFileInDefaultApp(filePath);
            if (result !== '') {
                dispath(
                    openSnackbar({
                        type: 'error',
                        message: `Failed to open file: ${result}`,
                    }),
                );
            }
        }
    };

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
                Open a Define-XML file or drag and drop it here
            </Box>
        );
    }

    return <StylesheetLayout content={content} onOpenFile={handleOpenFile} />;
};

export default DefineXml;
