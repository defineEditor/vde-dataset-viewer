import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    Stack,
    Button,
    TextField,
    MenuItem,
    Box,
    FormControlLabel,
    InputAdornment,
    Typography,
    Switch,
    IconButton,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AppContext from 'renderer/utils/AppContext';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openSnackbar } from 'renderer/redux/slices/ui';
import { setConverterData } from 'renderer/redux/slices/data';
import {
    ConvertedFileInfo,
    OutputFormat,
    ConvertTask,
    DatasetMetadata,
    ConversionOptions,
    ConverterData,
    OutputFileExtension,
} from 'interfaces/common';
import { mainTaskTypes } from 'misc/constants';
import Metadata from 'renderer/components/Converter/Metadata';
import Options from 'renderer/components/Converter/Options';
import FileSelector from 'renderer/components/Common/FileSelector';

const styles = {
    container: {
        p: 2,
        height: '100%',
        backgroundColor: 'grey.100',
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
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [metadata, setMetadata] = useState<Partial<DatasetMetadata>>({});
    const [updateMetadata, setUpdateMetadata] = useState(false);

    const settings = useAppSelector((state) => state.settings.converter);
    const converterData = useAppSelector((state) => state.data.converter);

    const handleOutputFormat = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputFormat(event.target.value as OutputFormat);
    };

    const handleFilesChange = (newFiles: ConvertedFileInfo[]) => {
        // Ensure output names are set correctly for new files
        const filesWithOutputNames = newFiles.map((file) => {
            if (!file.outputName) {
                let extension: OutputFileExtension;
                if (outputFormat === 'DJ1.1') {
                    extension = 'json';
                } else if (outputFormat === 'DNJ1.1') {
                    extension = 'ndjson';
                } else if (outputFormat === 'CSV') {
                    extension = 'csv';
                } else if (outputFormat === 'DJC1.1') {
                    extension = 'dsjc';
                } else {
                    extension = 'json'; // fallback
                }
                return {
                    ...file,
                    outputName: file.filename.replace(
                        /(.*\.)\w+$/,
                        `$1${extension}`,
                    ),
                };
            }
            return file;
        });
        setFiles(filesWithOutputNames);
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

    // Rename files when rename pattern or replacement changes
    useEffect(() => {
        if (options.renameFiles && options.renamePattern) {
            try {
                const regex = new RegExp(options.renamePattern);
                let extension: OutputFileExtension;
                if (outputFormat === 'DJ1.1') {
                    extension = 'json';
                } else if (outputFormat === 'DNJ1.1') {
                    extension = 'ndjson';
                } else if (outputFormat === 'CSV') {
                    extension = 'csv';
                } else if (outputFormat === 'DJC1.1') {
                    extension = 'dsjc';
                } else {
                    throw new Error('Invalid output format');
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
        let extension: OutputFileExtension;
        if (outputFormat === 'DJ1.1') {
            extension = 'json';
        } else if (outputFormat === 'DNJ1.1') {
            extension = 'ndjson';
        } else if (outputFormat === 'CSV') {
            extension = 'csv';
        } else if (outputFormat === 'DJC1.1') {
            extension = 'dsjc';
        } else {
            throw new Error('Invalid output format');
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

    const handleConvert = () => {
        // Implement conversion logic here
        const task: ConvertTask = {
            type: mainTaskTypes.CONVERT,
            idPrefix: 'converter',
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
                    <MenuItem value="CSV">CSV</MenuItem>
                </TextField>
                <Button variant="contained" onClick={handleOptionsOpen}>
                    Options
                </Button>
                {outputFormat !== 'CSV' && (
                    <>
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
                    </>
                )}
            </Stack>

            <FileSelector
                files={files}
                onFilesChange={handleFilesChange}
                title="Files"
                showOutputName
                initialFolder={converterData.sourceDir}
            />

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
                outputFormat={outputFormat}
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
