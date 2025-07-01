import React, { useContext } from 'react';
import {
    Paper,
    Stack,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
} from '@mui/material';
import { FileInfo } from 'interfaces/common';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    container: {
        p: 0,
        height: '100%',
        backgroundColor: 'grey.100',
    },
    fileActions: {
        mt: 2,
        mb: 2,
    },
    tableContainer: {
        mb: 2,
        flex: 1,
    },
    validateActions: {
        mt: 2,
    },
};

interface ValidatorConfigurationProps {
    selectedFiles: FileInfo[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
    validating: boolean;
    onValidate: () => void;
}

const ValidatorConfiguration: React.FC<ValidatorConfigurationProps> = ({
    selectedFiles,
    setSelectedFiles,
    validating,
    onValidate,
}) => {
    const { apiService } = useContext(AppContext);

    const handleAddFiles = async () => {
        if (!apiService?.openFileDialog) return;
        const result = await apiService.openFileDialog({ multiple: true });
        if (result && Array.isArray(result)) {
            setSelectedFiles((prev) => [
                ...prev,
                ...result.filter(
                    (file: FileInfo) =>
                        !prev.some((f) => f.fullPath === file.fullPath),
                ),
            ]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((files) => files.filter((_, i) => i !== index));
    };

    const handleClearAll = () => {
        setSelectedFiles([]);
    };

    return (
        <Stack spacing={2} sx={styles.container}>
            <Typography variant="h6">Select Files to Validate</Typography>
            <Stack direction="row" spacing={2} sx={styles.fileActions}>
                <Button
                    variant="contained"
                    onClick={handleAddFiles}
                    startIcon={<FolderOpenIcon />}
                >
                    Add Files
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleClearAll}
                    disabled={selectedFiles.length === 0}
                >
                    Clear All
                </Button>
            </Stack>
            <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Filename</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Last Modified</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {selectedFiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No files selected.
                                </TableCell>
                            </TableRow>
                        ) : (
                            selectedFiles.map((file, idx) => (
                                <TableRow
                                    key={file.filename + file.lastModified}
                                >
                                    <TableCell>{file.filename}</TableCell>
                                    <TableCell>
                                        {file.size ? `${file.size} bytes` : ''}
                                    </TableCell>
                                    <TableCell>
                                        {file.lastModified
                                            ? new Date(
                                                  file.lastModified,
                                              ).toLocaleString()
                                            : ''}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() =>
                                                handleRemoveFile(idx)
                                            }
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Stack direction="row" spacing={2} sx={styles.validateActions}>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={selectedFiles.length === 0 || validating}
                    onClick={onValidate}
                >
                    Validate
                </Button>
            </Stack>
        </Stack>
    );
};

export default ValidatorConfiguration;
