import React, {
    useEffect,
    useContext,
    useCallback,
    useState,
    useRef,
} from 'react';
import {
    Tooltip,
    IconButton,
    Stack,
    TextField,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar, setDefineFileId } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
    searchInput: {},
};

const DefineToolbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearchNext = useCallback(() => {
        if (searchTerm) {
            apiService.searchInPageNext(searchTerm);
        }
    }, [apiService, searchTerm]);

    const handleSearchPrevious = useCallback(() => {
        if (searchTerm) {
            apiService.searchInPagePrevious(searchTerm);
        }
    }, [apiService, searchTerm]);

    const isSearchBlank = searchTerm === '';
    const handleSearchKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (isSearchBlank) {
                    apiService.clearSearchResults();
                } else if (event.shiftKey) {
                    handleSearchPrevious();
                } else {
                    handleSearchNext();
                }
            }
        },
        [handleSearchNext, handleSearchPrevious, isSearchBlank, apiService],
    );

    const handleOpenClick = useCallback(async () => {
        const fileInfo = await apiService.openDefineXml();

        if (fileInfo === null) {
            // User cancelled
            return;
        }

        dispatch(
            openSnackbar({
                type: 'info',
                message: `Loaded ${fileInfo.filename}`,
            }),
        );
        dispatch(setDefineFileId(fileInfo.fileId));
    }, [apiService, dispatch]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Focus search input when Ctrl+F is pressed and Columns tab is active
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <Stack
            sx={styles.main}
            direction="row"
            justifyContent="flex-start"
            spacing={1}
        >
            <Tooltip title="Open Define-XML" enterDelay={1000}>
                <IconButton
                    onClick={handleOpenClick}
                    id="openDefine"
                    size="small"
                >
                    <FileOpenOutlinedIcon
                        sx={{
                            color: 'grey.600',
                        }}
                    />
                </IconButton>
            </Tooltip>
            <TextField
                placeholder="Ctrl + F to search"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                variant="outlined"
                inputRef={searchInputRef}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm ? (
                            <InputAdornment position="end">
                                <Tooltip title="Previous (Shift+Enter)">
                                    <IconButton
                                        size="small"
                                        onClick={handleSearchPrevious}
                                        edge="end"
                                        sx={{ padding: 0.25 }}
                                    >
                                        <KeyboardArrowUpIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Next (Enter)">
                                    <IconButton
                                        size="small"
                                        onClick={handleSearchNext}
                                        edge="end"
                                        sx={{ padding: 0.25 }}
                                    >
                                        <KeyboardArrowDownIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ) : null,
                        sx: styles.searchInput,
                    },
                }}
            />
        </Stack>
    );
};

export default DefineToolbar;
