import React, { useRef, useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Carousel from 'renderer/components/SelectDataset/Carousel';
import Box from '@mui/material/Box';
import { DatasetType, IRecentFile } from 'interfaces/common';
import FileCard from 'renderer/components/SelectDataset/FileCard';
import FolderCard from 'renderer/components/SelectDataset/FolderCard';
import DatasetCard from './DatasetCard';
import OpenNewCard from './OpenNewCard';

const styles = {
    main: {
        width: '100%',
        padding: '16px',
        height: '100%',
        userSelect: 'none',
    },
    title: {
        marginBottom: '16px',
        width: '100%',
        textAlign: 'center',
        pb: 2,
        pt: 2,
        color: 'grey.600',
        textShadow:
            '0px 1px 0px rgba(255,255,255,.7), 0px -1px 0px rgba(0,0,0,.7)',
    },
    section: {
        width: '100%',
    },
};

const Layout: React.FC<{
    openedFiles: {
        name: string;
        fileId: string;
        label: string;
        nCols: number;
        records: number;
        type: DatasetType;
    }[];
    recentFiles: IRecentFile[];
    recentFolders: string[];

    handleOpenLocal: (_filePath?: string, _folderPath?: string) => void;
    handleSelectFileClick: (_file: { fileId: string }) => void;
    handleRecentFileClick: (_file: {
        name: string;
        path: string;
        label: string;
    }) => void;
    handleRecentFolderClick: (_folder: string) => void;
    handleDatasetClose: (_fileId: string) => void;
}> = ({
    openedFiles,
    recentFiles,
    recentFolders,
    handleOpenLocal,
    handleSelectFileClick,
    handleRecentFileClick,
    handleRecentFolderClick,
    handleDatasetClose,
}) => {
    const stackRef = useRef<HTMLDivElement>(null);
    const [numberOfElements, setNumberOfElements] = useState<number>(10);

    useEffect(() => {
        const updateNumberOfElements = () => {
            if (stackRef.current) {
                setNumberOfElements(
                    Math.floor((stackRef.current.offsetWidth - 80 - 16) / 216),
                );
            }
        };

        updateNumberOfElements();
        window.addEventListener('resize', updateNumberOfElements);

        return () => {
            window.removeEventListener('resize', updateNumberOfElements);
        };
    }, []);

    return (
        <Stack
            ref={stackRef}
            spacing={2}
            sx={styles.main}
            alignItems="flex-start"
            justifyContent="flex-start"
        >
            <Box sx={styles.section}>
                <Typography variant="h5" sx={styles.title}>
                    Opened Datasets
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    <OpenNewCard handleOpenLocal={handleOpenLocal} />
                    {openedFiles.reverse().map((file) => (
                        <DatasetCard
                            key={file.fileId}
                            file={file}
                            handleDatasetClose={handleDatasetClose}
                            handleSelectFileClick={handleSelectFileClick}
                        />
                    ))}
                </Carousel>
            </Box>
            <Box sx={styles.section}>
                <Typography variant="h5" sx={styles.title}>
                    Recent Datasets
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    {recentFiles.map((file) => (
                        <FileCard
                            key={file.path}
                            path={file.path}
                            name={file.name}
                            label={file.label}
                            handleRecentFileClick={handleRecentFileClick}
                        />
                    ))}
                </Carousel>
            </Box>
            <Box sx={styles.section}>
                <Typography variant="h5" sx={styles.title}>
                    Recent Folders
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    {recentFolders.map((folder) => (
                        <FolderCard
                            path={folder}
                            key={folder}
                            handleRecentFolderClick={handleRecentFolderClick}
                        />
                    ))}
                </Carousel>
            </Box>
        </Stack>
    );
};

export default Layout;
