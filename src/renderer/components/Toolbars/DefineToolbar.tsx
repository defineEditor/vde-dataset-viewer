import React, { useContext, useCallback } from 'react';
import { Tooltip, IconButton, Stack } from '@mui/material';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar, setDefineFileId } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
};

const DefineToolbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);
    const handleOpenClick = useCallback(async () => {
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
    }, [apiService, dispatch]);

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            <Tooltip title="Open Define-XML" enterDelay={1000}>
                <IconButton
                    onClick={handleOpenClick}
                    id="openDefine"
                    size="small"
                >
                    <FileOpenOutlinedIcon
                        sx={{
                            color: 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default DefineToolbar;
