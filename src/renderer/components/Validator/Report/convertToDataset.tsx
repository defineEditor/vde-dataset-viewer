import React from 'react';
import {
    ITableData,
    ParsedValidationReport,
    DatasetJsonMetadata,
    ITableRow,
} from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';
import { Typography } from '@mui/material';

const Status: React.FC<{ status: string }> = ({ status }) => {
    return <Typography>{status}</Typography>;
};

const renderStatus = (info: CoreCell<ITableRow, unknown>) => {
    return <Status status={info.getValue() as string} />;
};

const convertToDataset = (
    data: ParsedValidationReport,
    type: 'Issue_Details' | 'Issue_Summary' | 'Rules_Report',
): ITableData => {
    // Implement conversion logic here
    const metadata: DatasetJsonMetadata = {
        datasetJSONCreationDateTime: new Date().toISOString(),
        datasetJSONVersion: '1.1',
        records: data[type].length,
        name: `core_report_${type}`,
        label: `CORE Report ${type}`,
        columns: [],
    };

    // Get columns metadata
    if (type === 'Issue_Details') {
        metadata.columns = [
            {
                itemOID: 'dataset',
                name: 'dataset',
                label: 'Dataset',
                dataType: 'string',
            },
            {
                itemOID: 'core_id',
                name: 'core_id',
                label: 'Core ID',
                dataType: 'string',
            },
            {
                itemOID: 'message',
                name: 'message',
                label: 'Message',
                dataType: 'string',
            },
            {
                itemOID: 'executability',
                name: 'executability',
                label: 'Executability',
                dataType: 'string',
            },
            {
                itemOID: 'USUBJID',
                name: 'USUBJID',
                label: 'USUBJID',
                dataType: 'string',
            },
            {
                itemOID: 'row',
                name: 'row',
                label: 'Row',
                dataType: 'string',
            },
            {
                itemOID: 'SEQ',
                name: 'SEQ',
                label: 'SEQ',
                dataType: 'string',
            },
            {
                itemOID: 'variables',
                name: 'variables',
                label: 'Variables',
                dataType: 'string',
            },
            {
                itemOID: 'values',
                name: 'values',
                label: 'Values',
                dataType: 'string',
            },
        ];
    } else if (type === 'Issue_Summary') {
        metadata.columns = [
            {
                itemOID: 'dataset',
                name: 'dataset',
                label: 'Dataset',
                dataType: 'string',
                length: 5,
            },
            {
                itemOID: 'core_id',
                name: 'core_id',
                label: 'Core ID',
                dataType: 'string',
                length: 5,
            },
            {
                itemOID: 'message',
                name: 'message',
                label: 'Message',
                dataType: 'string',
                length: 85,
            },
            {
                itemOID: 'issues',
                name: 'issues',
                label: 'Issues',
                dataType: 'integer',
                length: 5,
            },
        ];
    } else if (type === 'Rules_Report') {
        metadata.columns = [
            {
                itemOID: 'core_id',
                name: 'core_id',
                label: 'Core ID',
                dataType: 'string',
            },
            {
                itemOID: 'version',
                name: 'version',
                label: 'Version',
                dataType: 'string',
            },
            {
                itemOID: 'cdisc_rule_id',
                name: 'cdisc_rule_id',
                label: 'CDISC Rule ID',
                dataType: 'string',
            },
            {
                itemOID: 'fda_rule_id',
                name: 'fda_rule_id',
                label: 'FDA Rule ID',
                dataType: 'string',
            },
            {
                itemOID: 'message',
                name: 'message',
                label: 'Message',
                dataType: 'string',
            },
            {
                itemOID: 'status',
                name: 'status',
                label: 'Status',
                dataType: 'string',
            },
        ];
    }
    // Form header;
    const header: ITableData['header'] = metadata.columns.map((col) => {
        const item: {
            id: string;
            label: string;
            cell?: (cell: CoreCell<ITableRow, unknown>) => React.JSX.Element;
        } = {
            id: col.itemOID,
            label: col.label,
        };

        if (col.itemOID === 'status') {
            item.cell = renderStatus;
        }

        return item;
    });

    // Add row number
    const updatedData = data[type] as unknown as ITableRow[];

    const result: ITableData = {
        header,
        metadata,
        data: updatedData,
        appliedFilter: null,
        fileId: type,
    };

    return result;
};

export default convertToDataset;
