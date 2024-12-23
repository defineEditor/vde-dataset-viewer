import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { setPathname, openModal, setPage } from 'renderer/redux/slices/ui';
import { setData, addRecent } from 'renderer/redux/slices/data';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';
import { Typography } from '@mui/material';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
    dataset: {
        color: 'primary.main',
        fontWeight: 'bold',
        alignContent: 'center',
    },
};

const Header: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    const pathname = useAppSelector((state) => state.ui.pathname);

    const dsName = useAppSelector((state) => {
        const { currentFileId } = state.ui;
        if (state.data.openedFileIds[currentFileId]) {
            return state.data.openedFileIds[currentFileId].name;
        }
        return '';
    });

    const handleOpenClick = async () => {
        const newDataInfo = await openNewDataset(apiService);
        if (newDataInfo === null) {
            return;
        }
        dispatch(setData({ ...newDataInfo }));
        dispatch(
            addRecent({
                name: newDataInfo.metadata.name,
                label: newDataInfo.metadata.label,
                path: newDataInfo.path,
            }),
        );
        dispatch(
            setPathname({
                pathname: '/viewer',
                currentFileId: newDataInfo.fileId,
            }),
        );
        // Reset page for the new dataset
        dispatch(setPage(0));
    };

    const handleGoToClick = () => {
        dispatch(openModal({ type: 'GOTO', props: {} }));
    };

    const handleDataSetInfoClick = () => {
        dispatch(openModal({ type: 'DATASETINFO', props: {} }));
    };

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            <Typography variant="h6" sx={styles.dataset}>
                {dsName}
            </Typography>
            <Tooltip title="Open New Dataset" enterDelay={1000}>
                <IconButton onClick={handleOpenClick} id="open" size="medium">
                    <FileOpenOutlinedIcon
                        sx={{
                            color: 'primary.main',
                            fontSize: '24px',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Go to Line or Column" enterDelay={1000}>
                <IconButton
                    onClick={handleGoToClick}
                    id="goto"
                    size="medium"
                    disabled={pathname !== '/viewer'}
                >
                    <ShortcutIcon
                        sx={{
                            color: 'primary.main',
                            fontSize: '24px',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Tooltip title="Dataset Information" enterDelay={1000}>
                <IconButton
                    onClick={handleDataSetInfoClick}
                    id="datasetInfo"
                    size="medium"
                    disabled={pathname !== '/viewer'}
                >
                    <InfoIcon
                        sx={{
                            color: 'primary.main',
                            fontSize: '24px',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default Header;
