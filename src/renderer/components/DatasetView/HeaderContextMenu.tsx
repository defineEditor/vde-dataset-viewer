import React, { useContext, useState } from 'react';
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
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import { openModal, openSnackbar, setSelect } from 'renderer/redux/slices/ui';
import { resetFilter, setFilter } from 'renderer/redux/slices/data';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import FilterIcon from '@mui/icons-material/FilterAlt';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { handleTransformation } from 'renderer/utils/transformUtils';
import { modals } from 'misc/constants';
import {
    IHeaderCell,
    DatasetJsonMetadata,
    TableRowValue,
    BasicFilter,
} from 'interfaces/common';
import AppContext from 'renderer/utils/AppContext';
import Filter from 'js-array-filter';

const styles = {
    value: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
};

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
    const settings = useAppSelector((state) => state.settings);
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

    const isColumnsInCurrentFilter =
        currentFilter === null
            ? false
            : currentFilter.conditions
                  .map((condition) => condition.variable)
                  .includes(header.id);

    const handleShowInfo = () => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: header.id },
            }),
        );
    };

    const handleSelect = () => {
        dispatch(setSelect({ fileId: currentFileId, column: header.id }));
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

    const handleClose = () => {
        setFilterMenuAnchor(null);
        setIsLoadingValues(false);
        setGetAllValues(false);
        setFilterValues([]);
        setSelectedItems([]);
        onClose({}, 'action');
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
                } else if (index < newBasicFilter.conditions.length + 1) {
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
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Column Info</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleSelect();
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <SelectAllIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Select Column</ListItemText>
                </MenuItem>
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
                {currentFilter && (
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
                        selectedItems.length > 0 && (
                            <ListSubheader
                                key="apply-filter"
                                onClick={(e) =>
                                    handleApplyFilterValue(e, selectedItems)
                                }
                            >
                                <Button variant="text" size="small">
                                    Apply Filter
                                </Button>
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
                                <ExpandMoreIcon fontSize="small" /> Show All
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
