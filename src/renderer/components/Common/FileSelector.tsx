import React, { useState, useMemo, useContext } from 'react';
import {
    Stack,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TableSortLabel from '@mui/material/TableSortLabel';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { ConvertedFileInfo, FileInfo } from 'interfaces/common';

const getFormattedDate = (timestamp: number): string => {
    return new Date(timestamp).toISOString().split('.')[0].replace('T', ' ');
};

const getHumanReadableSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / 1024 ** i)} ${sizes[i]}`;
};

const styles = {
    controls: {
        direction: 'row',
        spacing: 2,
    },
    tableContainer: {
        flexGrow: 1,
    },
};

interface FileSelectorProps {
    files: ConvertedFileInfo[];
    onFilesChange: (files: ConvertedFileInfo[]) => void;
    title?: string;
    showOutputName?: boolean;
    fileFilters?: Array<{
        name: string;
        extensions: string[];
    }>;
    initialFolder?: string;
    filesWithIssues?: string[];
}

const FileSelector: React.FC<FileSelectorProps> = ({
    files,
    onFilesChange,
    title = 'Files',
    showOutputName = false,
    fileFilters = [
        {
            name: 'All supported formats',
            extensions: ['xpt', 'json', 'ndjson', 'dsjc', 'sas7bdat'],
        },
        {
            name: 'JSON',
            extensions: ['json'],
        },
        {
            name: 'NDJSON',
            extensions: ['ndjson'],
        },
        {
            name: 'Compressed JSON',
            extensions: ['dsjc'],
        },
        {
            name: 'XPT',
            extensions: ['xpt'],
        },
        {
            name: 'SAS',
            extensions: ['sas7bdat'],
        },
    ],
    initialFolder = '',
    filesWithIssues = [],
}) => {
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof ConvertedFileInfo>('filename');

    const handleAddFiles = async () => {
        const result = await apiService.openFileDialog({
            multiple: true,
            initialFolder,
            filters: fileFilters,
        });

        if (result === null) {
            dispatch(
                openSnackbar({
                    message: 'Error while selecting the files',
                    type: 'error',
                }),
            );
            return;
        }

        // If a file with the same name is already selected, replace it
        const existingFiles = files.filter(
            (file) =>
                !result.some((newFile) => newFile.filename === file.filename),
        );

        const newFiles = result.map((file: FileInfo) => ({
            ...file,
            id: `${file.folder}/${file.filename}`,
            outputName: showOutputName ? '' : file.filename,
        }));

        onFilesChange([...existingFiles, ...newFiles]);
    };

    const handleDeleteFile = (fullPath: string) => {
        onFilesChange(files.filter((file) => file.fullPath !== fullPath));
    };

    const handleClearAll = () => {
        onFilesChange([]);
    };

    const handleRequestSort = (property: keyof ConvertedFileInfo) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            let aVal = a[orderBy];
            let bVal = b[orderBy];
            if (order === 'desc') {
                aVal = b[orderBy];
                bVal = a[orderBy];
            }
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
            }
            return 0;
        });
    }, [files, order, orderBy]);

    return (
        <>
            <Typography variant="h6">{title}</Typography>
            {/* Table Controls */}
            <Stack direction="row" spacing={2} sx={styles.controls}>
                <Button
                    variant="contained"
                    onClick={handleAddFiles}
                    startIcon={<FolderOpenIcon />}
                    size="medium"
                >
                    Add Files
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleClearAll}
                    size="medium"
                >
                    Clear All
                </Button>
            </Stack>

            {/* Table */}
            <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'folder'}
                                    direction={
                                        orderBy === 'folder' ? order : 'asc'
                                    }
                                    onClick={() => handleRequestSort('folder')}
                                >
                                    Folder
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'filename'}
                                    direction={
                                        orderBy === 'filename' ? order : 'asc'
                                    }
                                    onClick={() =>
                                        handleRequestSort('filename')
                                    }
                                >
                                    Filename
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'format'}
                                    direction={
                                        orderBy === 'format' ? order : 'asc'
                                    }
                                    onClick={() => handleRequestSort('format')}
                                >
                                    Format
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'size'}
                                    direction={
                                        orderBy === 'size' ? order : 'asc'
                                    }
                                    onClick={() => handleRequestSort('size')}
                                >
                                    Size
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'lastModified'}
                                    direction={
                                        orderBy === 'lastModified'
                                            ? order
                                            : 'asc'
                                    }
                                    onClick={() =>
                                        handleRequestSort('lastModified')
                                    }
                                >
                                    Last Modified
                                </TableSortLabel>
                            </TableCell>
                            {showOutputName && (
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'outputName'}
                                        direction={
                                            orderBy === 'outputName'
                                                ? order
                                                : 'asc'
                                        }
                                        onClick={() =>
                                            handleRequestSort('outputName')
                                        }
                                    >
                                        Output Name
                                    </TableSortLabel>
                                </TableCell>
                            )}
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedFiles.map((file) => (
                            <TableRow key={file.fullPath}>
                                <TableCell>{file.folder}</TableCell>
                                <TableCell>{file.filename}</TableCell>
                                <TableCell>{file.format}</TableCell>
                                <TableCell>
                                    {getHumanReadableSize(file.size)}
                                </TableCell>
                                <TableCell>
                                    {getFormattedDate(file.lastModified)}
                                </TableCell>
                                {showOutputName && (
                                    <TableCell>{file.outputName}</TableCell>
                                )}
                                <TableCell>
                                    <Tooltip title="Delete File">
                                        <IconButton
                                            onClick={() =>
                                                handleDeleteFile(file.fullPath)
                                            }
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                    {filesWithIssues.includes(
                                        file.fullPath,
                                    ) && (
                                        <Tooltip title="This file has issues">
                                            <IconButton
                                                size="small"
                                                color="error"
                                            >
                                                <WarningRoundedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

export default FileSelector;
