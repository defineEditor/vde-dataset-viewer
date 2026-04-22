import React, { useEffect } from 'react';
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
    initializeCompare,
} from 'renderer/redux/slices/ui';
import { NewWindowProps } from 'interfaces/common';
import Converter from 'renderer/components/Converter';
import Validator from 'renderer/components/Validator';
import Compare from 'renderer/components/Compare';
import About from 'renderer/components/About';
import Toolpad from 'renderer/components/Toolpad';
import { paths } from 'misc/constants';
import { saveStore } from 'renderer/redux/stateUtils';
import handleOpenDataset from 'renderer/utils/handleOpenDataset';

const renderPage = (
    pathname: string,
    isDataLoaded: boolean,
): React.ReactElement | null => {
    if (pathname === paths.SELECT) {
        return <SelectDataset />;
    }
    if (pathname === paths.VIEWFILE && isDataLoaded) {
        return <ViewFile />;
    }
    if (pathname === paths.DEFINEXML) {
        return <DefineXml />;
    }
    if (pathname === paths.COMPARE) {
        return <Compare />;
    }
    if (pathname === paths.SETTINGS) {
        return <Settings />;
    }
    if (pathname === paths.API) {
        return <Api />;
    }
    if (pathname === paths.CONVERTER) {
        return <Converter />;
    }
    if (pathname === paths.VALIDATOR) {
        return <Validator />;
    }
    if (pathname === paths.ABOUT) {
        return <About />;
    }

    return null;
};

const Main: React.FC = () => {
    const title = 'VDE Dataset Viewer';
    const dispatch = useAppDispatch();
    const { apiService } = React.useContext(AppContext);
    const pathname = useAppSelector((state) => state.ui.pathname);

    const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

    const isDataLoaded = useAppSelector(
        (state) => state.ui.currentFileId !== '',
    );

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
            if (
                (event.ctrlKey || event.metaKey) &&
                (event instanceof WheelEvent ||
                    ['+', '-', '=', '_', '0'].includes(event.key))
            ) {
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
                        initializeCompare({
                            fileBase,
                            fileComp,
                        }),
                    );
                    dispatch(setPathname({ pathname: paths.COMPARE }));
                };

                return handleOpenCompare(path1, path2);
            }

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
    }, [apiService, currentFileId, dispatch]);

    return (
        <Toolpad
            title={title}
            pathname={pathname}
            shortcutsOpen={shortcutsOpen}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onCloseShortcuts={() => setShortcutsOpen(false)}
        >
            <>{renderPage(pathname, isDataLoaded)}</>
        </Toolpad>
    );
};

export default Main;
