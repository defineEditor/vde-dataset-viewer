import React from 'react';
import {
    AppBar,
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Tooltip,
    Typography,
    Stack,
    ListSubheader,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { useAppTheme } from 'renderer/utils/theme';
import CloudIcon from '@mui/icons-material/Cloud';
import CachedIcon from '@mui/icons-material/Cached';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DescriptionIcon from '@mui/icons-material/Description';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { AllowedPathnames } from 'interfaces/common';
import { paths } from 'misc/constants';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { setPathname, toggleAppBarExpanded } from 'renderer/redux/slices/ui';
import ViewerToolbar from 'renderer/components/Toolbars/ViewerToolbar';
import ReportToolbar from 'renderer/components/Toolbars/ReportToolbar';
import DefineToolbar from 'renderer/components/Toolbars/DefineToolbar';
import CompareToolbar from 'renderer/components/Toolbars/CompareToolbar';
import ToolbarActions from 'renderer/components/ToolbarActions';
import Shortcuts from 'renderer/components/Shortcuts';

type NavigationEntry =
    | {
          id: string;
          kind: 'header';
          title: string;
      }
    | {
          id: string;
          kind: 'divider';
      }
    | {
          id: string;
          kind: 'item';
          title: string;
          icon: React.ReactNode;
          pathname?: AllowedPathnames;
          action?: 'shortcuts';
      };

interface ToolpadProps {
    title: string;
    pathname: AllowedPathnames;
    shortcutsOpen: boolean;
    onOpenShortcuts: () => void;
    onCloseShortcuts: () => void;
    children: React.ReactNode;
}

const styles = {
    root: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'background.default',
    },
    main: {
        display: 'flex',
        flex: '1 1 0%',
        overflow: 'auto',
        flexDirection: 'column',
    },
    logo: (theme: Theme) => ({
        width: 32,
        height: 32,
        marginTop: '3px',
        ml: 1,
        fontSize: 16,
        fontWeight: 700,
        color: 'grey.700',
        background: theme.vars?.palette.gradients.logo,
    }),
    drawerList: {
        py: 0,
    },
    drawerHeader: {
        height: 40,
        color: 'text.secondary',
        whiteSpace: 'nowrap',
        fontWeight: 700,
        fontSize: 12,
    },
    brandTitle: {
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: 'primary.main',
    },
    genericTitle: {
        pl: 2,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    appBar: (theme: Theme, navigationWidth: number) => ({
        width: '100%',
        ml: `${navigationWidth}px`,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: theme.transitions.create(['width', 'margin'], {
            duration: theme.transitions.duration.standard,
        }),
        zIndex: theme.zIndex.drawer + 1,
    }),
    toolbar: {
        gap: 2,
        pl: 1.5,
    },
    titleContainer: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
    },
    actionsBox: {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
    },
    drawer: (theme: Theme, navigationWidth: number) => ({
        width: navigationWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            width: navigationWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
                duration: theme.transitions.duration.standard,
            }),
        },
    }),
    listItemButton: (appBarExpanded: boolean, selected: boolean) => ({
        minHeight: 48,
        justifyContent: appBarExpanded ? 'initial' : 'center',
        px: appBarExpanded ? 2 : 1.5,
        mx: 1,
        borderRadius: 1.5,
        '& .MuiListItemIcon-root': {
            color: selected ? 'primary.main' : 'text.secondary',
        },
        '& .MuiListItemText-primary': {
            fontWeight: selected ? 600 : 500,
        },
    }),
    listItemIcon: (appBarExpanded: boolean, selected: boolean) => ({
        minWidth: 0,
        mr: appBarExpanded ? 2 : 0,
        justifyContent: 'center',
        '& .MuiSvgIcon-root': {
            color: selected ? 'primary.main' : 'grey.600',
        },
    }),
    listItemText: (appBarExpanded: boolean, selected: boolean) => ({
        opacity: appBarExpanded ? 1 : 0,
        whiteSpace: 'nowrap',
        fontWeight: selected ? 600 : 400,
        color: selected ? 'primary.main' : 'grey.800',
    }),
    mainContainer: {
        flex: '1 1 0%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
    },
    divider: {
        mt: 1,
        mx: 1,
        borderWidth: '0 0 2px',
    },
    menuIcon: {
        color: 'grey.600',
    },
};

