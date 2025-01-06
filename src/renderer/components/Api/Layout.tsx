import React, { useRef, useEffect, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Carousel from 'renderer/components/SelectDataset/Carousel';
import Box from '@mui/material/Box';
import { IApiRecord, IApiStudy, IApiStudyDataset } from 'interfaces/common';
import ApiCard from 'renderer/components/Api/ApiCard';
import OpenNewCard from 'renderer/components/Api/OpenNewCard';
import StudyCard from 'renderer/components/Api/StudyCard';
import DatasetCard from 'renderer/components/Api/DatasetCard';

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
    apiRecords: { [key: string]: IApiRecord };
    studies: IApiStudy[];
    datasets: IApiStudyDataset[];
    currentApiId: string | null;
    currentStudyId: string | null;
    handleNewApi: () => void;
    handleEditApi: (apiId: string) => void;
    handleDeleteApi: (apiId: string) => void;
    handleSelectApi: (apiId: string) => void;
    handleSelectStudy: (study: IApiStudy) => void;
    handleSelectDataset: (dataset: IApiStudyDataset) => void;
}> = ({
    apiRecords,
    studies,
    datasets,
    currentApiId,
    currentStudyId,
    handleNewApi,
    handleEditApi,
    handleDeleteApi,
    handleSelectApi,
    handleSelectStudy,
    handleSelectDataset,
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

    const apiRecordsArray = Object.values(apiRecords).sort(
        (a, b) => a.lastAccessDate - b.lastAccessDate,
    );

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
                    APIs
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    <OpenNewCard handleNewApi={handleNewApi} />
                    {apiRecordsArray.map((api) => (
                        <ApiCard
                            key={api.address}
                            api={api}
                            selected={api.id === currentApiId}
                            handleEditApi={handleEditApi}
                            handleDeleteApi={handleDeleteApi}
                            handleSelectApi={handleSelectApi}
                        />
                    ))}
                </Carousel>
            </Box>
            <Box sx={styles.section}>
                <Typography variant="h5" sx={styles.title}>
                    Studies
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    {studies.map((study) => (
                        <StudyCard
                            key={study.studyOID}
                            currentStudyId={currentStudyId}
                            study={study}
                            handleSelectStudy={handleSelectStudy}
                        />
                    ))}
                </Carousel>
            </Box>
            <Box sx={styles.section}>
                <Typography variant="h5" sx={styles.title}>
                    Datasets
                </Typography>
                <Carousel elementsToShow={numberOfElements}>
                    {datasets.map((dataset) => (
                        <DatasetCard
                            key={dataset.itemGroupOID}
                            dataset={dataset}
                            handleSelectDataset={handleSelectDataset}
                        />
                    ))}
                </Carousel>
            </Box>
        </Stack>
    );
};

export default Layout;
