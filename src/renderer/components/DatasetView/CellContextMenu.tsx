import React from 'react';
import {
    Menu,
    MenuItem,
    Divider,
    ListSubheader,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'renderer/redux/hooks';
import Filter from 'js-array-filter';
import {
    DatasetJsonMetadata,
    BasicFilter,
    IHeaderCell,
} from 'interfaces/common';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import ChecklistIcon from '@mui/icons-material/Checklist';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined';
import { handleTransformation } from 'renderer/utils/transformUtils';
import { resetFilter, setFilter } from 'renderer/redux/slices/data';
import { restartCompare } from 'renderer/redux/slices/ui';

interface ContextMenuProps {
    open: boolean;
    anchorPosition: { top: number; left: number };
    onClose: (
        event: {},
        reason: 'backdropClick' | 'escapeKeyDown' | 'action',
    ) => void;
    value: string | number | boolean | null;
    metadata: DatasetJsonMetadata;
    header: IHeaderCell;
    isCompare?: boolean;
}

const CellContextMenu: React.FC<ContextMenuProps> = ({
    open,
    anchorPosition,
    onClose,
    value,
    header,
    metadata,
    isCompare = false,
}) => {
    const dispatch = useAppDispatch();

    const currentFileId = useAppSelector((state) =>
        isCompare ? state.ui.compare.currentCompareId : state.ui.currentFileId,
    );

    const currentFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter[currentFileId] || null,
    );

    const dateFormat = useAppSelector(
        (state) => state.settings.viewer.dateFormat,
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

    const handleFilterByValue = () => {
        // Filter by value
        const updatedValue = handleTransformation(
            header.numericDatetimeType,
            value,
            dateFormat,
        );

        const condition = isStringColumn
            ? `${header.id} = '${updatedValue}'`
            : `${header.id} = ${updatedValue}`;
        const newFilter = new Filter(
            'dataset-json1.1',
            metadata.columns,
            condition,
        );
        dispatch(
            setFilter({
                fileId: currentFileId,
                filter: newFilter.toBasicFilter(),
                datasetName: metadata.name,
            }),
        );
        if (isCompare) {
            dispatch(restartCompare({ compareId: currentFileId }));
        }
    };

    const hadnleAddToFilter = () => {
        // Add to filter
        if (currentFilter !== null) {
            const newFilter = new Filter(
                'dataset-json1.1',
                metadata.columns,
                currentFilter,
            );
            const updatedValue = handleTransformation(
                header.numericDatetimeType,
                value,
                dateFormat,
            );
            const condition = isStringColumn
                ? `${header.id} = '${updatedValue}'`
                : `${header.id} = ${updatedValue}`;
            const filterString = newFilter.toString();
            newFilter.update(`${filterString} and ${condition}`);
            dispatch(
                setFilter({
                    fileId: currentFileId,
                    filter: newFilter.toBasicFilter(),
                    datasetName: metadata.name,
                }),
            );
            if (isCompare) {
                dispatch(restartCompare({ compareId: currentFileId }));
            }
        } else {
            handleFilterByValue();
        }
    };

    const handleFilterReset = () => {
        dispatch(resetFilter({ fileId: currentFileId }));
        if (isCompare) {
            dispatch(restartCompare({ compareId: currentFileId }));
        }
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
                if (isCompare) {
                    dispatch(restartCompare({ compareId: currentFileId }));
                }
            } else {
                dispatch(resetFilter({ fileId: currentFileId }));
                if (isCompare) {
                    dispatch(restartCompare({ compareId: currentFileId }));
                }
            }
        }
    };

    return (
        <Menu
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
        >
            <ListSubheader>Filter</ListSubheader>
            <Divider />
            <MenuItem
                onClick={() => {
                    handleFilterByValue();
                    onClose({}, 'action');
                }}
            >
                <ListItemIcon>
                    <ChecklistIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Filter by value</ListItemText>
            </MenuItem>
            {currentFilter !== null && (
                <MenuItem
                    onClick={() => {
                        hadnleAddToFilter();
                        onClose({}, 'action');
                    }}
                >
                    <ListItemIcon>
                        <AddCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add to filter</ListItemText>
                </MenuItem>
            )}
            {isColumnsInCurrentFilter && (
                <MenuItem
                    onClick={() => {
                        handleRemoveFromFilter();
                        onClose({}, 'action');
                    }}
                >
                    <ListItemIcon>
                        <RemoveCircleOutlineIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Remove from filter</ListItemText>
                </MenuItem>
            )}
            {currentFilter !== null && (
                <MenuItem
                    onClick={() => {
                        handleFilterReset();
                        onClose({}, 'action');
                    }}
                >
                    <ListItemIcon>
                        <FilterAltOffIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reset Filter</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );
};

export default CellContextMenu;