const NAVIGATION: NavigationEntry[] = [
    {
        id: 'viewer-header',
        kind: 'header',
        title: 'Viewer',
    },
    {
        id: 'viewer',
        kind: 'item',
        pathname: paths.SELECT,
        title: 'Viewer',
        icon: <WysiwygIcon />,
    },
    {
        id: 'define',
        kind: 'item',
        pathname: paths.DEFINEXML,
        title: 'Define',
        icon: <DescriptionIcon />,
    },
    {
        id: 'api',
        kind: 'item',
        pathname: paths.API,
        title: 'API',
        icon: <CloudIcon />,
    },
    {
        id: 'viewer-divider',
        kind: 'divider',
    },
    {
        id: 'tools-header',
        kind: 'header',
        title: 'Tools',
    },
    {
        id: 'converter',
        kind: 'item',
        pathname: paths.CONVERTER,
        title: 'Converter',
        icon: <CachedIcon />,
    },
    {
        id: 'validator',
        kind: 'item',
        pathname: paths.VALIDATOR,
        title: 'Validator',
        icon: <FactCheckIcon />,
    },
    {
        id: 'compare',
        kind: 'item',
        pathname: paths.COMPARE,
        title: 'Compare',
        icon: <CompareArrowsIcon />,
    },
    {
        id: 'tools-divider',
        kind: 'divider',
    },
    {
        id: 'misc-header',
        kind: 'header',
        title: 'Miscellaneous',
    },
    {
        id: 'settings',
        kind: 'item',
        pathname: paths.SETTINGS,
        title: 'Settings',
        icon: <SettingsIcon />,
    },
    {
        id: 'shortcuts',
        kind: 'item',
        action: 'shortcuts',
        title: 'Shortcuts',
        icon: <KeyboardIcon />,
    },
    {
        id: 'about',
        kind: 'item',
        pathname: paths.ABOUT,
        title: 'About',
        icon: <InfoIcon />,
    },
];

const Logo: React.FC = () => {
    return <Avatar sx={styles.logo}>{'{ ; }'}</Avatar>;
};

