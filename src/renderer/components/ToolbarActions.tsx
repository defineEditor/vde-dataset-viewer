import React, { useCallback } from 'react';
import { Tooltip, IconButton, Stack } from '@mui/material';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import { setZoomLevel } from 'renderer/redux/slices/ui';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';

const styles = {
    main: {
        width: '100%',
    },
};

const ToolbarActions: React.FC = () => {
    const dispatch = useAppDispatch();
    const currentZoomLevel = useAppSelector((state) => state.ui.zoomLevel);

    const handleResetZoom = useCallback(() => {
        dispatch(setZoomLevel(0));
    }, [dispatch]);

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            {currentZoomLevel !== 0 && (
                <Tooltip title="Reset Zoom" enterDelay={1000}>
                    <IconButton
                        onClick={handleResetZoom}
                        id="resetZoom"
                        size="small"
                    >
                        <ZoomInMapIcon
                            sx={{
                                color: 'primary.main',
                            }}
                        />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
};

export default ToolbarActions;
