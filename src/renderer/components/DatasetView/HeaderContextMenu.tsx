import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    Menu,
    MenuItem,
    Divider,
    CircularProgress,
    ListSubheader,
    Button,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import {
    openModal,
    openSnackbar,
    setDatasetIdColumns,
    setDatasetSorting,
    setSelect,
    setDatasetShowLabels,
} from 'renderer/redux/slices/ui';
import { resetFilter, setFilter } from 'renderer/redux/slices/data';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import FilterIcon from '@mui/icons-material/FilterAlt';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import SortIcon from '@mui/icons-material/Sort';
import { handleTransformation } from 'renderer/utils/transformUtils';
import { modals } from 'misc/constants';
import {
    IHeaderCell,
    DatasetJsonMetadata,
    TableRowValue,
    BasicFilter,
    IUiControl,
} from 'interfaces/common';
import AppContext from 'renderer/utils/AppContext';
import Filter from 'js-array-filter';

const styles = {
    value: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    showAll: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subheader: {
        lineHeight: 2,
    },
};

const emptyArray: unknown[] = [];

interface HeaderContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: (
        event: {},
        reason: 'backdropClick' | 'escapeKeyDown' | 'action',
    ) => void;
    header: IHeaderCell;
    metadata: DatasetJsonMetadata;
}

