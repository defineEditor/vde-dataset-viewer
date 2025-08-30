import React from 'react';
import { ITableData, DatasetJsonMetadata, ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';
import calculateColumnWidth from 'renderer/utils/calculateColumnWidth';
import renderVariableName from 'renderer/components/Modal/DatasetInfo/VariableName';
import renderVariableNumber from 'renderer/components/Modal/DatasetInfo/VariableNumber';
import columnDefs from 'renderer/components/Modal/DatasetInfo/columnDefs';

const convertMetadataToDataset = (
    data: DatasetJsonMetadata,
    onGoToClick: (column: string) => void,
    onShowInfo: (id: string) => void,
    containerWidth?: number,
): ITableData => {
    const metadata: DatasetJsonMetadata = {
        datasetJSONCreationDateTime: new Date().toISOString(),
        datasetJSONVersion: '1.1',
        records: data.records,
        name: `${data.name}_metadata`,
        label: `${data.label} Metadata`,
        columns: [],
    };

    // Form header;
    const header: ITableData['header'] = columnDefs.map((col) => {
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

    const columnData: ITableRow[] = data.columns.map(
        (column, index) =>
            ({ '#': index + 1, ...column }) as unknown as ITableRow,
    );

    // Get columns metadata
    const columnWidths = calculateColumnWidth(
        columnDefs,
        true,
        containerWidth || undefined,
        500,
        1000,
        false,
        {
            header: columnDefs,
            data: columnData,
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
        data: columnData,
        appliedFilter: null,
        fileId: metadata.name,
    };

    return result;
};

export default convertMetadataToDataset;