const Toolpad: React.FC<ToolpadProps> = ({
    title,
    pathname,
    shortcutsOpen,
    onOpenShortcuts,
    onCloseShortcuts,
    children,
}) => {
    const theme = useAppTheme();
    const dispatch = useAppDispatch();
    const appBarExpanded = useAppSelector((state) => state.ui.appBarExpanded);
    const isDataLoaded = useAppSelector(
        (state) => state.ui.currentFileId !== '',
    );
    const currentValidatorTab = useAppSelector(
        (state) => state.ui.validationPage.currentTab,
    );

    const compactMode = useAppSelector(
        (state) => state.settings.other.compactMode,
    );

    const navigationWidth = appBarExpanded
        ? theme.densitySettings.drawer.widthExpanded
        : theme.densitySettings.drawer.widthCollapsed;

    const handleToggleNavigation = () => {
        dispatch(toggleAppBarExpanded());
    };

    const handleNavigationClick = (entry: NavigationEntry) => {
        if (entry.kind !== 'item') {
            return;
        }

        if (entry.action === 'shortcuts') {
            onOpenShortcuts();
            return;
        }

        if (entry.pathname) {
            dispatch(setPathname({ pathname: entry.pathname }));
        }
    };

    const isNavigationItemSelected = (entry: NavigationEntry) => {
        if (entry.kind !== 'item' || !entry.pathname) {
            return false;
        }

        if (entry.pathname === paths.SELECT) {
            return pathname === paths.SELECT || pathname === paths.VIEWFILE;
        }

        return pathname === entry.pathname;
    };

    let titleContent: React.ReactNode = (
        <Stack direction="row" spacing={1}>
            <Logo />
            <Typography variant="h6" sx={styles.brandTitle}>
                {title}
            </Typography>
        </Stack>
    );

    if (pathname === paths.VIEWFILE && isDataLoaded) {
        titleContent = <ViewerToolbar />;
    } else if (
        pathname === paths.VALIDATOR &&
        currentValidatorTab === 'report'
    ) {
        titleContent = <ReportToolbar />;
    } else if (pathname === paths.DEFINEXML) {
        titleContent = <DefineToolbar />;
    } else if (pathname === paths.COMPARE) {
        titleContent = <CompareToolbar />;
    }

    return (
        <Box sx={styles.root}>
            <AppBar
                position="fixed"
                color="transparent"
                elevation={0}
                sx={styles.appBar(theme, navigationWidth)}
            >
                <Toolbar
                    sx={styles.toolbar}
                    disableGutters
                    variant={compactMode ? 'dense' : 'regular'}
                >
                    <Tooltip
                        title={
                            appBarExpanded
                                ? 'Collapse navigation'
                                : 'Expand navigation'
                        }
                    >
                        <IconButton
                            onClick={handleToggleNavigation}
                            size="small"
                        >
                            {appBarExpanded ? (
                                <MenuOpenIcon sx={styles.menuIcon} />
                            ) : (
                                <MenuIcon sx={styles.menuIcon} />
                            )}
                        </IconButton>
                    </Tooltip>
                    <Box sx={styles.titleContainer}>{titleContent}</Box>
                    <Box sx={styles.actionsBox}>
                        <ToolbarActions />
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={styles.drawer(theme, navigationWidth)}
            >
                <Toolbar
                    sx={styles.toolbar}
                    disableGutters
                    variant={compactMode ? 'dense' : 'regular'}
                />
                <List disablePadding sx={styles.drawerList}>
                    {NAVIGATION.map((entry) => {
                        if (entry.kind === 'divider') {
                            return (
                                <Divider key={entry.id} sx={styles.divider} />
                            );
                        }

                        if (entry.kind === 'header') {
                            if (!appBarExpanded) {
                                return (
                                    <Box key={entry.id} sx={{ height: 12 }} />
                                );
                            }

                            return (
                                <ListSubheader
                                    key={entry.id}
                                    sx={styles.drawerHeader}
                                >
                                    {entry.title}
                                </ListSubheader>
                            );
                        }

                        const selected = isNavigationItemSelected(entry);

                        return (
                            <Tooltip
                                key={entry.id}
                                title={entry.title}
                                placement="right"
                                disableHoverListener={appBarExpanded}
                            >
                                <ListItemButton
                                    onClick={() => handleNavigationClick(entry)}
                                    selected={selected}
                                    sx={styles.listItemButton(
                                        appBarExpanded,
                                        selected,
                                    )}
                                >
                                    <ListItemIcon
                                        sx={styles.listItemIcon(
                                            appBarExpanded,
                                            selected,
                                        )}
                                    >
                                        {entry.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body1"
                                                sx={styles.listItemText(
                                                    appBarExpanded,
                                                    selected,
                                                )}
                                            >
                                                {entry.title}
                                            </Typography>
                                        }
                                        sx={styles.listItemText(
                                            appBarExpanded,
                                            selected,
                                        )}
                                    />
                                </ListItemButton>
                            </Tooltip>
                        );
                    })}
                </List>
            </Drawer>
            <Box sx={styles.mainContainer}>
                <Toolbar
                    sx={styles.toolbar}
                    disableGutters
                    variant={compactMode ? 'dense' : 'regular'}
                />
                <Box component="main" sx={styles.main} id="main">
                    {children}
                </Box>
            </Box>

            <Shortcuts open={shortcutsOpen} onClose={onCloseShortcuts} />
        </Box>
    );
};

export default Toolpad;
