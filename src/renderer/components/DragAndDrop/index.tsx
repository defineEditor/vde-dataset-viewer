import React, { useCallback, useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openDataset, openSnackbar } from 'renderer/redux/slices/ui';
import { addRecent } from 'renderer/redux/slices/data';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';
import Follower from 'renderer/components/DragAndDrop/Follower';

interface Props {
    children: React.ReactNode;
}

const DragAndDrop: React.FC<Props> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
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

            const filePath = window.electron.pathForFile(files[0]);
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
            setIsDragging(false);
        },
        [apiService, dispatch, currentFileId],
    );

    const handleDragOver = useCallback(
        (event: React.DragEvent) => {
            // Do not react in case there are no files being dragged
            const files = Array.from(event.dataTransfer.files);
            if (files.length === 0) {
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