const HeaderCellContextMenu: React.FC<HeaderContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    header,
    metadata,
}) => {
    const dispatch = useAppDispatch();
    const currentFileId = useAppSelector((state) => state.ui.currentFileId);
    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter[currentFileId] || null,
    );
    const currentSorting = useAppSelector(
        (state) =>
            state.ui.control[currentFileId]?.sorting ??
            (emptyArray as IUiControl['sorting']),
    );
    const currentIdColumns = useAppSelector(
        (state) =>
            state.ui.control[currentFileId]?.idCols ??
            (emptyArray as IUiControl['idCols']),
    );
    const settings = useAppSelector((state) => state.settings);
    const currentShowLabels = useAppSelector((state) => {
        return (
            state.ui.control[currentFileId]?.showLabels ??
            state.settings.viewer.showLabels
        );
    });
    const dateFormat = useAppSelector(
        (state) => state.settings.viewer.dateFormat,
    );
    const { apiService } = useContext(AppContext);
    const [filterMenuAnchor, setFilterMenuAnchor] =
        useState<null | HTMLElement>(null);
    const [filterValues, setFilterValues] = useState<TableRowValue[]>([]);
    const [isLoadingValues, setIsLoadingValues] = useState(false);
    const [getAllValues, setGetAllValues] = useState(false);
    const [selectedItems, setSelectedItems] = useState<TableRowValue[]>([]);
    const [filterByValueType, setFilterByValueType] = useState<'add' | 'new'>(
        'new',
    );

    const isStringColumn = [
        'string',
        'datetime',
        'date',
        'time',
        'decimal',
        'URL',
    ].includes(
        metadata.columns.find((col) => col.name === header.id)?.dataType || '',
    );

    const currentFilterValues = useMemo(() => {
        return currentFilter === null
            ? []
            : currentFilter.conditions
                  .filter((condition) => condition.variable === header.id)
                  .filter(
                      (condition) =>
                          condition.operator === 'eq' ||
                          condition.operator === 'in',
                  )
                  .map((condition) => condition.value)
                  .flat();
    }, [currentFilter, header.id]);

    useEffect(() => {
        // Initialize selected items based on current filter
        setSelectedItems(currentFilterValues);
    }, [currentFilterValues, header.id]);

    const isColumnsInCurrentFilter =
        currentFilter === null
            ? false
            : currentFilter.conditions
                  .map((condition) => condition.variable)
                  .includes(header.id);
    const isPinned = currentIdColumns.includes(header.id);
    const isInSorting = currentSorting.some((item) => item.id === header.id);

    const handleClose = () => {
        setFilterMenuAnchor(null);
        setIsLoadingValues(false);
        setGetAllValues(false);
        setFilterValues([]);
        if (currentFilterValues.length > 0) {
            setSelectedItems(currentFilterValues);
        } else {
            setSelectedItems([]);
        }
        onClose({}, 'action');
    };

    const handleShowInfo = () => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: header.id },
            }),
        );
        handleClose();
    };

    const handleShowLabels = () => {
        dispatch(
            setDatasetShowLabels({
                fileId: currentFileId,
                showLabels: !currentShowLabels,
            }),
        );
        handleClose();
    };

    const handleSelect = () => {
        dispatch(setSelect({ fileId: currentFileId, column: header.id }));
        handleClose();
    };

    const handleTogglePin = () => {
        const idCols = isPinned
            ? currentIdColumns.filter((columnId) => columnId !== header.id)
            : [...currentIdColumns, header.id];

        dispatch(
            setDatasetIdColumns({
                fileId: currentFileId,
                idCols,
            }),
        );
        handleClose();
    };

    const handleAddToSorting = () => {
        if (isInSorting) {
            return;
        }

        dispatch(
            setDatasetSorting({
                fileId: currentFileId,
                sorting: [...currentSorting, { id: header.id, desc: false }],
            }),
        );
        handleClose();
    };

    const handleRemoveFromSorting = () => {
        dispatch(
            setDatasetSorting({
                fileId: currentFileId,
                sorting: currentSorting.filter((item) => item.id !== header.id),
            }),
        );
        handleClose();
    };

    const getValues = async (getAll: boolean) => {
        setIsLoadingValues(true);
        try {
            const values = await apiService.getUniqueValues({
                fileId: currentFileId,
                columnIds: [header.id],
                limit: 100,
                addCount: false,
                getAllValues: getAll,
                metadata,
                settings,
            });
            if (values && values[header.id]) {
                setFilterValues(values[header.id].values);
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    message: `Failed to load unique values: ${error}`,
                    type: 'error',
                }),
            );
        } finally {
            setIsLoadingValues(false);
        }
    };

    const handleOpenFilterMenu = async (
        event: React.MouseEvent<HTMLElement>,
        type: 'add' | 'new',
    ) => {
        setFilterByValueType(type);
        setFilterMenuAnchor(event.currentTarget);
        await getValues(false);
    };

    const handleRemoveFromFilter = () => {
        if (currentFilter !== null) {
            const newBasicFilter: BasicFilter = {
                ...currentFilter,
                conditions: currentFilter.conditions.slice(),
                connectors: currentFilter.connectors.slice(),
            };

            // Find all indexes where the column appears
            const indexes = newBasicFilter.conditions
                .map((condition, index) =>
                    condition.variable === header.id ? index : -1,
                )
                .filter((index) => index !== -1)
                .sort((a, b) => b - a); // Sort in descending order

            // Remove conditions and their corresponding connectors
            indexes.forEach((index) => {
                // Remove the condition
                newBasicFilter.conditions.splice(index, 1);

                // Remove the appropriate connector
                if (index === 0 && newBasicFilter.connectors.length > 0) {
                    // If first condition is removed, remove first connector
                    newBasicFilter.connectors.splice(0, 1);
                } else if (index < newBasicFilter.connectors.length + 1) {
                    // For other cases, remove connector at index-1
                    newBasicFilter.connectors.splice(index - 1, 1);
                }
            });

            // Dispatch the updated filter only if there are remaining conditions
            if (newBasicFilter.conditions.length > 0) {
                dispatch(
                    setFilter({
                        fileId: currentFileId,
                        filter: newBasicFilter,
                        datasetName: metadata.name,
                    }),
                );
            } else {
                dispatch(resetFilter({ fileId: currentFileId }));
            }
        }
        handleClose();
    };

    const handleFilterReset = () => {
        dispatch(resetFilter({ fileId: currentFileId }));
        handleClose();
    };

    const handleApplyFilterValue = (
        event: React.MouseEvent<HTMLElement>,
        value: TableRowValue | TableRowValue[],
    ) => {
        // If user used Ctrl/Cmd key, allow multi-select
        if (!Array.isArray(value) && (event.ctrlKey || event.metaKey)) {
            if (selectedItems.includes(value)) {
                setSelectedItems(
                    selectedItems.filter((item) => item !== value),
                );
            } else {
                setSelectedItems([...selectedItems, value]);
            }
            return;
        }
        let condition = '';
        if (Array.isArray(value)) {
            const values = value
                .map((rawVal) => {
                    const val = handleTransformation(
                        header.numericDatetimeType,
                        rawVal,
                        dateFormat,
                    );
                    if (val === null) {
                        return isStringColumn ? `''` : `null`;
                    }
                    if (isStringColumn && typeof val === 'string') {
                        if (val.includes("'")) {
                            return `"${val}"`;
                        }

                        return `'${val}'`;
                    }
                    return val;
                })
                .join(', ');
            condition = `${header.id} IN (${values})`;
        } else if (value === null) {
            condition = `missing(${header.id})`;
        } else {
            const updatedValue = handleTransformation(
                header.numericDatetimeType,
                value,
                dateFormat,
            );
            const safeValue = isStringColumn
                ? `'${updatedValue}'`
                : updatedValue;
            condition = `${header.id} = ${safeValue}`;
        }

        let newFilter: Filter;
        if (filterByValueType === 'add') {
            // Update existing filter
            newFilter = new Filter(
                'dataset-json1.1',
                metadata.columns,
                currentFilter,
            );
            const filterString = newFilter.toString();
            newFilter.update(`${filterString} and ${condition}`);
        } else {
            newFilter = new Filter(
                'dataset-json1.1',
                metadata.columns,
                condition,
            );
        }
        dispatch(
            setFilter({
                fileId: currentFileId,
                filter: newFilter.toBasicFilter(),
                datasetName: metadata.name,
            }),
        );
        setFilterMenuAnchor(null);
        handleClose();
    };

    const handleFilter = () => {
        const condition = isStringColumn
            ? `${header.id} = ''`
            : `${header.id} = null`;
        const newFilter = new Filter(
            'dataset-json1.1',
            metadata.columns,
            condition,
        );
        dispatch(
            openModal({
                type: modals.FILTER,
                filterType: 'dataset',
                data: { defaultFilter: newFilter.toBasicFilter() },
            }),
        );
    };

    return (
        <>
            <Menu
                open={open}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition}
            >
                <MenuItem
                    onClick={() => {
                        handleShowInfo();
                    }}
                >
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Column Info</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleShowLabels();
                    }}
                >
                    <ListItemIcon>
                        {currentShowLabels ? (
                            <LabelOffIcon fontSize="small" />
                        ) : (
                            <LabelIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText>
                        {currentShowLabels ? 'Show Names' : 'Show Labels'}
                    </ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        handleSelect();
                    }}
                >
                    <ListItemIcon>
                        <SelectAllIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Select Column</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleTogglePin}>
                    <ListItemIcon>
                        {isPinned ? (
                            <RemoveCircleOutlineIcon fontSize="small" />
                        ) : (
                            <PushPinOutlinedIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText>
                        {isPinned ? 'Unpin Column' : 'Pin Column'}
                    </ListItemText>
                </MenuItem>
                {isInSorting ? (
                    <MenuItem onClick={handleRemoveFromSorting}>
                        <ListItemIcon>
                            <RemoveCircleOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Remove from Sorting</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handleAddToSorting}>
                        <ListItemIcon>
                            <SortIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Add to Sorting</ListItemText>
                    </MenuItem>
                )}
                <Divider />
                <MenuItem
                    onClick={() => {
                        handleFilter();
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <FilterIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Filter</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleOpenFilterMenu(e, 'new')}>
                    <ListItemIcon>
                        <ChecklistIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        <Box sx={styles.value}>
                            Filter by Value <ArrowRightIcon fontSize="small" />
                        </Box>
                    </ListItemText>
                </MenuItem>
                {currentFilter && currentFilterValues.length === 0 && (
                    <MenuItem onClick={(e) => handleOpenFilterMenu(e, 'add')}>
                        <ListItemIcon>
                            <AddCircleOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>
                            <Box sx={styles.value}>
                                Add to Filter{' '}
                                <ArrowRightIcon fontSize="small" />
                            </Box>
                        </ListItemText>
                    </MenuItem>
                )}
                {isColumnsInCurrentFilter && (
                    <MenuItem
                        onClick={() => {
                            handleRemoveFromFilter();
                        }}
                    >
                        <ListItemIcon>
                            <RemoveCircleOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Remove from filter</ListItemText>
                    </MenuItem>
                )}
                {currentFilter && (
                    <MenuItem onClick={handleFilterReset}>
                        <ListItemIcon>
                            <FilterAltOffIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Reset Filter</ListItemText>
                    </MenuItem>
                )}
            </Menu>
            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => {
                    setFilterMenuAnchor(null);
                    setGetAllValues(false);
                    setSelectedItems([]);
                }}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                {isLoadingValues ? (
                    <MenuItem disabled>
                        <ListItemIcon>
                            <CircularProgress size={20} />
                        </ListItemIcon>
                        <ListItemText>Loading</ListItemText>
                    </MenuItem>
                ) : (
                    [
                        selectedItems.length > 0 ? (
                            <ListSubheader
                                key="apply-filter"
                                sx={styles.subheader}
                                onClick={(e) =>
                                    handleApplyFilterValue(e, selectedItems)
                                }
                            >
                                <Button variant="text" size="small">
                                    Apply Filter
                                </Button>
                            </ListSubheader>
                        ) : (
                            <ListSubheader
                                key="apply-filter-hint"
                                sx={styles.subheader}
                            >
                                <Typography variant="caption" color="grey.500">
                                    Ctrl to multi-select
                                </Typography>
                            </ListSubheader>
                        ),
                        filterValues.map((value) => (
                            <MenuItem
                                key={`${value}`}
                                selected={selectedItems.includes(value)}
                                onClick={(e) =>
                                    handleApplyFilterValue(e, value)
                                }
                            >
                                {value === null || value === ''
                                    ? '(empty)'
                                    : String(value)}
                            </MenuItem>
                        )),
                        getAllValues === false && filterValues.length < 100 && (
                            <MenuItem
                                key="show-all-values"
                                onClick={async () => {
                                    setGetAllValues(true);
                                    await getValues(true);
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={styles.showAll}
                                    color="primary"
                                >
                                    <ExpandMoreIcon fontSize="small" /> Show All
                                </Typography>
                            </MenuItem>
                        ),
                        filterValues.length === 100 && (
                            <MenuItem disabled key="footnote">
                                First 100 values shown
                            </MenuItem>
                        ),
                    ]
                )}
            </Menu>
        </>
    );
};

export default HeaderCellContextMenu;
