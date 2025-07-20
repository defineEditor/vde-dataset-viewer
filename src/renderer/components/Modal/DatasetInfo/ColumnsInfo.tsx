import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    TableSortLabel,
    Stack,
    Tooltip,
} from '@mui/material';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import InfoIcon from '@mui/icons-material/Info';
import { useAppDispatch } from 'renderer/redux/hooks';
import { setGoTo, openModal } from 'renderer/redux/slices/ui';
import { modals } from 'misc/constants';
import { DatasetJsonMetadata, ItemDescription } from 'interfaces/common';

const styles = {
    headerRow: {
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
    },
    actionIcon: {
        color: 'primary.main',
        fontSize: '24px',
    },
};

const ColumnsInfo: React.FC<{
    metadata: DatasetJsonMetadata;
    onClose: () => void;
    active: boolean;
    searchTerm: string;
}> = ({ metadata, onClose, active, searchTerm }) => {
    const dispatch = useAppDispatch();
    const headers: {
        key: keyof ItemDescription;
        label: string;
    }[] = [
        { key: 'name', label: 'Name' },
        { key: 'label', label: 'Label' },
        { key: 'length', label: 'Length' },
        { key: 'dataType', label: 'Data Type' },
        { key: 'targetDataType', label: 'Target Data Type' },
        { key: 'displayFormat', label: 'Display Format' },
        { key: 'keySequence', label: 'Key Sequence' },
        { key: 'itemOID', label: 'Item OID' },
    ];

    const [sortedColumns, setSortedColumns] = useState(metadata.columns);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof ItemDescription;
        direction: 'asc' | 'desc';
    } | null>(null);

    const handleSort = (key: keyof ItemDescription) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setSortedColumns((prevColumns) => {
            return [...prevColumns].sort((a, b) => {
                const aValue = a[key];
                const bValue = b[key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        });
    };

    const handleGoToClick = (column: string) => {
        dispatch(setGoTo({ column }));
        onClose();
    };

    const handleShowInfo = (id: string) => {
        dispatch(
            openModal({
                type: modals.VARIABLEINFO,
                data: { columnId: id },
            }),
        );
    };

    useEffect(() => {
        setSortedColumns(metadata.columns);
        setSortConfig(null);
    }, [active, metadata.columns]);

    const filteredColumns = sortedColumns.filter((column) => {
        if (!searchTerm) return true;

        const searchTermLower = searchTerm.toLowerCase();
        return headers.some((header) => {
            const value = column[header.key];
            return (
                value !== null &&
                value !== undefined &&
                String(value).toLowerCase().includes(searchTermLower)
            );
        });
    });

    return (
        <TableContainer component={Paper} sx={{ maxHeight: '100%' }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow sx={styles.headerRow}>
                        {headers.map((header) => (
                            <TableCell
                                key={header.key}
                                sortDirection={
                                    sortConfig?.key === header.key
                                        ? sortConfig.direction
                                        : false
                                }
                            >
                                <TableSortLabel
                                    active={sortConfig?.key === header.key}
                                    direction={sortConfig?.direction || 'asc'}
                                    onClick={() => handleSort(header.key)}
                                >
                                    {header.label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                        <TableCell key="actions">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredColumns.map((column, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TableRow key={index}>
                            {headers.map((header) => (
                                <TableCell key={header.key}>
                                    {column[header.key]}
                                </TableCell>
                            ))}
                            <TableCell key="actions">
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Go to column">
                                        <IconButton
                                            onClick={() =>
                                                handleGoToClick(column.name)
                                            }
                                            id="goto"
                                            size="small"
                                        >
                                            <ShortcutIcon
                                                sx={styles.actionIcon}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Show column info">
                                        <IconButton
                                            onClick={() =>
                                                handleShowInfo(column.name)
                                            }
                                            id="info"
                                            size="small"
                                        >
                                            <InfoIcon sx={styles.actionIcon} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ColumnsInfo;
