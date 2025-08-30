import { IHeaderCell } from 'interfaces/common';

const columnDefs: IHeaderCell[] = [
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

export default columnDefs;
