import React from 'react';
import { Tooltip, Button } from '@mui/material';
import {
    ITableData,
    DatasetJsonMetadata,
    ITableRow,
    IHeaderCell,
} from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';
import calculateColumnWidth from 'renderer/utils/calculateColumnWidth';

const styles = {
    actionIcon: {
        color: 'primary.main',
        fontSize: '24px',
    },
    actions: {
        width: '100%',
    },
    nameButton: {
        textTransform: 'none',
        minWidth: '1px',
    },
};

const columns: IHeaderCell[] = [
    {
        id: '#',
        label: '#',
        type: 'string',
        size: 45,
    },
    {
        id: 'name',
        label: 'Name',
        type: 'string',
        minSize: 100,
    },
    {
        id: 'label',
        label: 'Label',
        type: 'string',
        minSize: 100,
    },
    {
        id: 'length',
        label: 'Length',
        type: 'integer',
        minSize: 100,
        maxSize: 132,
    },
    {
        id: 'dataType',
        label: 'Data Type',
        type: 'string',
        minSize: 100,
        maxSize: 132,
    },
    {
        id: 'targetDataType',
        label: 'Target Data Type',
        type: 'string',
        minSize: 100,
        maxSize: 132,
    },
    {
        id: 'displayFormat',
        label: 'Display Format',
        type: 'string',
        minSize: 100,
        maxSize: 90,
    },
    {
        id: 'keySequence',
        label: 'Key Sequence',
        type: 'integer',
        minSize: 100,
        maxSize: 100,
    },
    {
        id: 'itemOID',
        label: 'Item OID',
        type: 'string',
        minSize: 100,
    },
];

const VariableName: React.FC<{
    name: string;
    onShowInfo: (id: string) => void;
}> = ({ name, onShowInfo }) => {
    return (
        <Tooltip title="Show column info">
            <Button
                variant="text"
                onClick={() => onShowInfo(name)}
                id="info"
                sx={styles.nameButton}
            >
                {name}
            </Button>
        </Tooltip>
    );
};

const VariableNumber: React.FC<{
    number: number;
    name: string;
    onGoToClick: (column: string) => void;
}> = ({ number, name, onGoToClick }) => {
    return (
        <Tooltip title="Go to column">
            <Button
                variant="text"
                onClick={() => onGoToClick(name)}
                id="goto"
                sx={styles.nameButton}
            >
                {number}
            </Button>
        </Tooltip>
    );
};

const renderVariableName = (onShowInfo: (id: string) => void) => {
    const renderFunction = (info: CoreCell<ITableRow, unknown>) => {
        return (
            <VariableName
                name={info?.row?.original?.name as string}
                onShowInfo={onShowInfo}
            />
        );
    };
    return renderFunction;
};

const renderVariableNumber = (onGoToClick: (column: string) => void) => {
    const renderFunction = (info: CoreCell<ITableRow, unknown>) => {
        return (
            <VariableNumber
                number={info?.row?.original?.['#'] as number}
                name={info?.row?.original?.name as string}
                onGoToClick={onGoToClick}
            />
        );
    };
    return renderFunction;
};

const convertMetadataToDataset = (
    data: DatasetJsonMetadata,
    onGoToClick: (column: string) => void,
    onShowInfo: (id: string) => void,
    searchTerm: string,
    containerWidth?: number,
): ITableData => {
    // Implement conversion logic here
    const metadata: DatasetJsonMetadata = {
        datasetJSONCreationDateTime: new Date().toISOString(),
        datasetJSONVersion: '1.1',
        records: data.records,
        name: `${data.name}_metadata`,
        label: `${data.label} Metadata`,
        columns: [],
    };

    // Form header;
    const header: ITableData['header'] = columns.map((col) => {
        const item: {
            id: string;
            label: string;
            cell?: (cell: CoreCell<ITableRow, unknown>) => React.JSX.Element;
        } = {
            id: col.id,
            label: col.label,
        };

        if (col.id === 'name') {
            item.cell = renderVariableName(onShowInfo);
        }
        if (col.id === '#') {
            item.cell = renderVariableNumber(onGoToClick);
        }

        return item;
    });

    const filteredData: ITableRow[] = data.columns
        .map(
            (column, index) =>
                ({ '#': index + 1, ...column }) as unknown as ITableRow,
        )
        .filter((column) => {
            if (!searchTerm) {
                return true;
            }

            const searchTermLower = searchTerm.toLowerCase();
            return header.some((item) => {
                const value = column[item.id];
                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).toLowerCase().includes(searchTermLower)
                );
            });
        });

    // Get columns metadata
    const columnWidths = calculateColumnWidth(
        columns,
        true,
        containerWidth || undefined,
        500,
        1000,
        false,
        {
            header: columns,
            data: filteredData,
            metadata,
            appliedFilter: null,
            fileId: '',
        },
    );

    // Update header with calculated widths
    header.forEach((col) => {
        col.size = columnWidths[col.id];
    });

    const result: ITableData = {
        header,
        metadata,
        data: filteredData,
        appliedFilter: null,
        fileId: metadata.name,
    };

    return result;
};

export default convertMetadataToDataset;
