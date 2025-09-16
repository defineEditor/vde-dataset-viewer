import {
    openDataset,
    closeDataset,
    openSnackbar,
    setGoTo,
} from 'renderer/redux/slices/ui';
import { addRecent } from 'renderer/redux/slices/data';
import { openNewDataset } from 'renderer/utils/readData';

import { NewWindowProps, AppDispatch } from 'interfaces/common';
import ApiService from 'renderer/services/ApiService';

const handleOpenDataset = async (
    filePath: string,
    currentFileId: string,
    dispatch: AppDispatch,
    apiService: ApiService,
    newWindowProps?: NewWindowProps,
) => {
    try {
        // Check if the requested file is already open
        if (currentFileId) {
            const currentFile = apiService.getOpenedFiles(currentFileId)[0];
            if (currentFile && currentFile.path === filePath) {
                // We need to close it first
                dispatch(
                    closeDataset({
                        fileId: currentFileId,
                    }),
                );
                await apiService.close(currentFileId);
            }
        }
        const newDataInfo = await openNewDataset(apiService, 'local', filePath);
        if (newDataInfo.errorMessage) {
            if (newDataInfo.errorMessage !== 'cancelled') {
                dispatch(
                    openSnackbar({
                        type: 'error',
                        message: newDataInfo.errorMessage,
                    }),
                );
            }
            return;
        }
        dispatch(
            addRecent({
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                path: newDataInfo.path,
            }),
        );
        dispatch(
            openDataset({
                fileId: newDataInfo.fileId,
                type: newDataInfo.type,
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                mode: 'local',
                totalRecords: newDataInfo.metadata.records,
                currentFileId,
            }),
        );
        if (newWindowProps && newWindowProps.goTo) {
            dispatch(
                setGoTo({
                    column: newWindowProps.goTo.column,
                    row: newWindowProps.goTo.row,
                }),
            );
        }
    } catch (error) {
        if (error instanceof Error) {
            dispatch(
                openSnackbar({
                    message: `Error opening file: ${error.message || 'Unknown error'}`,
                    type: 'error',
                }),
            );
        }
    }
};

export default handleOpenDataset;
