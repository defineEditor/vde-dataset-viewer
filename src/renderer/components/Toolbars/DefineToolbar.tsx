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
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { useAppDispatch } from 'renderer/redux/hooks';
import { openSnackbar, setDefineFileId } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';

const styles = {
    main: {
        width: '100%',
        paddingLeft: 1,
    },
    searchInput: {
        color: 'white',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
        },
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.7)',
        },
    },
    searchIcon: { color: 'white' },
};

const DefineToolbar: React.FC = () => {
    const dispatch = useAppDispatch();
    const { apiService } = useContext(AppContext);

    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    // On Search change, use Window search functionality
    useEffect(() => {
        if (searchTerm === '') {
            apiService.clearSearchResults();
        } else {
            apiService.searchInPage(searchTerm);
        }
    }, [searchTerm]);

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
                variant="outlined"
                inputRef={searchInputRef}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={styles.searchIcon} />
                            </InputAdornment>
                        ),
                        sx: styles.searchInput,
                    },
                }}
            />
        </Stack>
    );
};

export default DefineToolbar;
