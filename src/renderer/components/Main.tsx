import React, { useEffect } from 'react';
import { AppProvider, Navigation, Router } from '@toolpad/core/AppProvider';
import { Theme, Stack, Avatar } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import CachedIcon from '@mui/icons-material/Cached';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import SelectDataset from 'renderer/components/SelectDataset';
import Api from 'renderer/components/Api';
import AppContext from 'renderer/utils/AppContext';
import ViewFile from 'renderer/components/ViewFile';
import Settings from 'renderer/components/Settings';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    setPathname,
    openDataset,
    closeDataset,
    openSnackbar,
} from 'renderer/redux/slices/ui';
import { AllowedPathnames } from 'interfaces/common';
import ViewerToolbar from 'renderer/components/ViewerToolbar';
import Shortcuts from 'renderer/components/Shortcuts';
import Converter from 'renderer/components/Converter';
import About from 'renderer/components/About';
import { paths } from 'misc/constants';
import { saveStore } from 'renderer/redux/stateUtils';
import { openNewDataset } from 'renderer/utils/readData';
import { addRecent } from 'renderer/redux/slices/data';

const styles = {
    main: {
        height: '100%',
        padding: 0,
    },
    logo: {
        width: 32,
        height: 32,
        marginTop: '3px',
        fontSize: 16,
        fontWeight: 500,
        color: '#1976d2',
        background:
            'radial-gradient(circle farthest-corner at right,#eeeeee,#c4c4c4)',
    },
};

const NAVIGATION: Navigation = [
    {
        kind: 'header',
        title: 'Viewer',
    },
    {
        segment: 'select',
        title: 'Viewer',
        icon: <WysiwygIcon />,
    },
    {
        segment: 'api',
        title: 'Connect to API',
        icon: <CloudIcon />,
    },
    {
        kind: 'divider',
    },
    {
        kind: 'header',
        title: 'Tools',
    },
    {
        segment: 'converter',
        title: 'Converter',
        icon: <CachedIcon />,
    },
    {
        kind: 'divider',
    },
    {
        kind: 'header',
        title: 'Miscellaneous',
    },
    {
        segment: 'settings',
        title: 'Settings',
        icon: <SettingsIcon />,
    },
    {
        segment: 'shortcuts',
        title: 'Shortcuts',
        icon: <KeyboardIcon />,
    },
    {
        segment: 'about',
        title: 'About',
        icon: <InfoIcon />,
    },
];

const Logo: React.FC = () => {
    return <Avatar sx={styles.logo}>{'{ ; }'}</Avatar>;
};

const Main: React.FC<{ theme: Theme }> = ({ theme }) => {
    const title = 'VDE Dataset Viewer';
    const dispatch = useAppDispatch();
    const { apiService } = React.useContext(AppContext);
    const pathname = useAppSelector((state) => state.ui.pathname);

    const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

    const isDataLoaded = useAppSelector(
        (state) => state.ui.currentFileId !== '',
    );

    const useAppRouter = (): Router => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path: string | URL) => {
                // Remove basePath from the path
                const updatedPath = String(path).replace(/^.*(\/\w+)$/, '$1');

                if (updatedPath === '/shortcuts') {
                    setShortcutsOpen(true);
                } else {
                    dispatch(
                        setPathname({
                            pathname: updatedPath as AllowedPathnames,
                        }),
                    );
                }
            },
        };
    };
    // Add shortcuts for routes
    useEffect(() => {
        const handleMainKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                switch (event.key) {
                    case 'F1':
                        dispatch(
                            setPathname({
                                pathname: paths.SELECT,
                            }),
                        );
                        break;
                    case 'F2':
                        dispatch(
                            setPathname({
                                pathname: paths.API,
                            }),
                        );
                        break;
                    case 'F3':
                        dispatch(
                            setPathname({
                                pathname: paths.CONVERTER,
                            }),
                        );
                        break;
                    case 'F4':
                        dispatch(
                            setPathname({
                                pathname: paths.SETTINGS,
                            }),
                        );
                        break;
                    case 'F5':
                        dispatch(
                            setPathname({
                                pathname: paths.ABOUT,
                            }),
                        );
                        break;
                    case 'F12':
                        saveStore(apiService);
                        break;

                    case '/':
                        event.preventDefault();
                        setShortcutsOpen(true);
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleMainKeyDown);

        return () => {
            window.removeEventListener('keydown', handleMainKeyDown);
        };
    }, [dispatch, apiService]);

    // Handle "Open With" file opening events from the OS
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    useEffect(() => {
        const handleFileOpen = async (filePath: string) => {
            try {
                // Check if the requested file is already open
                if (currentFileId) {
                    const currentFile =
                        apiService.getOpenedFiles(currentFileId)[0];
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

        window.electron.onFileOpen(handleFileOpen);

        // Clean up listener on unmount
        return () => {
            window.electron.removeFileOpenListener();
        };
    }, [apiService, dispatch, currentFileId]);

    return (
        <AppProvider
            navigation={NAVIGATION}
            theme={theme}
            router={useAppRouter()}
            branding={{ title, logo: <Logo /> }}
        >
            <DashboardLayout
                defaultSidebarCollapsed
                slots={
                    pathname === paths.VIEWFILE && isDataLoaded
                        ? {
                              appTitle: ViewerToolbar,
                          }
                        : {}
                }
            >
                <Stack sx={styles.main} id="main">
                    {pathname === paths.SELECT && <SelectDataset />}
                    {pathname === paths.VIEWFILE && isDataLoaded && (
                        <ViewFile />
                    )}
                    {pathname === paths.SETTINGS && <Settings />}
                    {pathname === paths.API && <Api />}
                    {pathname === paths.CONVERTER && <Converter />}
                    {pathname === paths.ABOUT && <About />}
                </Stack>
                <Shortcuts
                    open={shortcutsOpen}
                    onClose={() => setShortcutsOpen(false)}
                />
            </DashboardLayout>
        </AppProvider>
    );
};

export default Main;
