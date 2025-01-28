import React, { useContext, useState, useEffect } from 'react';
import {
    Stack,
    Button,
    TextField,
    MenuItem,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TableSortLabel from '@mui/material/TableSortLabel';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import {
    FileInfo,
    ConvertedFileInfo,
    OutputFormat,
    ConvertTask,
} from 'interfaces/common';
import { mainTaskTypes } from 'misc/constants';

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
    container: {
        p: 2,
        height: '100%',
        backgroundColor: 'grey.100',
    },
    controls: {
        direction: 'row',
        spacing: 2,
    },
    formatSelect: {
        minWidth: 210,
    },
    destinationField: {
        backgroundColor: 'background.paper',
    },
};

const Converter: React.FC<{
    onConvert: (task: ConvertTask) => void;
}> = ({ onConvert }) => {
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('DJ1.1');
    const [files, setFiles] = useState<ConvertedFileInfo[]>([
        {
            filename: 'adsl.xpt',
            folder: '/home/nogi/nogi/DataExchange-DatasetJson/examples/adam/',
            format: 'xpt',
            size: 1024 * 1024 * 5,
            lastModified: Date.now(),
            fullPath:
                '/home/nogi/nogi/DataExchange-DatasetJson/examples/adam/adsl.xpt',
            outputName: 'test.json',
        },
    ]);
    const [destinationDir, setDestinationDir] = useState(
        '/home/nogi/nogi/DataExchange-DatasetJson/examples/adam/converted/',
    );
    const [prettyPrint, setPrettyPrint] = useState(false);
    const [renameFiles, setRenameFiles] = useState(false);
    const [renamePattern, setRenamePattern] = useState('');
    const [renameReplacement, setRenameReplacement] = useState('');
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof ConvertedFileInfo>('filename');

    const settings = useAppSelector((state) => state.settings.converter);

    const handleOutputFormat = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputFormat(event.target.value as OutputFormat);
        // Update output name for all files
        let extension: 'json' | 'ndjson';
        if (event.target.value === 'DJ1.1') {
            extension = 'json';
        } else {
            extension = 'ndjson';
        }
        setFiles(
            files.map((file) => ({
                ...file,
                outputName: file.filename.replace(
                    /(.*\.)\w+$/,
                    `$1${extension}`,
                ),
            })),
        );
    };

    const handleRenameFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRenameFiles(event.target.checked);
    };

    const handleAddFiles = () => {
        const addFiles = async () => {
            const result = await apiService.openFileDialog({
                multiple: true,
                filters: [
                    {
                        name: 'All supported formats',
                        extensions: ['xpt', 'json', 'ndjson'],
                    },
                    {
                        name: 'XPT',
                        extensions: ['xpt'],
                    },
                    {
                        name: 'JSON',
                        extensions: ['json'],
                    },
                    {
                        name: 'NDJSON',
                        extensions: ['ndjson'],
                    },
                ],
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
            let extension: 'json' | 'ndjson';
            if (outputFormat === 'DJ1.1') {
                extension = 'json';
            } else {
                extension = 'ndjson';
            }
            const newFiles = result.map((file: FileInfo) => ({
                ...file,
                id: `${file.folder}/${file.filename}`,
                outputName: file.filename.replace(
                    /(.*\.)\w+$/,
                    `$1${extension}`,
                ),
            }));
            setFiles([...files, ...newFiles]);
        };
        addFiles();
    };

    const handleSelectDestination = () => {
        const selectDestination = async () => {
            const result = await apiService.openDirectoryDialog();
            if (result === null) {
                dispatch(
                    openSnackbar({
                        message: 'Error while selecting the destination folder',
                        type: 'error',
                    }),
                );
                return;
            }

            if (result !== '') {
                setDestinationDir(result);
            }
        };
        selectDestination();
    };

    const handleDeleteFile = (fullPath: string) => {
        setFiles(files.filter((file) => file.fullPath !== fullPath));
    };

    const handleClearAll = () => {
        setFiles([]);
    };

    // Rename files when rename pattern or replacement changes
    useEffect(() => {
        if (renameFiles && renamePattern) {
            try {
                const regex = new RegExp(renamePattern);
                let extension: 'json' | 'ndjson';
                if (outputFormat === 'DJ1.1') {
                    extension = 'json';
                } else {
                    extension = 'ndjson';
                }
                setFiles((prev) =>
                    prev.map((file) => ({
                        ...file,
                        outputName: file.filename
                            .replace(/(.*\.)\w+$/, `$1${extension}`)
                            .replace(regex, renameReplacement || ''),
                    })),
                );
            } catch (error) {
                // Ignore invalid regex patterns
            }
        }
    }, [renameFiles, renamePattern, renameReplacement, outputFormat]);

    // Reset output names to original filenames when renaming is disabled
    useEffect(() => {
        let extension: 'json' | 'ndjson';
        if (outputFormat === 'DJ1.1') {
            extension = 'json';
        } else {
            extension = 'ndjson';
        }
        if (renameFiles === false) {
            setFiles((prev) =>
                prev.map((file) => ({
                    ...file,
                    outputName: file.filename.replace(
                        /(.*\.)\w+$/,
                        `$1${extension}`,
                    ),
                })),
            );
        }
    }, [renameFiles, outputFormat]);

    const handleRequestSort = (property: keyof ConvertedFileInfo) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedFiles = React.useMemo(() => {
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

    const handleConvert = () => {
        // Implement conversion logic here
        const task: ConvertTask = {
            type: mainTaskTypes.CONVERT,
            files,
            options: {
                prettyPrint,
                outputFormat,
                destinationDir,
                ...settings,
            },
        };

        onConvert(task);
    };

    return (
        <Stack spacing={2} sx={styles.container}>
            {/* Conversion Configuration */}
            <Typography variant="h6">Conversion Configuration</Typography>
            <Stack direction="row" spacing={2}>
                <TextField
                    select
                    label="Output Format"
                    value={outputFormat}
                    onChange={handleOutputFormat}
                    sx={styles.formatSelect}
                    size="medium"
                >
                    <MenuItem value="DJ1.1">Dataset-JSON v1.1</MenuItem>
                    <MenuItem value="DNJ1.1">Dataset-NDJSON v1.1</MenuItem>
                </TextField>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={prettyPrint}
                            onChange={(e) => setPrettyPrint(e.target.checked)}
                        />
                    }
                    label="Pretty Print"
                />
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={renameFiles}
                                onChange={handleRenameFiles}
                            />
                        }
                        label="Rename Files"
                    />
                    {renameFiles && (
                        <>
                            <TextField
                                size="medium"
                                label="Pattern (regex)"
                                value={renamePattern}
                                onChange={(e) =>
                                    setRenamePattern(e.target.value)
                                }
                                placeholder="e.g. ^(.+)$"
                            />
                            <TextField
                                size="medium"
                                label="Replacement"
                                value={renameReplacement}
                                onChange={(e) =>
                                    setRenameReplacement(e.target.value)
                                }
                                placeholder="e.g. prefix_$1"
                            />
                        </>
                    )}
                </Stack>
            </Stack>

            <Typography variant="h6">Files</Typography>
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
            <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
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
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'outputName'}
                                    direction={
                                        orderBy === 'outputName' ? order : 'asc'
                                    }
                                    onClick={() =>
                                        handleRequestSort('outputName')
                                    }
                                >
                                    Output Name
                                </TableSortLabel>
                            </TableCell>
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
                                <TableCell>{file.outputName}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() =>
                                            handleDeleteFile(file.fullPath)
                                        }
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Destination Directory */}
            <Box>
                <TextField
                    fullWidth
                    label="Destination Directory"
                    value={destinationDir}
                    sx={styles.destinationField}
                    slotProps={{
                        input: {
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleSelectDestination}
                                        edge="start"
                                    >
                                        <FolderOpenIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>
            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                    variant="contained"
                    onClick={handleConvert}
                    disabled={files.length === 0 || !destinationDir}
                >
                    Convert
                </Button>
            </Stack>
        </Stack>
    );
};

export default Converter;
