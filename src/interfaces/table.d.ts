import { DatasetJsonMetadata, Filter } from 'interfaces/api.d';

export type SortOrder = 'asc' | 'desc';
export type AlignType = 'left' | 'center' | 'right' | 'justify';
export type StyleObject = { [name: string]: string | number };

export interface IHeaderCell {
    /** Property containing column value */
    id: string;
    /** Column label */
    label: string;
    /** Column is hidden */
    hidden?: boolean;
    /** True for the id variable, required in case of selection */
    key?: boolean;
    /** Custom formatter for the column */
    /** Disable sorting for the column */
    disableSort?: boolean;
    /** Controls whether padding is enabled */
    disablePadding?: boolean;
    /** Align column: right, left, ... */
    align?: AlignType;
    /** Controls whether the column should be searchable */
    searchable?: boolean;
    /** Use that column as an order column, possible values: asc, desc */
    defaultOrder?: SortOrder;
    /** Size in px */
    size?: number;
    /** Type */
    type?: string;
    /** Style applied to the column */
    style?: StyleObject;
    /** Whether a filter is created for the column in the general toolbar */
    filter?: boolean;
}

export interface ITableRow {
    [key: string]: string | number | boolean | null;
}

export interface ITableData {
    header: IHeaderCell[];
    metadata: DatasetJsonMetadata;
    data: ITableRow[];
    appliedFilter: Filter | null;
}
