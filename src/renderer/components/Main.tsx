import React, { useEffect } from 'react';
import { AppProvider, Navigation, Router } from '@toolpad/core/AppProvider';
import { Theme, Stack, Avatar } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import CachedIcon from '@mui/icons-material/Cached';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DescriptionIcon from '@mui/icons-material/Description';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
    DashboardLayout,
    DashboardLayoutSlots,
} from '@toolpad/core/DashboardLayout';
import SelectDataset from 'renderer/components/SelectDataset';
import Api from 'renderer/components/Api';
import AppContext from 'renderer/utils/AppContext';
import ViewFile from 'renderer/components/ViewDataset';
import Settings from 'renderer/components/Settings';
import DefineXml from 'renderer/components/DefineXmlStylesheet';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import {
    setPathname,
    setZoomLevel,
    setDefineFileId,
    initialCompare,
} from 'renderer/redux/slices/ui';
import { AllowedPathnames, NewWindowProps } from 'interfaces/common';
import ViewerToolbar from 'renderer/components/Toolbars/ViewerToolbar';
import ReportToolbar from 'renderer/components/Toolbars/ReportToolbar';
import DefineToolbar from 'renderer/components/Toolbars/DefineToolbar';
import CompareToolbar from 'renderer/components/Toolbars/CompareToolbar';
import ToolbarActions from 'renderer/components/ToolbarActions';
import Shortcuts from 'renderer/components/Shortcuts';
import Converter from 'renderer/components/Converter';
import Validator from 'renderer/components/Validator';
import Compare from 'renderer/components/Compare';
import About from 'renderer/components/About';
import { paths } from 'misc/constants';
import { saveStore } from 'renderer/redux/stateUtils';
import handleOpenDataset from 'renderer/utils/handleOpenDataset';

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
        segment: 'definexml',
        title: 'Define',
        icon: <DescriptionIcon />,
    },
    {
        segment: 'api',
        title: 'API',
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
        segment: 'validator',
        title: 'Validator',
        icon: <FactCheckIcon />,
    },
    {
        segment: 'compare',
        title: 'Compare',
        icon: <CompareArrowsIcon />,
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
                                pathname: paths.VALIDATOR,
                            }),
                        );
                        break;
                    case 'F5':
                        dispatch(
                            setPathname({
                                pathname: paths.SETTINGS,
                            }),
                        );
                        break;
                    case 'F6':
                        dispatch(
                            setPathname({
                                pathname: paths.ABOUT,
                            }),
                        );
                        break;
                    case 'F7':
                        dispatch(
                            setPathname({
                                pathname: paths.DEFINEXML,
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

    // Add zoom functionality with Ctrl + Mouse wheel
    const currentZoom = useAppSelector((state) => state.ui.zoomLevel);
    useEffect(() => {
        const handleZoom = async (event: WheelEvent | KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                const zoomStep = 0.1;
                const minZoom = -5; // ~25% zoom
                const maxZoom = 3; // ~800% zoom

                let newZoom: number = currentZoom;
                if (event instanceof WheelEvent) {
                    event.preventDefault();
                    // If it is wheel event
                    if (event.deltaY < 0) {
                        // Zoom in (wheel up)
                        newZoom = Math.min(currentZoom + zoomStep, maxZoom);
                    } else {
                        // Zoom out (wheel down)
                        newZoom = Math.max(currentZoom - zoomStep, minZoom);
                    }
                } else {
                    switch (event.key) {
                        case '+':
                        case '=': // Handle both + and = keys (= is + without shift)
                            event.preventDefault();
                            newZoom = Math.min(currentZoom + zoomStep, maxZoom);
                            break;
                        case '-':
                        case '_': // Handle both - and _ keys (_ is - with shift)
                            event.preventDefault();
                            newZoom = Math.max(currentZoom - zoomStep, minZoom);
                            break;
                        case '0':
                            event.preventDefault();
                            newZoom = 0; // Reset to default zoom
                            break;
                        default:
                            break;
                    }
                }

                dispatch(setZoomLevel(newZoom));
            }
        };

        window.addEventListener('wheel', handleZoom, { passive: false });
        window.addEventListener('keydown', handleZoom);

        return () => {
            window.removeEventListener('wheel', handleZoom);
            window.removeEventListener('keydown', handleZoom);
        };
    }, [dispatch, currentZoom]);

    useEffect(() => {
        apiService.setZoom(currentZoom);
    }, [currentZoom, apiService]);

    // Handle "Open With" file opening events from the OS
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    useEffect(() => {
        const handleFileOpen = async (
            filePath: string,
            newWindowProps?: NewWindowProps,
        ) => {
            if (newWindowProps?.compare) {
                const { path1, path2 } = newWindowProps.compare;
                const handleOpenCompare = async (
                    fileBase: string,
                    fileComp: string,
                ) => {
                    dispatch(
                        initialCompare({
                            fileBase,
                            fileComp,
                        }),
                    );
                    dispatch(setPathname({ pathname: paths.COMPARE }));
                };
                return handleOpenCompare(path1, path2);
            }

            // Get file extension
            const extension = filePath.split('.').pop();

            if (extension?.toLowerCase() === 'xml') {
                const handleOpenDefine = async () => {
                    // Open it as Define-XML
                    // Define-XML file
                    const fileInfo = await apiService.openDefineXml(filePath);
                    if (fileInfo === null) {
                        return;
                    }
                    dispatch(setDefineFileId(fileInfo.fileId));
                    dispatch(
                        setPathname({
                            pathname: paths.DEFINEXML,
                        }),
                    );
                };
                return handleOpenDefine();
            }
            // Open it as dataset
            return handleOpenDataset(
                filePath,
                currentFileId,
                dispatch,
                apiService,
                newWindowProps,
            );
        };

        apiService.onFileOpen(handleFileOpen);

        // Clean up listener on unmount
        return () => {
            apiService.removeFileOpenListener();
        };
    }, [apiService, dispatch, currentFileId]);

    const slots: DashboardLayoutSlots = {
        toolbarActions: ToolbarActions,
    };

    if (pathname === paths.VIEWFILE && isDataLoaded) {
        slots.appTitle = ViewerToolbar;
    }

    const currentValidatorTab = useAppSelector(
        (state) => state.ui.validationPage.currentTab,
    );

    if (pathname === paths.VALIDATOR && currentValidatorTab === 'report') {
        slots.appTitle = ReportToolbar;
    }

    if (pathname === paths.DEFINEXML) {
        slots.appTitle = DefineToolbar;
    }

    if (pathname === paths.COMPARE) {
        slots.appTitle = CompareToolbar;
    }

    return (
        <AppProvider
            navigation={NAVIGATION}
            theme={theme}
            router={useAppRouter()}
            branding={{ title, logo: <Logo /> }}
        >
            <DashboardLayout defaultSidebarCollapsed slots={slots}>
                <Stack sx={styles.main} id="main">
                    {pathname === paths.SELECT && <SelectDataset />}
                    {pathname === paths.VIEWFILE && isDataLoaded && (
                        <ViewFile />
                    )}
                    {pathname === paths.DEFINEXML && <DefineXml />}
                    {pathname === paths.COMPARE && <Compare />}
                    {pathname === paths.SETTINGS && <Settings />}
                    {pathname === paths.API && <Api />}
                    {pathname === paths.CONVERTER && <Converter />}
                    {pathname === paths.VALIDATOR && <Validator />}
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
