import { useCallback, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openModal, openSnackbar, openDataset } from 'renderer/redux/slices/ui';
import Layout from 'renderer/components/Api/Layout';
import {
    removeApi,
    setCurrentApi,
    setCurrentStudy,
    setCurrentDataset,
    setStudies,
    setDatasets,
} from 'renderer/redux/slices/api';
import { modals } from 'misc/constants';
import AppContext from 'renderer/utils/AppContext';
import { IApiStudy, IApiStudyDataset } from 'interfaces/api';

const SelectDataset = () => {
    const dispatch = useAppDispatch();
    const apiRecords = useAppSelector((state) => state.api.apiRecords);
    const currentApiId = useAppSelector((state) => state.api.currentApiId);
    const currentStudyId = useAppSelector((state) => state.api.currentStudyId);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const { apiService } = useContext(AppContext);
    const studies = Object.values(useAppSelector((state) => state.api.studies));
    const datasets = Object.values(
        useAppSelector((state) => state.api.datasets),
    );

    const handleNewApi = useCallback(() => {
        dispatch(openModal({ type: modals.EDITAPI, data: { apiId: '' } }));
    }, [dispatch]);

    const handleEditApi = (apiId: string) => {
        dispatch(openModal({ type: modals.EDITAPI, data: { apiId } }));
    };

    const handleDeleteApi = (apiId: string) => {
        dispatch(removeApi(apiId));
    };

    const handleSelectApi = (apiId: string) => {
        const getStudies = async () => {
            const result = await apiService.getApiStudies(apiRecords[apiId]);
            if (result === null) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: 'Could not get studies',
                    }),
                );
                return;
            }
            dispatch(setCurrentApi(apiId));
            dispatch(setStudies(result));
        };

        getStudies();
    };

    const handleSelectStudy = (study: IApiStudy) => {
        const getDatasets = async () => {
            if (currentApiId === null) {
                return;
            }
            const result = await apiService.getApiDatasets(
                apiRecords[currentApiId],
                study,
            );
            if (result === null) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: 'Could not get datasets',
                    }),
                );
                return;
            }
            dispatch(setCurrentStudy(study.studyOID));
            dispatch(setDatasets(result));
        };

        getDatasets();
    };

    const handleSelectDataset = (dataset: IApiStudyDataset) => {
        const openRemoteDataset = async () => {
            if (currentApiId === null || currentStudyId === null) {
                return;
            }
            const currentStudy = studies.find(
                (study) => study.studyOID === currentStudyId,
            );
            if (currentStudy === undefined) {
                return;
            }
            const result = await apiService.openFile(
                'remote',
                undefined,
                undefined,
                {
                    api: apiRecords[currentApiId],
                    study: currentStudy,
                    dataset,
                },
            );
            const { errorMessage } = result;
            if (errorMessage) {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: errorMessage,
                    }),
                );
                return;
            }
            dispatch(setCurrentDataset(dataset.itemGroupOID));
            dispatch(
                openDataset({
                    fileId: result.fileId,
                    type: 'json',
                    mode: 'remote',
                    name: dataset.name,
                    label: dataset.label,
                    totalRecords: dataset.records,
                    currentFileId,
                }),
            );
        };

        openRemoteDataset();
    };

    return (
        <Layout
            apiRecords={apiRecords}
            studies={studies}
            datasets={datasets}
            currentApiId={currentApiId}
            currentStudyId={currentStudyId}
            handleNewApi={handleNewApi}
            handleEditApi={handleEditApi}
            handleDeleteApi={handleDeleteApi}
            handleSelectApi={handleSelectApi}
            handleSelectStudy={handleSelectStudy}
            handleSelectDataset={handleSelectDataset}
        />
    );
};

export default SelectDataset;
