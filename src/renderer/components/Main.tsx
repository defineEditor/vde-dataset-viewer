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
import ViewFile from 'renderer/components/ViewFile';
import Settings from 'renderer/components/Settings';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { setPathname } from 'renderer/redux/slices/ui';
import { AllowedPathnames } from 'interfaces/common';
import ViewerToolbar from 'renderer/components/ViewerToolbar';

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
    const pathname = useAppSelector((state) => state.ui.pathname);
    const isDataLoaded = useAppSelector(
        (state) => state.ui.currentFileId !== '',
    );

    const useAppRouter = (): Router => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path: string | URL) => {
                dispatch(
                    setPathname({
                        pathname: String(path) as AllowedPathnames,
                    }),
                );
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
                                pathname: '/select',
                            }),
                        );
                        break;
                    case 'F2':
                        dispatch(
                            setPathname({
                                pathname: '/api',
                            }),
                        );
                        break;
                    case 'F3':
                        dispatch(
                            setPathname({
                                pathname: '/converter',
                            }),
                        );
                        break;
                    case 'F4':
                        dispatch(
                            setPathname({
                                pathname: '/settings',
                            }),
                        );
                        break;
                    case 'F5':
                        dispatch(
                            setPathname({
                                pathname: '/shortcuts',
                            }),
                        );
                        break;
                    case 'F6':
                        dispatch(
                            setPathname({
                                pathname: '/about',
                            }),
                        );
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
    }, [dispatch]);

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
                    pathname === '/viewFile' && isDataLoaded
                        ? {
                              appTitle: ViewerToolbar,
                          }
                        : {}
                }
            >
                <Stack sx={styles.main} id="main">
                    {pathname === '/select' && <SelectDataset />}
                    {pathname === '/viewFile' && isDataLoaded && <ViewFile />}
                    {pathname === '/settings' && <Settings />}
                </Stack>
            </DashboardLayout>
        </AppProvider>
    );
};

export default Main;
