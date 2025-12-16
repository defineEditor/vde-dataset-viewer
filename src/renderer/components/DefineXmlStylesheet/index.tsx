import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, Stack } from '@mui/material';
import AppContext from 'renderer/utils/AppContext';
import { DefineXmlContent } from 'interfaces/defineXml';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import StylesheetLayout from 'renderer/components/DefineXmlStylesheet/StylesheetLayout';
import handleOpenDataset from 'renderer/utils/handleOpenDataset';
import {
    openSnackbar,
    setDefineFileId,
    setDefineIsLoading,
} from 'renderer/redux/slices/ui';
import Loading from 'renderer/components/Loading';

const styles = {
    container: {
        height: '100%',
        width: '100%',
        backgroundColor: '#FFF',
    },
    loading: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        display: 'flex',
        backgroundColor: '#FFF',
        flexDirection: 'column',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
    },
    sponsored: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#888',
        textAlign: 'center',
    },
    openButton: {
        textTransform: 'none',
        padding: 0,
        marginRight: '4px',
        minWidth: 'auto',
        lineHeight: 1,
    },
};

const DefineXml: React.FC = () => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

    const [content, setContent] = useState<DefineXmlContent | null>(null);

    const currentFileId = useAppSelector(
        (state) => state.ui.define.currentFileId,
    );

    const isDefineLoading = useAppSelector(
        (state) => state.ui.define.isDefineLoading,
    );

    const currentDatasetFileId = useAppSelector(
        (state) => state.ui.currentFileId,
    );

    const handleOpenDefine = async () => {
        const fileInfo = await apiService.openDefineXml();

        if (fileInfo === null) {
            // User cancelled
            return;
        }

        dispatch(
            openSnackbar({
                type: 'info',
                message: `Loaded ${fileInfo.filename}`,
            }),
        );
        dispatch(setDefineFileId(fileInfo.fileId));
    };

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
                dispatch,
                apiService,
            );
        }
        // If it is a file, open it in the default application
        else {
            const result = await apiService.openFileInDefaultApp(filePath);
            if (result !== '') {
                dispatch(
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
                if ('error' in defineContent) {
                    dispatch(
                        openSnackbar({
                            type: 'error',
                            message: `Failed to load Define-XML content: ${defineContent.error}`,
                        }),
                    );
                    dispatch(setDefineFileId(null));
                    dispatch(setDefineIsLoading(false));
                    return;
                }
                setContent(defineContent);
            }
        };

        if (currentFileId) {
            dispatch(setDefineIsLoading(true));
            fetchDefineContent();
        }
    }, [currentFileId, apiService, dispatch]);

    if (!content) {
        if (isDefineLoading) {
            return (
                <Box sx={styles.container}>
                    <Box sx={styles.loading}>
                        <Loading />
                        <Box sx={styles.sponsored}>Sponsored by:</Box>
                    </Box>
                </Box>
            );
        }
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
            >
                <Stack direction="row" alignItems="center">
                    <Button sx={styles.openButton} onClick={handleOpenDefine}>
                        Open file
                    </Button>
                    <Box>or drag and drop it here a Define-XML</Box>
                </Stack>
            </Box>
        );
    }

    return <StylesheetLayout content={content} onOpenFile={handleOpenFile} />;
};

export default DefineXml;
