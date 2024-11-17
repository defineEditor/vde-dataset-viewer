import React, { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import HomeIcon from '@mui/icons-material/Home';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { setView } from 'renderer/redux/slices/ui';
import { setData, addRecent } from 'renderer/redux/slices/data';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';

const Header: React.FC = () => {
    const dispatch = useAppDispatch();
    const apiService = useContext(AppContext).apiService;

    const handleHomeClick = () => {
        dispatch(setView({ view: 'select' }));
    };

    const handleOpenClick = async () => {
        const newDataInfo = await openNewDataset(apiService);
        if (newDataInfo === null) {
            return;
        }
        dispatch(setData({ ...newDataInfo }));
        dispatch(
            addRecent({
                name: newDataInfo.name,
                label: newDataInfo.label,
                path: `/some/path/to/file/{name}.json`,
            })
        );
        dispatch(setView({ view: 'view', currentFileId: newDataInfo.fileId }));
        // To implement
    };

    const handleCloudClick = () => {
        // To implement
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: 'background.paper',
            }}
        >
            <Toolbar>
                <Stack
                    sx={{ width: '100%' }}
                    direction="row"
                    justifyContent="flex-start"
                >
                    <IconButton
                        onClick={handleHomeClick}
                        id="home"
                        size="medium"
                    >
                        <HomeIcon
                            sx={{
                                color: 'primary.main',
                                fontSize: '32px',
                            }}
                        />
                    </IconButton>
                    <IconButton
                        onClick={handleOpenClick}
                        id="open"
                        size="medium"
                    >
                        <FileOpenOutlinedIcon
                            sx={{
                                color: 'primary.main',
                                fontSize: '32px',
                            }}
                        />
                    </IconButton>
                    <IconButton
                        onClick={handleCloudClick}
                        id="cloud"
                        size="medium"
                    >
                        <CloudDownloadOutlinedIcon
                            sx={{
                                color: 'primary.main',
                                fontSize: '32px',
                            }}
                        />
                    </IconButton>
                </Stack>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
