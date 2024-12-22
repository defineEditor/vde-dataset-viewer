import { useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    Typography,
    Stack,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
} from '@mui/material';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { setPathname } from 'renderer/redux/slices/ui';
import { setData, addRecent } from 'renderer/redux/slices/data';
import { openNewDataset } from 'renderer/utils/readData';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    main: {
        flex: '1 1 0',
        padding: 4,
    },
};

const SelectDataset = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const recentFiles = useAppSelector((state) => state.data.recentFiles);

    const handleOpenLocal = async () => {
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
    };

    // Open recent file
    const handleRecentFileClick = (file: {
        name: string;
        label: string;
        path: string;
    }) => {
        dispatch(
            setPathname({
                pathname: '/viewer',
                currentFileId: file.path,
            }),
        );
    };
    return (
        <Stack
            spacing={2}
            sx={styles.main}
            alignItems="center"
            justifyContent="center"
        >
            <Button
                onClick={handleOpenLocal}
                sx={{ width: '220px', height: '40px' }}
                color="primary"
                variant="contained"
                startIcon={
                    <Stack
                        alignItems="center"
                        justifyItems="center"
                        direction="row"
                        spacing={2}
                    >
                        <FileOpenOutlinedIcon
                            sx={{ height: '20px', width: '20px' }}
                        />
                        <Typography variant="button">Open File</Typography>
                    </Stack>
                }
            />
            <List
                sx={{
                    width: '100%',
                    maxWidth: 600,
                }}
            >
                {recentFiles.map((file) => (
                    <ListItemButton
                        onClick={() => {
                            handleRecentFileClick(file);
                        }}
                    >
                        <ListItem>
                            <ListItemText
                                primary={`${file.name} ${file.label}`}
                                secondary={file.path}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
            </List>
        </Stack>
    );
};

export default SelectDataset;
