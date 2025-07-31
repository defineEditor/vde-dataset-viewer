import React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
    Box,
    Typography,
    Drawer,
    IconButton,
    Divider,
} from '@mui/material';

const styles = {
    drawer: {
        zIndex: 9001,
    },
    paper: {
        minWidth: '500px',
    },
    category: {
        fontWeight: 'bold',
        fontSize: '14pt',
    },
    shortcut: {
        fontWeight: 'bold',
        backgroundColor: 'grey.200',
    },
    headerTitle: {
        marginLeft: 1,
        color: 'white',
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 8px',
        backgroundColor: 'primary.main',
    },
};

const shortcuts = {
    General: {
        'Ctrl + F1': 'Open Viewer',
        'Ctrl + F2': 'Open API',
        'Ctrl + F3': 'Open Converter',
        'Ctrl + F4': 'Open Validator',
        'Ctrl + F5': 'Open Settings',
        'Ctrl + F6': 'Open About',
        'Ctrl + /': 'Open Shortcuts',
        Escape: 'Escape/Cancel/Close',
        'Ctrl + S': 'Save Settings/Filter/etc.',
        F11: 'Toggle Fullscreen',
    },
    Viewer: {
        'Ctrl + O': 'Open a new file',
        'Ctrl + G': 'Go to line or column',
        'Ctrl + F': 'Filter data',
        'Ctrl + Alt + F': 'Reset Filter',
        'Ctrl + E': 'Column Visibility',
        'Ctrl + I': 'Dataset Information',
        'Ctrl + C': 'Copy selected cells',
        'Ctrl + Alt + C': 'Copy selected cells with headers',
        'Ctrl + `': 'Toggle opened dataset selection',
    },
};

const Shortcuts: React.FC<{
    open: boolean;
    onClose: () => void;
}> = ({ open, onClose }) => {
    return (
        <Drawer
            open={open}
            onClose={onClose}
            sx={styles.drawer}
            PaperProps={{ sx: styles.paper }}
            anchor="right"
        >
            <Box tabIndex={0} role="button">
                <Box sx={styles.drawerHeader}>
                    <IconButton onClick={onClose}>
                        <ChevronRightIcon />
                    </IconButton>
                    <Typography variant="h6" sx={styles.headerTitle}>
                        Shortcuts
                    </Typography>
                </Box>
                <Divider />
                <Table>
                    <TableBody>
                        {Object.keys(shortcuts).map((category) => {
                            return (
                                <React.Fragment key={category}>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <Typography variant="h6">
                                                {category}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    {Object.keys(shortcuts[category]).map(
                                        (shortcut) => {
                                            return (
                                                <TableRow key={shortcut}>
                                                    <TableCell
                                                        sx={styles.shortcut}
                                                    >
                                                        {shortcut}
                                                    </TableCell>
                                                    <TableCell>
                                                        {
                                                            shortcuts[category][
                                                                shortcut
                                                            ]
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        },
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </Drawer>
    );
};

export default Shortcuts;
