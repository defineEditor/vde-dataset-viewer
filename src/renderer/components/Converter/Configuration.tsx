import React, { useContext, useState, useEffect, useRef } from 'react';
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
    FormControlLabel,
    InputAdornment,
    Typography,
    Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TableSortLabel from '@mui/material/TableSortLabel';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { setConverterData } from 'renderer/redux/slices/data';
import {
    FileInfo,
    ConvertedFileInfo,
    OutputFormat,
    ConvertTask,
    DatasetMetadata,
    ConversionOptions,
    ConverterData,
    DJFileExtension,
} from 'interfaces/common';
import { mainTaskTypes } from 'misc/constants';
import Metadata from 'renderer/components/Converter/Metadata';
import Options from 'renderer/components/Converter/Options';

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
    buttonGroup: {
        marginLeft: 'auto',
    },
    noSelect: {
        userSelect: 'none',
    },
};

const Converter: React.FC<{
    onConvert: (task: ConvertTask) => void;
}> = ({ onConvert }) => {
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('DJ1.1');
    const [files, setFiles] = useState<ConvertedFileInfo[]>([]);
    const [destinationDir, setDestinationDir] = useState('');
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [options, setOptions] = useState<ConversionOptions>({
        prettyPrint: false,
        inEncoding: 'default',
        outEncoding: 'default',
        renameFiles: false,
        renamePattern: '',
        renameReplacement: '',
    });
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<keyof ConvertedFileInfo>('filename');
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [metadata, setMetadata] = useState<Partial<DatasetMetadata>>({});
    const [updateMetadata, setUpdateMetadata] = useState(false);

    const settings = useAppSelector((state) => state.settings.converter);
    const converterData = useAppSelector((state) => state.data.converter);

    const handleOutputFormat = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputFormat(event.target.value as OutputFormat);
        // Update output name for all files
        let extension: DJFileExtension;
        if (event.target.value === 'DJ1.1') {
            extension = 'json';
        } else if (event.target.value === 'DNJ1.1') {
            extension = 'ndjson';
        } else {
            extension = 'dsjc';
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

    const handleAddFiles = () => {
        const addFiles = async () => {
            const result = await apiService.openFileDialog({
                multiple: true,
                initialFolder: converterData.sourceDir,
                filters: [
                    {
                        name: 'All supported formats',
                        extensions: ['xpt', 'json', 'ndjson', 'dsjc'],
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
                    {
                        name: 'Compressed JSON',
                        extensions: ['dsjc'],
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
            let extension: DJFileExtension;
            if (outputFormat === 'DJ1.1') {
                extension = 'json';
            } else if (outputFormat === 'DNJ1.1') {
                extension = 'ndjson';
            } else {
                extension = 'dsjc';
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
            const result = await apiService.openDirectoryDialog(destinationDir);
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
        if (options.renameFiles && options.renamePattern) {
            try {
                const regex = new RegExp(options.renamePattern);
                let extension: DJFileExtension;
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
                            .replace(regex, options.renameReplacement || ''),
                    })),
                );
            } catch (error) {
                // Ignore invalid regex patterns
            }
        }
    }, [
        options.renameFiles,
        options.renamePattern,
        options.renameReplacement,
        outputFormat,
    ]);

    // Reset output names to original filenames when renaming is disabled
    useEffect(() => {
        let extension: DJFileExtension;
        if (outputFormat === 'DJ1.1') {
            extension = 'json';
        } else if (outputFormat === 'DNJ1.1') {
            extension = 'ndjson';
        } else {
            extension = 'dsjc';
        }
        if (options.renameFiles === false) {
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
    }, [options.renameFiles, outputFormat]);

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
                prettyPrint: options.prettyPrint,
                inEncoding: options.inEncoding,
                outEncoding: options.outEncoding,
                outputFormat,
                destinationDir,
                updateMetadata,
                metadata: updateMetadata ? metadata : {},
                ...settings,
            },
        };

        onConvert(task);
    };

    const handleMetadataOpen = () => {
        setIsMetadataOpen(true);
    };

    const handleMetadataClose = () => {
        setIsMetadataOpen(false);
    };

    const handleMetadataChange = (newMetadata: Partial<DatasetMetadata>) => {
        setMetadata(newMetadata);
    };

    const handleOptionsOpen = () => {
        setIsOptionsOpen(true);
    };

    const handleOptionsClose = () => {
        setIsOptionsOpen(false);
    };

    const handleOptionsChange = (newOptions: ConversionOptions) => {
        setOptions(newOptions);
    };

    // Add ref to store latest configuration
    const configRef = useRef<ConverterData>({
        ...converterData,
    });

    // Update ref whenever relevant state changes
    useEffect(() => {
        // If there are no files, use the previous sourceDir
        const sourceDir =
            files.length > 0 ? files[0].folder : configRef.current.sourceDir;
        configRef.current = {
            configuration: {
                options,
                metadata,
                outputFormat,
                updateMetadata,
            },
            destinationDir,
            sourceDir,
        };
    }, [
        files,
        options,
        metadata,
        outputFormat,
        updateMetadata,
        destinationDir,
    ]);

    // Initialize configuration and store configuration on unmount
    useEffect(() => {
        setMetadata(converterData.configuration.metadata);
        setOptions(converterData.configuration.options);
        setOutputFormat(converterData.configuration.outputFormat);
        setUpdateMetadata(converterData.configuration.updateMetadata);
        setDestinationDir(converterData.destinationDir);

        return () => {
            dispatch(setConverterData(configRef.current));
        };
    }, [dispatch, converterData]);

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
                    <MenuItem value="DJC1.1">
                        Compressed Dataset-JSON v1.1
                    </MenuItem>
                </TextField>
                <Button variant="contained" onClick={handleOptionsOpen}>
                    Options
                </Button>
                <FormControlLabel
                    sx={styles.noSelect}
                    control={
                        <Switch
                            checked={updateMetadata}
                            onChange={(e) =>
                                setUpdateMetadata(e.target.checked)
                            }
                        />
                    }
                    label="Update Metadata"
                />
                <Button
                    variant="contained"
                    onClick={handleMetadataOpen}
                    disabled={!updateMetadata}
                >
                    Metadata
                </Button>
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

            {/* Add OptionsDialog */}
            <Options
                open={isOptionsOpen}
                onClose={handleOptionsClose}
                options={options}
                onOptionsChange={handleOptionsChange}
            />
            <Metadata
                open={isMetadataOpen}
                onClose={handleMetadataClose}
                metadata={metadata}
                onMetadataChange={handleMetadataChange}
            />
        </Stack>
    );
};

export default Converter;
