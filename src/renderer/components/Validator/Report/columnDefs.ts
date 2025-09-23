import { IHeaderCell } from 'interfaces/common';

const summary: IHeaderCell[] = [
    {
        id: '#',
        label: '#',
        type: 'string',
        size: 45,
    },
    {
        id: 'dataset',
        label: 'Dataset',
        type: 'string',
        size: 100,
    },
    {
        id: 'core_id',
        label: 'Core ID',
        type: 'string',
        size: 120,
    },
    {
        id: 'message',
        label: 'Message',
        type: 'string',
        minSize: 200,
    },
    {
        id: 'issues',
        label: 'Issues',
        type: 'integer',
        size: 120,
    },
];

const details: IHeaderCell[] = [
    {
        id: '#',
        label: '#',
        type: 'string',
        size: 45,
    },
    {
        id: 'dataset',
        label: 'Dataset',
        type: 'string',
        size: 100,
    },
    {
        id: 'core_id',
        label: 'Core ID',
        type: 'string',
        size: 120,
    },
    {
        id: 'message',
        label: 'Message',
        type: 'string',
        minSize: 200,
    },
    {
        id: 'USUBJID',
        label: 'USUBJID',
        type: 'string',
        minSize: 100,
    },
    {
        id: 'row',
        label: 'Row',
        type: 'integer',
        size: 80,
        style: { padding: 0 },
    },
    {
        id: 'SEQ',
        label: 'SEQ',
        type: 'integer',
        size: 80,
    },
    {
        id: 'variables',
        label: 'Variables',
        type: 'string',
        minSize: 150,
        style: { padding: 0 },
    },
    {
        id: 'values',
        label: 'Values',
        type: 'string',
        minSize: 150,
    },
];

const rules: IHeaderCell[] = [
    {
        id: '#',
        label: '#',
        type: 'string',
        size: 45,
    },
    {
        id: 'core_id',
        label: 'Core ID',
        type: 'string',
        size: 120,
    },
    {
        id: 'version',
        label: 'Version',
        type: 'string',
        size: 90,
    },
    {
        id: 'cdisc_rule_id',
        label: 'CDISC Rule ID',
        type: 'string',
        minSize: 100,
        maxSize: 185,
    },
    {
        id: 'fda_rule_id',
        label: 'FDA Rule ID',
        type: 'string',
        size: 110,
    },
    {
        id: 'message',
        label: 'Message',
        type: 'string',
        minSize: 200,
    },
    {
        id: 'status',
        label: 'Status',
        type: 'string',
        size: 130,
        style: { padding: 0 },
    },
];

const columnDefs = {
    summary,
    details,
    rules,
};

export default columnDefs;
