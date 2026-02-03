import React, { useCallback, useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openDataset,
    openSnackbar,
    setDefineFileId,
    setPathname,
} from 'renderer/redux/slices/ui';
import { addRecent, setValidatorData } from 'renderer/redux/slices/data';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';
import Follower from 'renderer/components/DragAndDrop/Follower';
import { paths } from 'misc/constants';
import { FileInfo } from 'interfaces/common';

interface Props {
    children: React.ReactNode;
}

const DragAndDrop: React.FC<Props> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentPathname = useAppSelector((state) => state.ui.pathname);
    const dragoverAnimation = useAppSelector(
        (state) => state.settings.other.dragoverAnimation,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleDrop = useCallback(
        async (event: React.DragEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const files = Array.from(event.dataTransfer.files);
            if (files.length === 0) {
                setIsDragging(false);
                return;
            }

            // If we are in converter, add files for conversion
            if (currentPathname === paths.VALIDATOR) {
                const showOutputName = false;
                const filePaths = files.map((file) =>
                    apiService.getPathForFile(file),
                );
                const result = await apiService.getFilesInfo(filePaths);

                const newFiles = result.map((file: FileInfo) => ({
                    ...file,
                    id: `${file.folder}/${file.filename}`,
                    outputName: showOutputName ? '' : file.filename,
                }));
                dispatch(
                    setValidatorData({
                        selectedFiles: newFiles,
                    }),
                );
            } else {
                files.forEach(async (file) => {
                    const filePath = window.electron.pathForFile(file);
                    // Detect type of the file
                    const fileExtension = filePath
                        .split('.')
                        .pop()
                        ?.toLowerCase();

                    if (
                        fileExtension === 'xpt' ||
                        fileExtension === 'json' ||
                        fileExtension === 'ndjson' ||
                        fileExtension === 'sas7bdat' ||
                        fileExtension === 'dsjc'
                    ) {
                        const newDataInfo = await openNewDataset(
                            apiService,
                            'local',
                            filePath,
                        );

                        if (newDataInfo.errorMessage) {
                            if (newDataInfo.errorMessage !== 'cancelled') {
                                dispatch(
                                    openSnackbar({
                                        type: 'error',
                                        message: newDataInfo.errorMessage,
                                    }),
                                );
                            }
                            setIsDragging(false);
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
                    } else if (fileExtension === 'xml') {
                        // Define-XML file
                        const fileInfo =
                            await apiService.openDefineXml(filePath);
                        if (fileInfo === null) {
                            return;
                        }

                        dispatch(
                            openSnackbar({
                                type: 'info',
                                message: `Opening ${fileInfo.filename}`,
                            }),
                        );
                        dispatch(setDefineFileId(fileInfo.fileId));
                        dispatch(
                            setPathname({
                                pathname: paths.DEFINEXML,
                            }),
                        );
                    } else {
                        // Unsupported file type
                        dispatch(
                            openSnackbar({
                                type: 'error',
                                message: `Type .${fileExtension} is not supported.`,
                            }),
                        );
                    }
                });
            }

            setIsDragging(false);
        },
        [apiService, dispatch, currentFileId, currentPathname],
    );

    const handleDragOver = useCallback(
        (event: React.DragEvent) => {
            // Do not react in case there are no files being dragged
            const isFiles = event.dataTransfer.types.includes('Files');
            if (!isFiles) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
            if (dragoverAnimation) {
                setMousePos({ x: event.clientX, y: event.clientY });
            }
        },
        [dragoverAnimation],
    );

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    return (
        <div
            aria-label="drag-and-drop"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ width: '100%', height: '100%' }}
        >
            {dragoverAnimation && isDragging ? (
                <Follower mouseX={mousePos.x} mouseY={mousePos.y} />
            ) : (
                children
            )}
        </div>
    );
};

export default DragAndDrop;
