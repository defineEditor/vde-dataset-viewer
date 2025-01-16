import React, { useContext, useState } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { FileInfo } from 'interfaces/common';

interface ConvertedFileInfo extends FileInfo {
    outputName: string;
}

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
        minWidth: 120,
    },
    destinationField: {
        backgroundColor: 'background.paper',
    },
};

const Converter: React.FC = () => {
    const [outputFormat, setOutputFormat] = useState('JSON');
    const [files, setFiles] = useState<ConvertedFileInfo[]>([]);
    const [destinationDir, setDestinationDir] = useState('');
    const [prettyPrint, setPrettyPrint] = useState(false);
    const [renameFiles, setRenameFiles] = useState(false);
    const { apiService } = useContext(AppContext);
    const dispatch = useAppDispatch();

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
            const newFiles = result.map((file: FileInfo) => ({
                ...file,
                id: `${file.folder}/${file.filename}`,
                outputName: file.filename,
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

    const handleConvert = () => {
        // Implement conversion logic here
    };

    return (
        <Stack spacing={2} sx={styles.container}>
            {/* Configuration */}
            <Stack direction="row" spacing={2}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={prettyPrint}
                            onChange={(e) => setPrettyPrint(e.target.checked)}
                        />
                    }
                    label="Pretty Print"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={renameFiles}
                            onChange={(e) => setRenameFiles(e.target.checked)}
                        />
                    }
                    label="Rename Files"
                />
            </Stack>

            {/* Controls */}
            <Stack direction="row" spacing={2} sx={styles.controls}>
                <Button
                    variant="contained"
                    onClick={handleAddFiles}
                    startIcon={<FolderOpenIcon />}
                >
                    Add Files
                </Button>
                <Button variant="outlined" onClick={handleClearAll}>
                    Clear All
                </Button>
                <TextField
                    select
                    label="Output Format"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    sx={styles.formatSelect}
                >
                    <MenuItem value="JSON">JSON</MenuItem>
                    <MenuItem value="NDJSON">NDJSON</MenuItem>
                </TextField>
            </Stack>

            {/* Files Table */}
            <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Folder</TableCell>
                            <TableCell>Filename</TableCell>
                            <TableCell>Format</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Last Modified</TableCell>
                            <TableCell>Output Name</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {files.map((file) => (
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
